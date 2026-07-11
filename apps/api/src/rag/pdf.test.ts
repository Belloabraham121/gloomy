import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { extractPdfText } from "./pdf.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = path.join(__dirname, "__fixtures__", "sample.pdf");

describe("extractPdfText", () => {
  it("extracts real text from a real PDF (no API key needed)", async () => {
    const buffer = await readFile(FIXTURE_PATH);
    const text = await extractPdfText(buffer);

    expect(text).toContain("Federated Learning");
    expect(text).toContain("central server");
    expect(text.length).toBeGreaterThan(200);
  });

  it("produces text that chunkText can split into multiple grounded chunks", async () => {
    const { chunkText } = await import("./chunk.js");
    const buffer = await readFile(FIXTURE_PATH);
    const text = await extractPdfText(buffer);
    const chunks = chunkText(text, { chunkSize: 300, overlap: 40 });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.some((c) => c.includes("aggregat"))).toBe(true);
  });
});
