import { describe, expect, it } from "vitest";
import type OpenAI from "openai";
import { runOpenAIToolUseTurn, type OpenAIChatClient } from "./openai.js";
import { ToolUseError } from "./shared.js";
import { validQuizInput } from "./test-fixtures.js";

function functionCallCompletion(
  name: string,
  args: string,
): OpenAI.Chat.Completions.ChatCompletion {
  return {
    id: "chatcmpl_test",
    object: "chat.completion",
    created: 0,
    model: "gpt-4o",
    choices: [
      {
        index: 0,
        finish_reason: "tool_calls",
        logprobs: null,
        message: {
          role: "assistant",
          content: null,
          refusal: null,
          tool_calls: [
            {
              id: "call_test",
              type: "function",
              function: { name, arguments: args },
            },
          ],
        },
      },
    ],
  } as unknown as OpenAI.Chat.Completions.ChatCompletion;
}

function textOnlyCompletion(): OpenAI.Chat.Completions.ChatCompletion {
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
        message: {
          role: "assistant",
          content: "I refuse to call a tool.",
          refusal: null,
        },
      },
    ],
  } as unknown as OpenAI.Chat.Completions.ChatCompletion;
}

describe("runOpenAIToolUseTurn", () => {
  it("returns the validated component and props on a well-formed first response", async () => {
    const client: OpenAIChatClient = {
      chat: {
        completions: {
          create: async () =>
            functionCallCompletion("Quiz", JSON.stringify(validQuizInput)),
        },
      },
    };

    const result = await runOpenAIToolUseTurn(client, [
      { role: "user", content: "Quiz me on basic arithmetic" },
    ]);

    expect(result.component).toBe("Quiz");
    expect(result.props).toEqual(validQuizInput);
  });

  it("rejects a tool call naming a component outside the catalog", async () => {
    const client: OpenAIChatClient = {
      chat: {
        completions: {
          create: async () => functionCallCompletion("NotARealComponent", "{}"),
        },
      },
    };

    await expect(
      runOpenAIToolUseTurn(client, [{ role: "user", content: "hi" }]),
    ).rejects.toThrow(ToolUseError);
  });

  it("retries once when the first response fails schema validation, and succeeds if the retry is valid", async () => {
    let callCount = 0;
    const client: OpenAIChatClient = {
      chat: {
        completions: {
          create: async () => {
            callCount++;
            if (callCount === 1) {
              return functionCallCompletion(
                "Quiz",
                JSON.stringify({
                  question: "What is 2 + 2?",
                  choices: [{ id: "a", label: "4" }],
                }),
              );
            }
            return functionCallCompletion(
              "Quiz",
              JSON.stringify(validQuizInput),
            );
          },
        },
      },
    };

    const result = await runOpenAIToolUseTurn(client, [
      { role: "user", content: "Quiz me on basic arithmetic" },
    ]);

    expect(callCount).toBe(2);
    expect(result.component).toBe("Quiz");
    expect(result.props).toEqual(validQuizInput);
  });

  it("retries when the arguments are not valid JSON at all", async () => {
    let callCount = 0;
    const client: OpenAIChatClient = {
      chat: {
        completions: {
          create: async () => {
            callCount++;
            if (callCount === 1) {
              return functionCallCompletion("Quiz", "{not valid json!");
            }
            return functionCallCompletion(
              "Quiz",
              JSON.stringify(validQuizInput),
            );
          },
        },
      },
    };

    const result = await runOpenAIToolUseTurn(client, [
      { role: "user", content: "hi" },
    ]);

    expect(callCount).toBe(2);
    expect(result.component).toBe("Quiz");
  });

  it("throws if the retry also fails validation", async () => {
    const client: OpenAIChatClient = {
      chat: {
        completions: {
          create: async () =>
            functionCallCompletion(
              "Quiz",
              JSON.stringify({ question: "incomplete" }),
            ),
        },
      },
    };

    await expect(
      runOpenAIToolUseTurn(client, [{ role: "user", content: "hi" }]),
    ).rejects.toThrow(ToolUseError);
  });

  it("throws a ToolUseError if OpenAI responds with text instead of a tool call", async () => {
    const client: OpenAIChatClient = {
      chat: {
        completions: {
          create: async () => textOnlyCompletion(),
        },
      },
    };

    await expect(
      runOpenAIToolUseTurn(client, [{ role: "user", content: "hi" }]),
    ).rejects.toThrow(ToolUseError);
  });
});
