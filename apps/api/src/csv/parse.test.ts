import { describe, expect, it } from "vitest";
import { parseCsv, summarizeCsv } from "./parse.js";

describe("parseCsv", () => {
  it("parses a simple comma-separated table with headers", () => {
    const result = parseCsv("day,revenue\nMon,100\nTue,150\n");
    expect(result.headers).toEqual(["day", "revenue"]);
    expect(result.rows).toEqual([
      ["Mon", "100"],
      ["Tue", "150"],
    ]);
  });

  it("handles quoted fields with embedded commas and escaped quotes", () => {
    const result = parseCsv(
      'name,note\n"Acme, Inc.","he said ""hi"""\n',
    );
    expect(result.headers).toEqual(["name", "note"]);
    expect(result.rows).toEqual([["Acme, Inc.", 'he said "hi"']]);
  });

  it("handles CRLF line endings and a trailing newline", () => {
    const result = parseCsv("a,b\r\n1,2\r\n3,4\r\n");
    expect(result.rows).toEqual([
      ["1", "2"],
      ["3", "4"],
    ]);
  });

  it("returns empty headers/rows for empty input", () => {
    const result = parseCsv("");
    expect(result.headers).toEqual([]);
    expect(result.rows).toEqual([]);
  });
});

describe("summarizeCsv", () => {
  it("infers numeric column stats and text column distinct counts", () => {
    const parsed = parseCsv(
      "day,revenue,region\nMon,100,East\nTue,150,West\nWed,200,East\n",
    );
    const summary = summarizeCsv(parsed, "sales.csv");

    expect(summary).toContain("3 row(s), 3 column(s)");
    expect(summary).toContain("revenue (numeric): min 100, max 200, avg 150");
    expect(summary).toContain("region (text): 2 distinct value(s)");
    expect(summary).toContain("Mon | 100 | East");
  });

  it("truncates the sample table and notes how many rows were hidden", () => {
    const header = "n\n";
    const body = Array.from({ length: 30 }, (_, i) => `${i}`).join("\n");
    const parsed = parseCsv(header + body);

    const summary = summarizeCsv(parsed, "big.csv", { sampleRows: 5 });
    expect(summary).toContain("showing the first 5 of 30 rows");
  });

  it("hard-caps the total output length", () => {
    const header = "col\n";
    const body = Array.from({ length: 500 }, (_, i) => `value-${i}`).join("\n");
    const parsed = parseCsv(header + body);

    const summary = summarizeCsv(parsed, "huge.csv", { maxChars: 500 });
    expect(summary.length).toBeLessThanOrEqual(500 + "\n(truncated)".length);
  });
});
