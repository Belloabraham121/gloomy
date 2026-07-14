import Anthropic from "@anthropic-ai/sdk";
import { LangGenerationError, validateLang, type ChatMessage } from "./shared.js";
import { SYSTEM_PROMPT } from "./system-prompt.js";

export const ANTHROPIC_MODEL =
  process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";

// Rich multi-block UI needs more room than the old single-tool-call
// payload did - a Stack of several components easily runs a few hundred
// tokens of openui-lang.
const MAX_TOKENS = 4096;

/** The subset of the Anthropic SDK this module calls, so tests can pass a fake. */
export interface AnthropicMessagesClient {
  messages: {
    create: (
      params: Anthropic.MessageCreateParamsNonStreaming,
    ) => Promise<Anthropic.Message>;
  };
}

let cachedClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  if (!cachedClient) {
    cachedClient = new Anthropic({ apiKey });
  }
  return cachedClient;
}

function extractText(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

/**
 * One turn of the OpenUI Lang generation loop against Claude: ask it to
 * respond entirely in openui-lang (system prompt sets the contract, no
 * tool_choice forcing needed since there's no tool call anymore), validate
 * the result, and retry once with the validation error fed back as a plain
 * follow-up message if the first attempt didn't parse.
 */
export async function runAnthropicLangTurn(
  client: AnthropicMessagesClient,
  messages: ChatMessage[],
  groundingContext?: string,
): Promise<string> {
  const anthropicMessages: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
  const system = groundingContext
    ? `${SYSTEM_PROMPT}\n\n${groundingContext}`
    : SYSTEM_PROMPT;

  const first = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: MAX_TOKENS,
    system,
    messages: anthropicMessages,
  });

  const text = extractText(first);
  try {
    return validateLang(text);
  } catch (err) {
    if (!(err instanceof LangGenerationError)) throw err;

    const retry = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages: [
        ...anthropicMessages,
        { role: "assistant", content: text || "(empty response)" },
        {
          role: "user",
          content: `Your last response failed validation: ${err.message}\n\nRespond again with ONLY corrected openui-lang - no explanation, no markdown code fences.`,
        },
      ],
    });

    return validateLang(extractText(retry));
  }
}
