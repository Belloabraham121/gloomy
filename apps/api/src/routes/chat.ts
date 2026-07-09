import { Router } from "express";
import { getCachedResponse, setCachedResponse } from "../cache/cache.js";
import { getClaudeClient, MissingApiKeyError } from "../claude/client.js";
import {
  runToolUseTurn,
  ToolUseError,
  type ChatMessage,
} from "../claude/run-tool-use.js";
import { recordProgress } from "../progress/progress.js";

export const chatRouter = Router();

interface ChatRequestBody {
  threadId?: string;
  sessionId?: string;
  messages?: ChatMessage[];
}

chatRouter.post("/", async (req, res) => {
  const body = req.body as ChatRequestBody;
  const threadId = body.threadId ?? "unknown-thread";
  const messages = body.messages ?? [];
  const question = messages.at(-1)?.content;

  if (messages.length === 0 || !question) {
    res.status(400).json({ error: "messages must be a non-empty array" });
    return;
  }

  const cached = await getCachedResponse(question);
  if (cached) {
    const sessionId = await recordProgress({
      sessionId: body.sessionId,
      question,
      component: cached.component,
    });
    res.json({ threadId, sessionId: sessionId ?? undefined, cached: true, ...cached });
    return;
  }

  let client;
  try {
    client = getClaudeClient();
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      res.status(501).json({ error: err.message });
      return;
    }
    throw err;
  }

  try {
    const payload = await runToolUseTurn(client, messages);
    await setCachedResponse(question, payload);
    const sessionId = await recordProgress({
      sessionId: body.sessionId,
      question,
      component: payload.component,
    });
    res.json({ threadId, sessionId: sessionId ?? undefined, cached: false, ...payload });
  } catch (err) {
    if (err instanceof ToolUseError) {
      res.status(502).json({ error: err.message });
      return;
    }
    console.error("chat route failed:", err);
    res.status(500).json({ error: "Internal error running tool-use turn" });
  }
});
