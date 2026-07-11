import type { A2uiPayload } from "@gloomy/a2ui-spec";
import {
  getAnthropicClient,
  runAnthropicToolUseTurn,
} from "./anthropic.js";
import { getOpenAIClient, runOpenAIToolUseTurn } from "./openai.js";
import { MissingApiKeyError, type ChatMessage } from "./shared.js";

export {
  MissingApiKeyError,
  ToolUseError,
  type ChatMessage,
} from "./shared.js";

export type LlmProviderName = "anthropic" | "openai";

export interface LlmProvider {
  name: LlmProviderName;
  runToolUseTurn: (
    messages: ChatMessage[],
    groundingContext?: string,
  ) => Promise<A2uiPayload>;
}

/**
 * Picks the LLM provider from the environment:
 * - LLM_PROVIDER=anthropic|openai forces one explicitly (and fails loudly
 *   if its key is missing, rather than silently falling back to the other).
 * - Otherwise: Anthropic if ANTHROPIC_API_KEY is set, else OpenAI if
 *   OPENAI_API_KEY is set. Anthropic first because it's the primary
 *   provider for this product; OpenAI is the alternate handler.
 */
export function getLlmProvider(env: NodeJS.ProcessEnv = process.env): LlmProvider {
  const forced = env.LLM_PROVIDER?.toLowerCase();

  if (forced && forced !== "anthropic" && forced !== "openai") {
    throw new MissingApiKeyError(
      `LLM_PROVIDER="${env.LLM_PROVIDER}" is not recognized. Use "anthropic" or "openai".`,
    );
  }

  const hasAnthropic = Boolean(env.ANTHROPIC_API_KEY);
  const hasOpenAI = Boolean(env.OPENAI_API_KEY);

  if (forced === "anthropic" && !hasAnthropic) {
    throw new MissingApiKeyError(
      "LLM_PROVIDER=anthropic but ANTHROPIC_API_KEY is not set. Add it to apps/api/.env (see .env.example).",
    );
  }
  if (forced === "openai" && !hasOpenAI) {
    throw new MissingApiKeyError(
      "LLM_PROVIDER=openai but OPENAI_API_KEY is not set. Add it to apps/api/.env (see .env.example).",
    );
  }

  const chosen: LlmProviderName | null =
    forced === "anthropic" || (!forced && hasAnthropic)
      ? "anthropic"
      : forced === "openai" || (!forced && hasOpenAI)
        ? "openai"
        : null;

  if (chosen === "anthropic") {
    return {
      name: "anthropic",
      runToolUseTurn: (messages, groundingContext) =>
        runAnthropicToolUseTurn(getAnthropicClient(), messages, groundingContext),
    };
  }
  if (chosen === "openai") {
    return {
      name: "openai",
      runToolUseTurn: (messages, groundingContext) =>
        runOpenAIToolUseTurn(getOpenAIClient(), messages, groundingContext),
    };
  }

  throw new MissingApiKeyError(
    "No LLM provider is configured. Set ANTHROPIC_API_KEY (Claude) or OPENAI_API_KEY in apps/api/.env (see .env.example); LLM_PROVIDER=anthropic|openai picks one explicitly when both are set.",
  );
}
