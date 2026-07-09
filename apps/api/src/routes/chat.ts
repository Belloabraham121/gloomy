import { Router } from "express";
import { getClaudeClient, MissingApiKeyError } from "../claude/client.js";
import {
  runToolUseTurn,
  ToolUseError,
  type ChatMessage,
} from "../claude/run-tool-use.js";

export const chatRouter = Router();

interface ChatRequestBody {
  threadId?: string;
  messages?: ChatMessage[];
}

chatRouter.post("/", async (req, res) => {
  const body = req.body as ChatRequestBody;
  const threadId = body.threadId ?? "unknown-thread";
  const messages = body.messages ?? [];

  if (messages.length === 0) {
    res.status(400).json({ error: "messages must be a non-empty array" });
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
    res.json({ threadId, ...payload });
  } catch (err) {
    if (err instanceof ToolUseError) {
      res.status(502).json({ error: err.message });
      return;
    }
    console.error("chat route failed:", err);
    res.status(500).json({ error: "Internal error running tool-use turn" });
  }
});
