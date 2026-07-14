import { parseCsv, summarizeCsv } from "../csv/parse.js";
import { getDb } from "../db/client.js";
import { chunks, sources } from "../db/schema.js";
import { chunkText } from "./chunk.js";
import { embedBatch } from "./embeddings.js";
import { extractPdfText } from "./pdf.js";

export class MissingDatabaseError extends Error {
  constructor() {
    super(
      "DATABASE_URL is not set. Document upload needs a database to store the source and its chunks - see apps/api/.env.example.",
    );
    this.name = "MissingDatabaseError";
  }
}

export class EmptyDocumentError extends Error {}

export interface IngestResult {
  sourceId: string;
  title: string;
  chunkCount: number;
}

/**
 * Parses a PDF, chunks it, embeds every chunk, and writes one `sources` row
 * plus N `chunks` rows. Requires both a database (chunks have nowhere else
 * to live) and OPENAI_API_KEY (embeddings) - both throw clear, typed
 * errors rather than a generic 500, matching the rest of the app's
 * MissingApiKeyError conventions.
 */
export async function ingestPdf(
  buffer: Buffer,
  title: string,
  sessionId?: string,
): Promise<IngestResult> {
  const db = getDb();
  if (!db) throw new MissingDatabaseError();

  const text = await extractPdfText(buffer);
  if (!text) {
    throw new EmptyDocumentError(
      "Could not extract any text from this PDF - it may be scanned/image-only.",
    );
  }

  const textChunks = chunkText(text);
  if (textChunks.length === 0) {
    throw new EmptyDocumentError("This PDF produced no usable text chunks.");
  }

  // embedBatch throws MissingApiKeyError itself if OPENAI_API_KEY is unset.
  const embeddings = await embedBatch(textChunks);

  const [source] = await db
    .insert(sources)
    .values({ title, sessionId, status: "ready" })
    .returning({ id: sources.id });

  await db.insert(chunks).values(
    textChunks.map((content, i) => ({
      sourceId: source.id,
      content,
      embedding: embeddings[i],
    })),
  );

  return { sourceId: source.id, title, chunkCount: textChunks.length };
}

/**
 * Parses a CSV, summarizes it into one compact context block, and stores
 * it as a single `sources` row + one `chunks` row with a `null` embedding.
 *
 * Deliberately not the same pipeline as `ingestPdf`: a CSV upload only
 * needs to answer questions about itself in the very next turn or two, so
 * chunking it into paragraph-sized pieces and vector-embedding each one
 * (an OpenAI call, plus a similarity search that can drop rows the model
 * actually needed) buys nothing over handing the model the whole
 * summarized table at once. Storing it with a `null` embedding piggybacks
 * on the existing `sources`/`chunks` schema and `documentId` grounding
 * flow without a migration; `retrieve.ts` returns null-embedding chunks
 * directly, skipping the embed-the-query step entirely - so CSV grounding
 * needs only a database, never `OPENAI_API_KEY` (see docs/architecture.md).
 */
export async function ingestCsv(
  buffer: Buffer,
  title: string,
  sessionId?: string,
): Promise<IngestResult> {
  const db = getDb();
  if (!db) throw new MissingDatabaseError();

  const parsed = parseCsv(buffer.toString("utf-8"));
  if (parsed.headers.length === 0 || parsed.rows.length === 0) {
    throw new EmptyDocumentError(
      "Could not find any header row and data rows in this CSV.",
    );
  }

  const summary = summarizeCsv(parsed, title);

  const [source] = await db
    .insert(sources)
    .values({ title, sessionId, status: "ready" })
    .returning({ id: sources.id });

  await db.insert(chunks).values({
    sourceId: source.id,
    content: summary,
    embedding: null,
  });

  return { sourceId: source.id, title, chunkCount: 1 };
}
