import { describe, expect, it } from "vitest";
import { cacheKeyFor } from "../cache/cache.js";
import { composeSystemPrompt } from "./compose-system.js";

describe("composeSystemPrompt", () => {
  it("appends a forced style block for non-auto styles", () => {
    const auto = composeSystemPrompt({ style: "auto" });
    const report = composeSystemPrompt({ style: "report" });
    expect(report.length).toBeGreaterThan(auto.length);
    expect(report).toContain("Forced composition style: REPORT");
    expect(report).toContain(auto.slice(0, 80));
  });

  it("appends grounding after the style block when both are present", () => {
    const prompt = composeSystemPrompt({
      style: "dashboard",
      groundingContext: "CSV context: revenue columns…",
    });
    expect(prompt.indexOf("DASHBOARD")).toBeLessThan(
      prompt.indexOf("CSV context"),
    );
  });
});

describe("cacheKeyFor style scoping", () => {
  it("produces different keys for the same question in different styles", () => {
    const q = "Show me Q3";
    expect(cacheKeyFor(q, undefined, "report")).not.toBe(
      cacheKeyFor(q, undefined, "lesson"),
    );
    expect(cacheKeyFor(q, undefined, "auto")).toBe(cacheKeyFor(q));
  });
});
