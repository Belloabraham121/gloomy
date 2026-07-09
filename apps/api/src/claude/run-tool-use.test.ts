import { describe, expect, it } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import {
  runToolUseTurn,
  ToolUseError,
  type MessagesClient,
} from "./run-tool-use.js";

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

const validQuizInput = {
  question: "What is 2 + 2?",
  choices: [
    { id: "a", label: "3" },
    { id: "b", label: "4" },
  ],
  correctChoiceId: "b",
  explanation: "2 + 2 = 4.",
};

describe("runToolUseTurn", () => {
  it("returns the validated component and props on a well-formed first response", async () => {
    const client: MessagesClient = {
      messages: {
        create: async () => toolUseMessage("Quiz", validQuizInput),
      },
    };

    const result = await runToolUseTurn(client, [
      { role: "user", content: "Quiz me on basic arithmetic" },
    ]);

    expect(result.component).toBe("Quiz");
    expect(result.props).toEqual(validQuizInput);
  });

  it("rejects a tool call naming a component outside the catalog", async () => {
    const client: MessagesClient = {
      messages: {
        create: async () => toolUseMessage("NotARealComponent", {}),
      },
    };

    await expect(
      runToolUseTurn(client, [{ role: "user", content: "hi" }]),
    ).rejects.toThrow(ToolUseError);
  });

  it("retries once when the first response fails schema validation, and succeeds if the retry is valid", async () => {
    let callCount = 0;
    const client: MessagesClient = {
      messages: {
        create: async () => {
          callCount++;
          if (callCount === 1) {
            // Missing required "correctChoiceId" and "explanation".
            return toolUseMessage("Quiz", {
              question: "What is 2 + 2?",
              choices: [{ id: "a", label: "4" }],
            });
          }
          return toolUseMessage("Quiz", validQuizInput);
        },
      },
    };

    const result = await runToolUseTurn(client, [
      { role: "user", content: "Quiz me on basic arithmetic" },
    ]);

    expect(callCount).toBe(2);
    expect(result.component).toBe("Quiz");
    expect(result.props).toEqual(validQuizInput);
  });

  it("throws if the retry also fails validation", async () => {
    const client: MessagesClient = {
      messages: {
        create: async () =>
          toolUseMessage("Quiz", { question: "incomplete" }),
      },
    };

    await expect(
      runToolUseTurn(client, [{ role: "user", content: "hi" }]),
    ).rejects.toThrow(ToolUseError);
  });

  it("throws a ToolUseError if Claude responds with text instead of a tool call", async () => {
    const client: MessagesClient = {
      messages: {
        create: async () => textOnlyMessage(),
      },
    };

    await expect(
      runToolUseTurn(client, [{ role: "user", content: "hi" }]),
    ).rejects.toThrow(ToolUseError);
  });
});
