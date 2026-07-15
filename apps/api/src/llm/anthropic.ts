import Anthropic from "@anthropic-ai/sdk";
import { normalizeUiStyle } from "@gloomy/a2ui-spec";
import { composeSystemPrompt } from "./compose-system.js";
import {
  LangGenerationError,
  validateLang,
  type ChatMessage,
  type LangTurnOpts,
} from "./shared.js";

export type { LangTurnOpts };

export const ANTHROPIC_MODEL =
  process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";

const MAX_TOKENS = 8192;

/** The subset of the Anthropic SDK this module calls, so tests can pass a fake. */
export interface AnthropicMessagesClient {
  messages: {
    create: (
      params: Anthropic.MessageCreateParams,
    ) => Promise<
      | Anthropic.Message
      | AsyncIterable<Anthropic.MessageStreamEvent>
    >;
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

async function collectStream(
  stream: AsyncIterable<Anthropic.MessageStreamEvent>,
  onDelta?: (partial: string) => void,
): Promise<string> {
  let text = "";
  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      text += event.delta.text;
      onDelta?.(text);
    }
  }
  return text.trim();
}

/**
 * One turn of the OpenUI Lang generation loop against Claude. When
 * `onDelta` is set, the first attempt streams; the validation retry is
 * always non-streaming.
 */
export async function runAnthropicLangTurn(
  client: AnthropicMessagesClient,
  messages: ChatMessage[],
  opts: LangTurnOpts = {},
): Promise<string> {
  const anthropicMessages: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
  const system = composeSystemPrompt({
    style: normalizeUiStyle(opts.style),
    groundingContext: opts.groundingContext,
  });

  const streamFirst = Boolean(opts.onDelta);
  const first = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: MAX_TOKENS,
    system,
    messages: anthropicMessages,
    stream: streamFirst,
  });

  const text = streamFirst
    ? await collectStream(
        first as AsyncIterable<Anthropic.MessageStreamEvent>,
        opts.onDelta,
      )
    : extractText(first as Anthropic.Message);

  try {
    return validateLang(text);
  } catch (err) {
    if (!(err instanceof LangGenerationError)) throw err;

    const retry = (await client.messages.create({
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
      stream: false,
    })) as Anthropic.Message;

    const corrected = validateLang(extractText(retry));
    opts.onDelta?.(corrected);
    return corrected;
  }
}
