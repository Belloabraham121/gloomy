import { eq, sql } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { chunks } from "../db/schema.js";
import { embedText } from "./embeddings.js";

export interface RetrievedChunk {
  content: string;
}

/**
 * Embeds the query and returns the k nearest chunks (pgvector cosine
 * distance, `<=>`) scoped to a single source document. Returns [] rather
 * than throwing if there's no database - callers decide whether an empty
 * grounding context is fatal.
 */
export async function retrieveChunks(
  sourceId: string,
  query: string,
  k = 5,
): Promise<RetrievedChunk[]> {
  const db = getDb();
  if (!db) return [];

  const queryEmbedding = await embedText(query);

  return db
    .select({ content: chunks.content })
    .from(chunks)
    .where(eq(chunks.sourceId, sourceId))
    .orderBy(sql`${chunks.embedding} <=> ${JSON.stringify(queryEmbedding)}`)
    .limit(k);
}

export function formatGroundingContext(
  chunks: RetrievedChunk[],
  title: string,
): string | null {
  if (chunks.length === 0) return null;
  const excerpts = chunks
    .map((c, i) => `[Excerpt ${i + 1}]\n${c.content}`)
    .join("\n\n");
  return `The user has uploaded a document titled "${title}". Ground your answer in the following excerpts from it - prefer them over your own background knowledge, and don't invent details the excerpts don't support:\n\n${excerpts}`;
}
