import OpenAI from "openai";
import type { A2uiPayload } from "@gloomy/a2ui-spec";
import {
  ToolUseError,
  validatePayload,
  type ChatMessage,
} from "./shared.js";
import { SYSTEM_PROMPT } from "./system-prompt.js";
import { a2uiToolSpecs } from "./tools.js";

export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o";

const openaiTools: OpenAI.Chat.Completions.ChatCompletionTool[] =
  a2uiToolSpecs.map((spec) => ({
    type: "function" as const,
    function: {
      name: spec.name,
      description: spec.description,
      parameters: spec.jsonSchema,
    },
  }));

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

interface FunctionCall {
  id: string;
  name: string;
  argumentsJson: string;
}

function extractFunctionCall(
  completion: OpenAI.Chat.Completions.ChatCompletion,
): FunctionCall | null {
  const call = completion.choices[0]?.message?.tool_calls?.find(
    (c) => c.type === "function",
  );
  if (!call || call.type !== "function") return null;
  return {
    id: call.id,
    name: call.function.name,
    argumentsJson: call.function.arguments,
  };
}

function parseArguments(call: FunctionCall): unknown {
  try {
    return JSON.parse(call.argumentsJson);
  } catch {
    throw new ToolUseError(
      `Arguments for ${call.name} were not valid JSON`,
    );
  }
}

/**
 * One turn of the A2UI tool-use loop against OpenAI (function calling):
 * same contract as the Anthropic handler — validate against the shared
 * Zod schema, one retry with the validation error fed back as a tool
 * message if the first attempt was malformed.
 */
export async function runOpenAIToolUseTurn(
  client: OpenAIChatClient,
  messages: ChatMessage[],
): Promise<A2uiPayload> {
  const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
    [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

  const first = await client.chat.completions.create({
    model: OPENAI_MODEL,
    max_tokens: 1024,
    tools: openaiTools,
    tool_choice: "required",
    messages: openaiMessages,
  });

  const firstCall = extractFunctionCall(first);
  if (!firstCall) {
    throw new ToolUseError("OpenAI did not call a tool");
  }

  try {
    return validatePayload(firstCall.name, parseArguments(firstCall));
  } catch (err) {
    if (!(err instanceof ToolUseError)) throw err;

    const retry = await client.chat.completions.create({
      model: OPENAI_MODEL,
      max_tokens: 1024,
      tools: openaiTools,
      tool_choice: "required",
      messages: [
        ...openaiMessages,
        first.choices[0].message,
        {
          role: "tool",
          tool_call_id: firstCall.id,
          content: `Error: ${err.message}. Call the tool again with corrected arguments.`,
        },
      ],
    });

    const retryCall = extractFunctionCall(retry);
    if (!retryCall) {
      throw new ToolUseError("OpenAI did not call a tool on retry");
    }
    return validatePayload(retryCall.name, parseArguments(retryCall));
  }
}
