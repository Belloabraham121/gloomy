import { eq } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { sources } from "../db/schema.js";
import { formatGroundingContext, retrieveChunks } from "./retrieve.js";

/**
 * Resolves a documentId into a grounding block for the system prompt.
 * Shared by /api/chat and /api/agent/task. Best-effort: no documentId, no
 * database, an unknown document, or a DB failure all degrade to null
 * (ungrounded generation) - grounding must never take down a request.
 */
export async function buildGroundingContext(
  documentId: string | undefined,
  question: string,
): Promise<string | null> {
  if (!documentId) return null;
  const db = getDb();
  if (!db) return null;

  try {
    const [source] = await db
      .select({ title: sources.title })
      .from(sources)
      .where(eq(sources.id, documentId))
      .limit(1);
    if (!source) return null;

    const relevantChunks = await retrieveChunks(documentId, question);
    return formatGroundingContext(relevantChunks, source.title);
  } catch (err) {
    console.error("buildGroundingContext failed (ungrounded fallback):", err);
    return null;
  }
}
