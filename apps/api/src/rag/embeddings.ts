import { getOpenAIClient } from "../llm/openai.js";
import { MissingApiKeyError } from "../llm/shared.js";

const EMBEDDING_MODEL = "text-embedding-3-small";

/**
 * Anthropic has no embeddings API, so document ingestion/retrieval always
 * needs OPENAI_API_KEY specifically - independent of whichever provider
 * LLM_PROVIDER picks for generation. Flagging that clearly here rather than
 * letting a Claude-only setup hit a confusing generic auth error.
 */
function requireOpenAIKey(): void {
  if (!process.env.OPENAI_API_KEY) {
    throw new MissingApiKeyError(
      "OPENAI_API_KEY is not set. Document upload/grounding needs it for embeddings, even if you're using LLM_PROVIDER=anthropic for generation - Anthropic has no embeddings API. Add it to apps/api/.env (see .env.example).",
    );
  }
}

export async function embedText(text: string): Promise<number[]> {
  requireOpenAIKey();
  const client = getOpenAIClient();
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return response.data[0].embedding;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  requireOpenAIKey();
  const client = getOpenAIClient();
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });
  return response.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}
