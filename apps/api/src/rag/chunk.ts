export interface ChunkOptions {
  /** Target chunk size in characters. */
  chunkSize?: number;
  /** Characters of trailing context carried into the next chunk, so a
   * concept split across a chunk boundary isn't lost to retrieval. */
  overlap?: number;
}

const DEFAULT_CHUNK_SIZE = 1000;
const DEFAULT_OVERLAP = 150;

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
 * Paragraph-aware chunker: prefers splitting on blank-line paragraph
 * breaks, falling back to sentence boundaries when the extracted text has
 * few or no blank lines (common for PDF-extracted text). Greedily packs
 * units up to `chunkSize`, carrying the last `overlap` characters of each
 * chunk into the start of the next so a concept split across a boundary
 * isn't lost to retrieval.
 *
 * Pure function - no I/O, no API key - so it's unit-testable in isolation.
 */
export function chunkText(text: string, options: ChunkOptions = {}): string[] {
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const overlap = options.overlap ?? DEFAULT_OVERLAP;

  let units = splitIntoParagraphs(text);
  if (units.length <= 1) {
    units = splitIntoSentences(text);
  }
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
  }
  if (current) chunks.push(current);

  return chunks;
}
