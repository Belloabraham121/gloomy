import { Router, type Response } from "express";
import {
  encodeLang,
  normalizeUiStyle,
  summarizeLangComponents,
  type UiStyleId,
} from "@gloomy/a2ui-spec";
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

const MAX_HISTORY_MESSAGES = 24;

interface ChatRequestBody {
  threadId?: string;
  sessionId?: string;
  documentId?: string;
  /** Composition style: auto | report | pitch | dashboard | lesson | form */
  style?: UiStyleId | string;
  /** When true (or Accept: text/event-stream), stream openui-lang deltas via SSE. */
  stream?: boolean;
  messages?: ChatMessage[];
}

function buildViewUrl(lang: string): string {
  const webUrl = process.env.PUBLIC_WEB_URL;
  const path = `/d?p=${encodeLang(lang)}`;
  return webUrl ? `${webUrl.replace(/\/+$/, "")}${path}` : path;
}

function wantsStream(req: {
  body: ChatRequestBody;
  get: (h: string) => string | undefined;
}): boolean {
  if (req.body.stream === true) return true;
  const accept = req.get("accept") ?? "";
  return accept.includes("text/event-stream");
}

function initSse(res: Response): void {
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
}

function sseWrite(res: Response, event: string, data: unknown): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

chatRouter.post("/", async (req, res) => {
  const body = req.body as ChatRequestBody;
  const threadId = body.threadId ?? "unknown-thread";
  const allMessages = body.messages ?? [];
  const messages = allMessages.slice(-MAX_HISTORY_MESSAGES);
  const question = messages.at(-1)?.content;
  const documentId = body.documentId;
  const style = normalizeUiStyle(body.style);
  const stream = wantsStream(req);

  if (messages.length === 0 || !question) {
    res.status(400).json({ error: "messages must be a non-empty array" });
    return;
  }

  const cachedLang = await getCachedResponse(question, documentId, style);
  if (cachedLang) {
    const sessionId = await recordProgress({
      sessionId: body.sessionId,
      question,
      components: summarizeLangComponents(cachedLang),
    });
    const payload = {
      threadId,
      sessionId: sessionId ?? undefined,
      cached: true,
      style,
      lang: cachedLang,
      viewUrl: buildViewUrl(cachedLang),
    };
    if (stream) {
      initSse(res);
      sseWrite(res, "delta", { lang: cachedLang });
      sseWrite(res, "done", payload);
      res.end();
      return;
    }
    res.json(payload);
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

    if (stream) {
      initSse(res);
      const lang = await provider.runLangTurn(messages, {
        groundingContext: groundingContext ?? undefined,
        style,
        onDelta: (partial) => sseWrite(res, "delta", { lang: partial }),
      });
      await setCachedResponse(question, lang, documentId, style);
      const sessionId = await recordProgress({
        sessionId: body.sessionId,
        question,
        components: summarizeLangComponents(lang),
      });
      sseWrite(res, "done", {
        threadId,
        sessionId: sessionId ?? undefined,
        cached: false,
        provider: provider.name,
        style,
        lang,
        viewUrl: buildViewUrl(lang),
      });
      res.end();
      return;
    }

    const lang = await provider.runLangTurn(messages, {
      groundingContext: groundingContext ?? undefined,
      style,
    });
    await setCachedResponse(question, lang, documentId, style);
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
      style,
      lang,
      viewUrl: buildViewUrl(lang),
    });
  } catch (err) {
    if (err instanceof LangGenerationError) {
      if (stream && !res.headersSent) {
        res.status(502).json({ error: err.message });
        return;
      }
      if (stream && res.headersSent) {
        sseWrite(res, "error", { error: err.message });
        res.end();
        return;
      }
      res.status(502).json({ error: err.message });
      return;
    }
    log.errorWith("chat route failed", err);
    if (stream && res.headersSent) {
      sseWrite(res, "error", { error: "Internal error running the generation turn" });
      res.end();
      return;
    }
    res.status(500).json({ error: "Internal error running the generation turn" });
  }
});
