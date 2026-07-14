import { Router } from "express";
import { encodeLang, summarizeLangComponents } from "@gloomy/a2ui-spec";
import { getCachedResponse, setCachedResponse } from "../cache/cache.js";
import {
  getLlmProvider,
  LangGenerationError,
  MissingApiKeyError,
  type ChatMessage,
} from "../llm/index.js";
import { createLogger } from "../log.js";
import { recordProgress } from "../progress/progress.js";
import { buildGroundingContext } from "../rag/grounding.js";

const log = createLogger("api:chat");

export const chatRouter = Router();

// Defense in depth against a very long client-side thread: the 256kb body
// cap (see index.ts) already bounds total payload size, but this also
// bounds LLM context/token cost regardless of how much history the client
// decides to send. Keeps the most recent turns, since those are the most
// relevant to a follow-up.
const MAX_HISTORY_MESSAGES = 24;

interface ChatRequestBody {
  threadId?: string;
  sessionId?: string;
  documentId?: string;
  messages?: ChatMessage[];
}

/**
 * Builds the `viewUrl` every response carries alongside the raw `lang` -
 * so a non-web caller (an OKX A2MCP consumer hitting this endpoint
 * directly, not through apps/web) still gets a renderable link, not just
 * a string it has no renderer for. See docs/openui-migration.md.
 */
function buildViewUrl(lang: string): string {
  const webUrl = process.env.PUBLIC_WEB_URL;
  const path = `/d?p=${encodeLang(lang)}`;
  return webUrl ? `${webUrl.replace(/\/+$/, "")}${path}` : path;
}

chatRouter.post("/", async (req, res) => {
  const body = req.body as ChatRequestBody;
  const threadId = body.threadId ?? "unknown-thread";
  const allMessages = body.messages ?? [];
  const messages = allMessages.slice(-MAX_HISTORY_MESSAGES);
  const question = messages.at(-1)?.content;
  const documentId = body.documentId;

  if (messages.length === 0 || !question) {
    res.status(400).json({ error: "messages must be a non-empty array" });
    return;
  }

  // Cache key is deliberately just the latest user turn (+ documentId), not
  // the whole thread: hashing the full history would make the cache miss
  // on every follow-up (history is different every time by construction),
  // defeating the point of caching repeat questions. The tradeoff - the
  // exact same question asked with two different prior contexts can hit
  // the same cached component - is accepted for now; revisit if follow-up
  // caching turns out to matter (e.g. hash question + a digest of history).
  const cachedLang = await getCachedResponse(question, documentId);
  if (cachedLang) {
    const sessionId = await recordProgress({
      sessionId: body.sessionId,
      question,
      components: summarizeLangComponents(cachedLang),
    });
    res.json({
      threadId,
      sessionId: sessionId ?? undefined,
      cached: true,
      lang: cachedLang,
      viewUrl: buildViewUrl(cachedLang),
    });
    return;
  }

  let provider;
  try {
    provider = getLlmProvider();
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      res.status(501).json({ error: err.message });
      return;
    }
    throw err;
  }

  try {
    const groundingContext = await buildGroundingContext(documentId, question);
    const lang = await provider.runLangTurn(
      messages,
      groundingContext ?? undefined,
    );
    await setCachedResponse(question, lang, documentId);
    const sessionId = await recordProgress({
      sessionId: body.sessionId,
      question,
      components: summarizeLangComponents(lang),
    });
    res.json({
      threadId,
      sessionId: sessionId ?? undefined,
      cached: false,
      provider: provider.name,
      lang,
      viewUrl: buildViewUrl(lang),
    });
  } catch (err) {
    if (err instanceof LangGenerationError) {
      res.status(502).json({ error: err.message });
      return;
    }
    log.errorWith("chat route failed", err);
    res.status(500).json({ error: "Internal error running the generation turn" });
  }
});
