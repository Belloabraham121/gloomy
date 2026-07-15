import OpenAI from "openai";
import { normalizeUiStyle } from "@gloomy/a2ui-spec";
import { composeSystemPrompt } from "./compose-system.js";
import {
  LangGenerationError,
  validateLang,
  type ChatMessage,
  type LangTurnOpts,
} from "./shared.js";

export type { LangTurnOpts };

export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o";

const MAX_TOKENS = 8192;

/** The subset of the OpenAI SDK this module calls, so tests can pass a fake. */
export interface OpenAIChatClient {
  chat: {
    completions: {
      create: (
        params: OpenAI.Chat.Completions.ChatCompletionCreateParams,
      ) => Promise<
        | OpenAI.Chat.Completions.ChatCompletion
        | AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>
      >;
    };
  };
}

let cachedClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey });
  }
  return cachedClient;
}

function extractText(completion: OpenAI.Chat.Completions.ChatCompletion): string {
  return (completion.choices[0]?.message?.content ?? "").trim();
}

async function collectStream(
  stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
  onDelta?: (partial: string) => void,
): Promise<string> {
  let text = "";
  for await (const chunk of stream) {
    const piece = chunk.choices[0]?.delta?.content ?? "";
    if (!piece) continue;
    text += piece;
    onDelta?.(text);
  }
  return text.trim();
}

/**
 * One turn of the OpenUI Lang generation loop against OpenAI: plain chat
 * completion, validate against the shared openui-lang parser, one retry
 * with the validation error fed back if the first attempt didn't parse.
 * When `onDelta` is provided, the first attempt streams token-by-token
 * (retry stays non-streaming — validation failures need a clean rewrite).
 */
export async function runOpenAILangTurn(
  client: OpenAIChatClient,
  messages: ChatMessage[],
  opts: LangTurnOpts = {},
): Promise<string> {
  const system = composeSystemPrompt({
    style: normalizeUiStyle(opts.style),
    groundingContext: opts.groundingContext,
  });
  const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
    [
      { role: "system", content: system },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

  const streamFirst = Boolean(opts.onDelta);
  const first = await client.chat.completions.create({
    model: OPENAI_MODEL,
    max_tokens: MAX_TOKENS,
    messages: openaiMessages,
    stream: streamFirst,
  });

  const text = streamFirst
    ? await collectStream(
        first as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
        opts.onDelta,
      )
    : extractText(first as OpenAI.Chat.Completions.ChatCompletion);

  try {
    return validateLang(text);
  } catch (err) {
    if (!(err instanceof LangGenerationError)) throw err;

    const retry = (await client.chat.completions.create({
      model: OPENAI_MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        ...openaiMessages,
        { role: "assistant", content: text || "(empty response)" },
        {
          role: "user",
          content: `Your last response failed validation: ${err.message}. Respond again with ONLY corrected openui-lang - no explanation, no markdown code fences.`,
        },
      ],
      stream: false,
    })) as OpenAI.Chat.Completions.ChatCompletion;

    const corrected = validateLang(extractText(retry));
    opts.onDelta?.(corrected);
    return corrected;
  }
}
