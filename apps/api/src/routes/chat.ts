import { Router } from "express";
import { getCachedResponse, setCachedResponse } from "../cache/cache.js";
import {
  getLlmProvider,
  MissingApiKeyError,
  ToolUseError,
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
  const cached = await getCachedResponse(question, documentId);
  if (cached) {
    const sessionId = await recordProgress({
      sessionId: body.sessionId,
      question,
      component: cached.component,
    });
    res.json({
      threadId,
      sessionId: sessionId ?? undefined,
      cached: true,
      ...cached,
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
    const payload = await provider.runToolUseTurn(
      messages,
      groundingContext ?? undefined,
    );
    await setCachedResponse(question, payload, documentId);
    const sessionId = await recordProgress({
      sessionId: body.sessionId,
      question,
      component: payload.component,
    });
    res.json({
      threadId,
      sessionId: sessionId ?? undefined,
      cached: false,
      provider: provider.name,
      ...payload,
    });
  } catch (err) {
    if (err instanceof ToolUseError) {
      res.status(502).json({ error: err.message });
      return;
    }
    log.errorWith("chat route failed", err);
    res.status(500).json({ error: "Internal error running tool-use turn" });
  }
});
