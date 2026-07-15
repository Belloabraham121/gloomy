import { describe, expect, it } from "vitest";
import { chunkText, MAX_EMBED_CHARS } from "./chunk.js";

describe("chunkText", () => {
  it("returns [] for empty input", () => {
    expect(chunkText("")).toEqual([]);
  });

  it("force-splits a giant PDF blob so no chunk exceeds the embed cap", () => {
    // Mimics PDF extractors that emit one enormous run with no blank lines
    // and no sentence punctuation — previously this became a single chunk
    // and OpenAI embeddings rejected it (max 8192 tokens).
    const blob = "abcdefghijklmnopqrstuvwxyz ".repeat(800); // ~22k chars
    expect(blob.length).toBeGreaterThan(MAX_EMBED_CHARS);
    const chunks = chunkText(blob, { chunkSize: 1000, overlap: 100 });
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) {
      expect(c.length).toBeLessThanOrEqual(MAX_EMBED_CHARS);
    }
    expect(chunks.join("")).toContain("abcdefghijklmnopqrstuvwxyz");
  });

  it("keeps short text as a single chunk", () => {
    const chunks = chunkText("A short paragraph about federated learning.");
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toContain("federated learning");
  });

  it("splits on paragraph breaks and packs multiple paragraphs per chunk when they fit", () => {
    const paragraphs = ["First paragraph.", "Second paragraph.", "Third paragraph."];
    const chunks = chunkText(paragraphs.join("\n\n"), { chunkSize: 1000 });
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toContain("First paragraph.");
    expect(chunks[0]).toContain("Third paragraph.");
  });

  it("starts a new chunk once chunkSize is exceeded", () => {
    const long = "word ".repeat(50).trim(); // ~249 chars
    const text = [long, long, long, long].join("\n\n"); // ~1000+ chars total
    const chunks = chunkText(text, { chunkSize: 500, overlap: 20 });
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) {
      // allow slack for the carried-over overlap prefix
      expect(c.length).toBeLessThan(600);
    }
  });

  it("carries overlap text from the end of one chunk into the start of the next", () => {
    const a = "AAAA ".repeat(100).trim();
    const b = "BBBB ".repeat(100).trim();
    const chunks = chunkText(`${a}\n\n${b}`, { chunkSize: 400, overlap: 50 });
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    const overlapText = chunks[0].slice(-50);
    expect(chunks[1].startsWith(overlapText.split(" ")[0])).toBe(true);
  });

  it("falls back to sentence splitting when the text has no paragraph breaks", () => {
    const text =
      "Federated learning trains a shared model across devices. Each device keeps its data local. Only model updates are sent to the server.";
    const chunks = chunkText(text, { chunkSize: 60, overlap: 10 });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join(" ")).toContain("Federated learning");
  });
});
