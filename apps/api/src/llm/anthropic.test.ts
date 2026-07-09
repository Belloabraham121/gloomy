import { describe, expect, it } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import {
  runAnthropicToolUseTurn,
  type AnthropicMessagesClient,
} from "./anthropic.js";
import { ToolUseError } from "./shared.js";
import { validQuizInput } from "./test-fixtures.js";

function toolUseMessage(name: string, input: unknown): Anthropic.Message {
  return {
    id: "msg_test",
    type: "message",
    role: "assistant",
    model: "claude-sonnet-4-5",
    stop_reason: "tool_use",
    stop_sequence: null,
    usage: { input_tokens: 1, output_tokens: 1 },
    content: [
      {
        type: "tool_use",
        id: "toolu_test",
        name,
        input,
      },
    ],
  } as unknown as Anthropic.Message;
}

function textOnlyMessage(): Anthropic.Message {
  return {
    id: "msg_test",
    type: "message",
    role: "assistant",
    model: "claude-sonnet-4-5",
    stop_reason: "end_turn",
    stop_sequence: null,
    usage: { input_tokens: 1, output_tokens: 1 },
    content: [{ type: "text", text: "I refuse to call a tool." }],
  } as unknown as Anthropic.Message;
}

describe("runAnthropicToolUseTurn", () => {
  it("returns the validated component and props on a well-formed first response", async () => {
    const client: AnthropicMessagesClient = {
      messages: {
        create: async () => toolUseMessage("Quiz", validQuizInput),
      },
    };

    const result = await runAnthropicToolUseTurn(client, [
      { role: "user", content: "Quiz me on basic arithmetic" },
    ]);

    expect(result.component).toBe("Quiz");
    expect(result.props).toEqual(validQuizInput);
  });

  it("rejects a tool call naming a component outside the catalog", async () => {
    const client: AnthropicMessagesClient = {
      messages: {
        create: async () => toolUseMessage("NotARealComponent", {}),
      },
    };

    await expect(
      runAnthropicToolUseTurn(client, [{ role: "user", content: "hi" }]),
    ).rejects.toThrow(ToolUseError);
  });

  it("retries once when the first response fails schema validation, and succeeds if the retry is valid", async () => {
    let callCount = 0;
    const client: AnthropicMessagesClient = {
      messages: {
        create: async () => {
          callCount++;
          if (callCount === 1) {
            return toolUseMessage("Quiz", {
              question: "What is 2 + 2?",
              choices: [{ id: "a", label: "4" }],
            });
          }
          return toolUseMessage("Quiz", validQuizInput);
        },
      },
    };

    const result = await runAnthropicToolUseTurn(client, [
      { role: "user", content: "Quiz me on basic arithmetic" },
    ]);

    expect(callCount).toBe(2);
    expect(result.component).toBe("Quiz");
    expect(result.props).toEqual(validQuizInput);
  });

  it("throws if the retry also fails validation", async () => {
    const client: AnthropicMessagesClient = {
      messages: {
        create: async () => toolUseMessage("Quiz", { question: "incomplete" }),
      },
    };

    await expect(
      runAnthropicToolUseTurn(client, [{ role: "user", content: "hi" }]),
    ).rejects.toThrow(ToolUseError);
  });

  it("throws a ToolUseError if Claude responds with text instead of a tool call", async () => {
    const client: AnthropicMessagesClient = {
      messages: {
        create: async () => textOnlyMessage(),
      },
    };

    await expect(
      runAnthropicToolUseTurn(client, [{ role: "user", content: "hi" }]),
    ).rejects.toThrow(ToolUseError);
  });
});
