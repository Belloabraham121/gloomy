import Anthropic from "@anthropic-ai/sdk";
import type { A2uiPayload } from "@gloomy/a2ui-spec";
import {
  ToolUseError,
  validatePayload,
  type ChatMessage,
} from "./shared.js";
import { SYSTEM_PROMPT } from "./system-prompt.js";
import { a2uiToolSpecs } from "./tools.js";

export const ANTHROPIC_MODEL =
  process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";

const anthropicTools: Anthropic.Tool[] = a2uiToolSpecs.map((spec) => ({
  name: spec.name,
  description: spec.description,
  input_schema: spec.jsonSchema as Anthropic.Tool["input_schema"],
}));

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

function extractToolUse(
  message: Anthropic.Message,
): Anthropic.ToolUseBlock | null {
  const block = message.content.find((b) => b.type === "tool_use");
  return (block as Anthropic.ToolUseBlock | undefined) ?? null;
}

/**
 * One turn of the A2UI tool-use loop against Claude: ask it to pick a
 * component, validate the arguments, and retry once with the validation
 * error fed back as a tool_result if the first attempt was malformed.
 */
export async function runAnthropicToolUseTurn(
  client: AnthropicMessagesClient,
  messages: ChatMessage[],
): Promise<A2uiPayload> {
  const anthropicMessages: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const first = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: anthropicTools,
    tool_choice: { type: "any" },
    messages: anthropicMessages,
  });

  const firstToolUse = extractToolUse(first);
  if (!firstToolUse) {
    throw new ToolUseError("Claude did not call a tool");
  }

  try {
    return validatePayload(firstToolUse.name, firstToolUse.input);
  } catch (err) {
    if (!(err instanceof ToolUseError)) throw err;

    const retry = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: anthropicTools,
      tool_choice: { type: "any" },
      messages: [
        ...anthropicMessages,
        { role: "assistant", content: first.content },
        {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: firstToolUse.id,
              content: err.message,
              is_error: true,
            },
          ],
        },
      ],
    });

    const retryToolUse = extractToolUse(retry);
    if (!retryToolUse) {
      throw new ToolUseError("Claude did not call a tool on retry");
    }
    return validatePayload(retryToolUse.name, retryToolUse.input);
  }
}
