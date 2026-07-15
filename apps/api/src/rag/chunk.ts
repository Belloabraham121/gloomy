export interface ChunkOptions {
  /** Target chunk size in characters. */
  chunkSize?: number;
  /** Characters of trailing context carried into the next chunk, so a
   * concept split across a chunk boundary isn't lost to retrieval. */
  overlap?: number;
}

const DEFAULT_CHUNK_SIZE = 1000;
const DEFAULT_OVERLAP = 150;

/**
 * Hard ceiling for any single chunk. OpenAI `text-embedding-3-small`
 * rejects inputs over 8192 tokens (~4 chars/token ⇒ ~32k chars). We use
 * a conservatively lower char budget so dense / non-English text and
 * punctuation don't push past the token limit. Chunks above this are
 * window-sliced (see `forceSplit`).
 */
export const MAX_EMBED_CHARS = 12_000;

function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function splitIntoSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Window-slice a single oversized string into ≤`size` pieces with
 * `overlap` carried across boundaries. Used when a PDF "paragraph" is
 * one giant blob (common after PDF text extraction).
 */
function forceSplit(text: string, size: number, overlap: number): string[] {
  if (text.length <= size) return [text];
  const safeOverlap = Math.min(overlap, size - 1);
  const parts: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    parts.push(text.slice(start, end));
    if (end >= text.length) break;
    start = Math.max(0, end - safeOverlap);
  }
  return parts;
}

/**
 * Paragraph-aware chunker: prefers splitting on blank-line paragraph
 * breaks, falling back to sentence boundaries when the extracted text has
 * few or no blank lines (common for PDF-extracted text). Greedily packs
 * units up to `chunkSize`, carrying the last `overlap` characters of each
 * chunk into the start of the next so a concept split across a boundary
 * isn't lost to retrieval.
 *
 * Pure function - no I/O, no API key - so it's unit-testable in isolation.
 * Every returned chunk is guaranteed ≤ `MAX_EMBED_CHARS` so a giant PDF
 * blob never reaches the embeddings API.
 */
export function chunkText(text: string, options: ChunkOptions = {}): string[] {
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const overlap = Math.min(options.overlap ?? DEFAULT_OVERLAP, chunkSize - 1);

  let units = splitIntoParagraphs(text);
  if (units.length <= 1) {
    units = splitIntoSentences(text);
  }
  // PDF extractors often emit one enormous "paragraph" with no blank lines
  // and few sentence boundaries. Slice those before packing.
  units = units.flatMap((u) =>
    u.length > MAX_EMBED_CHARS ? forceSplit(u, MAX_EMBED_CHARS, overlap) : [u],
  );
  if (units.length === 0) return [];

  const chunks: string[] = [];
  let current = "";

  for (const unit of units) {
    const candidate = current ? `${current} ${unit}` : unit;
    if (candidate.length > chunkSize && current) {
      chunks.push(current);
      const tail = current.slice(-overlap);
      current = `${tail} ${unit}`.trim();
    } else {
      current = candidate;
    }
    // Soft packing can still leave a single oversized unit in `current`
    // (unit alone > chunkSize, or tip+unit > MAX_EMBED_CHARS). Cap it.
    if (current.length > MAX_EMBED_CHARS) {
      const parts = forceSplit(current, MAX_EMBED_CHARS, overlap);
      chunks.push(...parts.slice(0, -1));
      current = parts[parts.length - 1] ?? "";
    }
  }
  if (current) chunks.push(current);

  return chunks.flatMap((c) =>
    c.length > MAX_EMBED_CHARS
      ? forceSplit(c, MAX_EMBED_CHARS, overlap)
      : [c],
  );
}
