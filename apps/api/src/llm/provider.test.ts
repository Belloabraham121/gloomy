import { describe, expect, it } from "vitest";
import { getLlmProvider } from "./index.js";
import { MissingApiKeyError } from "./shared.js";

// getLlmProvider takes the env as a parameter so these tests don't have to
// mutate (and race on) the real process.env.
const env = (overrides: Record<string, string>) =>
  overrides as NodeJS.ProcessEnv;

describe("getLlmProvider", () => {
  it("prefers Anthropic when both keys are set and nothing is forced", () => {
    const provider = getLlmProvider(
      env({ ANTHROPIC_API_KEY: "a", OPENAI_API_KEY: "o" }),
    );
    expect(provider.name).toBe("anthropic");
  });

  it("falls back to OpenAI when only OPENAI_API_KEY is set", () => {
    const provider = getLlmProvider(env({ OPENAI_API_KEY: "o" }));
    expect(provider.name).toBe("openai");
  });

  it("respects LLM_PROVIDER=openai even when both keys are set", () => {
    const provider = getLlmProvider(
      env({
        ANTHROPIC_API_KEY: "a",
        OPENAI_API_KEY: "o",
        LLM_PROVIDER: "openai",
      }),
    );
    expect(provider.name).toBe("openai");
  });

  it("fails loudly when LLM_PROVIDER forces a provider whose key is missing", () => {
    expect(() =>
      getLlmProvider(env({ OPENAI_API_KEY: "o", LLM_PROVIDER: "anthropic" })),
    ).toThrow(MissingApiKeyError);
  });

  it("rejects an unrecognized LLM_PROVIDER value", () => {
    expect(() =>
      getLlmProvider(env({ ANTHROPIC_API_KEY: "a", LLM_PROVIDER: "gemini" })),
    ).toThrow(MissingApiKeyError);
  });

  it("throws MissingApiKeyError when no keys are set at all", () => {
    expect(() => getLlmProvider(env({}))).toThrow(MissingApiKeyError);
  });
});
