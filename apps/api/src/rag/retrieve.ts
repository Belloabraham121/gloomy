import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { chunks } from "../db/schema.js";
import { embedText } from "./embeddings.js";

export interface RetrievedChunk {
  content: string;
}

/**
 * Returns the k nearest chunks for a source document, scoped to a single
 * `sourceId`. Returns [] rather than throwing if there's no database -
 * callers decide whether an empty grounding context is fatal.
 *
 * Two retrieval modes, picked per-source automatically:
 * - Chunks with a stored embedding (PDF ingestion) get a real pgvector
 *   cosine (`<=>`) nearest-neighbor query against the embedded query text.
 * - Chunks with no embedding (CSV ingestion - see `ingest.ts`) are
 *   returned as-is, unconditionally: there's usually just one, a complete
 *   summary of the dataset, so there's nothing to rank and no need to
 *   spend an embeddings call (or require `OPENAI_API_KEY`) just to fetch it.
 */
export async function retrieveChunks(
  sourceId: string,
  query: string,
  k = 5,
): Promise<RetrievedChunk[]> {
  const db = getDb();
  if (!db) return [];

  const directRows = await db
    .select({ content: chunks.content })
    .from(chunks)
    .where(and(eq(chunks.sourceId, sourceId), isNull(chunks.embedding)));
  if (directRows.length > 0) return directRows;

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
