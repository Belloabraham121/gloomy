import OpenAI from "openai";
import { LangGenerationError, validateLang, type ChatMessage } from "./shared.js";
import { SYSTEM_PROMPT } from "./system-prompt.js";

export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o";

const MAX_TOKENS = 4096;

/** The subset of the OpenAI SDK this module calls, so tests can pass a fake. */
export interface OpenAIChatClient {
  chat: {
    completions: {
      create: (
        params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
      ) => Promise<OpenAI.Chat.Completions.ChatCompletion>;
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

/**
 * One turn of the OpenUI Lang generation loop against OpenAI: same
 * contract as the Anthropic handler - plain chat completion (no function
 * calling), validate against the shared openui-lang parser, one retry
 * with the validation error fed back as a follow-up user message if the
 * first attempt didn't parse.
 */
export async function runOpenAILangTurn(
  client: OpenAIChatClient,
  messages: ChatMessage[],
  groundingContext?: string,
): Promise<string> {
  const system = groundingContext
    ? `${SYSTEM_PROMPT}\n\n${groundingContext}`
    : SYSTEM_PROMPT;
  const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
    [
      { role: "system", content: system },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

  const first = await client.chat.completions.create({
    model: OPENAI_MODEL,
    max_tokens: MAX_TOKENS,
    messages: openaiMessages,
  });

  const text = extractText(first);
  try {
    return validateLang(text);
  } catch (err) {
    if (!(err instanceof LangGenerationError)) throw err;

    const retry = await client.chat.completions.create({
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
    });

    return validateLang(extractText(retry));
  }
}
