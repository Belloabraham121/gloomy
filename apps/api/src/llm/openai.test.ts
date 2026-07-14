import { describe, expect, it } from "vitest";
import type OpenAI from "openai";
import { runOpenAILangTurn, type OpenAIChatClient } from "./openai.js";
import { LangGenerationError } from "./shared.js";

const VALID_LANG = `title = TextContent("2 + 2", "large-heavy")
quiz = Quiz("What is 2 + 2?", [{"id":"a","label":"3"},{"id":"b","label":"4"}], "b", "2 + 2 = 4.")
wrap = Stack([quiz])
root = Stack([title, wrap])`;

function textCompletion(content: string): OpenAI.Chat.Completions.ChatCompletion {
  return {
    id: "chatcmpl_test",
    object: "chat.completion",
    created: 0,
    model: "gpt-4o",
    choices: [
      {
        index: 0,
        finish_reason: "stop",
        logprobs: null,
        message: { role: "assistant", content, refusal: null },
      },
    ],
  } as unknown as OpenAI.Chat.Completions.ChatCompletion;
}

describe("runOpenAILangTurn", () => {
  it("returns the validated openui-lang on a well-formed first response", async () => {
    const client: OpenAIChatClient = {
      chat: { completions: { create: async () => textCompletion(VALID_LANG) } },
    };

    const result = await runOpenAILangTurn(client, [
      { role: "user", content: "Quiz me on basic arithmetic" },
    ]);

    expect(result).toBe(VALID_LANG);
  });

  it("strips a markdown code fence the model added despite instructions not to", async () => {
    const client: OpenAIChatClient = {
      chat: {
        completions: {
          create: async () => textCompletion("```\n" + VALID_LANG + "\n```"),
        },
      },
    };

    const result = await runOpenAILangTurn(client, [{ role: "user", content: "hi" }]);
    expect(result).toBe(VALID_LANG);
  });

  it("rejects a program referencing a component outside the library", async () => {
    const client: OpenAIChatClient = {
      chat: {
        completions: {
          create: async () => textCompletion('root = NotARealComponent("x")'),
        },
      },
    };

    await expect(
      runOpenAILangTurn(client, [{ role: "user", content: "hi" }]),
    ).rejects.toThrow(LangGenerationError);
  });

  it("retries once when the first response fails to parse, and succeeds if the retry is valid", async () => {
    let callCount = 0;
    const client: OpenAIChatClient = {
      chat: {
        completions: {
          create: async () => {
            callCount++;
            return textCompletion(callCount === 1 ? "not lang at all" : VALID_LANG);
          },
        },
      },
    };

    const result = await runOpenAILangTurn(client, [{ role: "user", content: "hi" }]);

    expect(callCount).toBe(2);
    expect(result).toBe(VALID_LANG);
  });

  it("throws if the retry also fails to produce a resolvable root", async () => {
    const client: OpenAIChatClient = {
      chat: { completions: { create: async () => textCompletion("") } },
    };

    await expect(
      runOpenAILangTurn(client, [{ role: "user", content: "hi" }]),
    ).rejects.toThrow(LangGenerationError);
  });
});
