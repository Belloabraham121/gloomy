import { describe, expect, it } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import {
  runAnthropicLangTurn,
  type AnthropicMessagesClient,
} from "./anthropic.js";
import { LangGenerationError } from "./shared.js";

const VALID_LANG = `title = TextContent("2 + 2", "large-heavy")
quiz = Quiz("What is 2 + 2?", [{"id":"a","label":"3"},{"id":"b","label":"4"}], "b", "2 + 2 = 4.")
wrap = Stack([quiz])
root = Stack([title, wrap])`;

function textMessage(text: string): Anthropic.Message {
  return {
    id: "msg_test",
    type: "message",
    role: "assistant",
    model: "claude-sonnet-4-5",
    stop_reason: "end_turn",
    stop_sequence: null,
    usage: { input_tokens: 1, output_tokens: 1 },
    content: [{ type: "text", text }],
  } as unknown as Anthropic.Message;
}

describe("runAnthropicLangTurn", () => {
  it("returns the validated openui-lang on a well-formed first response", async () => {
    const client: AnthropicMessagesClient = {
      messages: {
        create: async () => textMessage(VALID_LANG),
      },
    };

    const result = await runAnthropicLangTurn(client, [
      { role: "user", content: "Quiz me on basic arithmetic" },
    ]);

    expect(result).toBe(VALID_LANG);
  });

  it("strips a markdown code fence the model added despite instructions not to", async () => {
    const client: AnthropicMessagesClient = {
      messages: {
        create: async () => textMessage("```openui-lang\n" + VALID_LANG + "\n```"),
      },
    };

    const result = await runAnthropicLangTurn(client, [
      { role: "user", content: "hi" },
    ]);

    expect(result).toBe(VALID_LANG);
  });

  it("rejects a program referencing a component outside the library", async () => {
    const client: AnthropicMessagesClient = {
      messages: {
        create: async () => textMessage('root = NotARealComponent("x")'),
      },
    };

    await expect(
      runAnthropicLangTurn(client, [{ role: "user", content: "hi" }]),
    ).rejects.toThrow(LangGenerationError);
  });

  it("retries once when the first response fails to parse, and succeeds if the retry is valid", async () => {
    let callCount = 0;
    const client: AnthropicMessagesClient = {
      messages: {
        create: async () => {
          callCount++;
          if (callCount === 1) {
            return textMessage("I refuse to answer in openui-lang.");
          }
          return textMessage(VALID_LANG);
        },
      },
    };

    const result = await runAnthropicLangTurn(client, [
      { role: "user", content: "Quiz me on basic arithmetic" },
    ]);

    expect(callCount).toBe(2);
    expect(result).toBe(VALID_LANG);
  });

  it("throws if the retry also fails to produce a resolvable root", async () => {
    const client: AnthropicMessagesClient = {
      messages: {
        create: async () => textMessage(""),
      },
    };

    await expect(
      runAnthropicLangTurn(client, [{ role: "user", content: "hi" }]),
    ).rejects.toThrow(LangGenerationError);
  });
});
