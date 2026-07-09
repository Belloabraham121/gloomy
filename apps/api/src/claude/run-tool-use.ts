import { a2uiRegistry, type A2uiComponentName, type A2uiPayload } from "@gloomy/a2ui-spec";
import type Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_MODEL } from "./client.js";
import { SYSTEM_PROMPT } from "./system-prompt.js";
import { a2uiTools } from "./tools.js";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** The subset of the Anthropic SDK client this module actually calls, so tests can pass a fake. */
export interface MessagesClient {
  messages: {
    create: (
      params: Anthropic.MessageCreateParamsNonStreaming,
    ) => Promise<Anthropic.Message>;
  };
}

export class ToolUseError extends Error {}

function isA2uiComponentName(name: string): name is A2uiComponentName {
  return name in a2uiRegistry;
}

function extractToolUse(message: Anthropic.Message): Anthropic.ToolUseBlock | null {
  const block = message.content.find((b) => b.type === "tool_use");
  return (block as Anthropic.ToolUseBlock | undefined) ?? null;
}

function validate(toolUse: Anthropic.ToolUseBlock): A2uiPayload {
  if (!isA2uiComponentName(toolUse.name)) {
    throw new ToolUseError(`Unknown component "${toolUse.name}"`);
  }
  const entry = a2uiRegistry[toolUse.name];
  const result = entry.schema.safeParse(toolUse.input);
  if (!result.success) {
    throw new ToolUseError(
      `Invalid props for ${toolUse.name}: ${result.error.message}`,
    );
  }
  return { component: toolUse.name, props: result.data } as A2uiPayload;
}

/**
 * Runs one turn of the A2UI tool-use loop: ask Claude to pick a component,
 * validate its arguments against the same Zod schema the frontend renders
 * with, and retry once with the validation error fed back if it's wrong.
 * Claude output is never trusted as-is - the schema is the actual gate.
 */
export async function runToolUseTurn(
  client: MessagesClient,
  messages: ChatMessage[],
): Promise<A2uiPayload> {
  const anthropicMessages: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const first = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: a2uiTools,
    tool_choice: { type: "any" },
    messages: anthropicMessages,
  });

  const firstToolUse = extractToolUse(first);
  if (!firstToolUse) {
    throw new ToolUseError("Claude did not call a tool");
  }

  try {
    return validate(firstToolUse);
  } catch (err) {
    if (!(err instanceof ToolUseError)) throw err;

    // One retry: hand the validation error back to Claude as a tool_result
    // so it can correct its own output, matching how OpenUI's docs describe
    // feeding parser errors back for an automated correction loop.
    const retry = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: a2uiTools,
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
    return validate(retryToolUse);
  }
}
