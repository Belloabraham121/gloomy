import { extractText, getDocumentProxy } from "unpdf";

/**
 * Extracts raw text from a PDF buffer. Pure function - no network, no API
 * key - so it's fully unit-testable without any LLM/embedding credentials.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const document = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(document, { mergePages: true });
  return text.trim();
}
