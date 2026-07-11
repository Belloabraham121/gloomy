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
