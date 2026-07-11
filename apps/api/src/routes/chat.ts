import { eq } from "drizzle-orm";
import { Router } from "express";
import { getCachedResponse, setCachedResponse } from "../cache/cache.js";
import { getDb } from "../db/client.js";
import { sources } from "../db/schema.js";
import {
  getLlmProvider,
  MissingApiKeyError,
  ToolUseError,
  type ChatMessage,
} from "../llm/index.js";
import { recordProgress } from "../progress/progress.js";
import { formatGroundingContext, retrieveChunks } from "../rag/retrieve.js";

export const chatRouter = Router();

interface ChatRequestBody {
  threadId?: string;
  sessionId?: string;
  documentId?: string;
  messages?: ChatMessage[];
}

async function buildGroundingContext(
  documentId: string | undefined,
  question: string,
): Promise<string | null> {
  if (!documentId) return null;
  const db = getDb();
  if (!db) return null;

  const [source] = await db
    .select({ title: sources.title })
    .from(sources)
    .where(eq(sources.id, documentId))
    .limit(1);
  if (!source) return null;

  const relevantChunks = await retrieveChunks(documentId, question);
  return formatGroundingContext(relevantChunks, source.title);
}

chatRouter.post("/", async (req, res) => {
  const body = req.body as ChatRequestBody;
  const threadId = body.threadId ?? "unknown-thread";
  const messages = body.messages ?? [];
  const question = messages.at(-1)?.content;
  const documentId = body.documentId;

  if (messages.length === 0 || !question) {
    res.status(400).json({ error: "messages must be a non-empty array" });
    return;
  }

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
    console.error("chat route failed:", err);
    res.status(500).json({ error: "Internal error running tool-use turn" });
  }
});
