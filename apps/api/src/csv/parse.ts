export interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

/**
 * Minimal RFC-4180-ish CSV parser: handles quoted fields (with embedded
 * commas, newlines, and escaped `""` quotes) and both `\n`/`\r\n` line
 * endings. Deliberately hand-rolled instead of a dependency - the format
 * gloomy needs to support (a plain data export) doesn't need a full CSV
 * dialect engine, and this stays pure/unit-testable with no I/O.
 */
export function parseCsv(text: string): ParsedCsv {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, ""); // strip a UTF-8 BOM if present

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    // Skip fully-blank trailing lines (e.g. a trailing newline at EOF).
    if (!(row.length === 1 && row[0] === "")) rows.push(row);
    row = [];
  };

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      pushField();
    } else if (c === "\n") {
      pushRow();
    } else if (c === "\r") {
      // swallow; the following \n (if any) triggers the row push
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) pushRow();

  const [headers, ...dataRows] = rows;
  return { headers: headers ?? [], rows: dataRows };
}

type ColumnKind = "numeric" | "text";

interface ColumnStats {
  name: string;
  kind: ColumnKind;
  min?: number;
  max?: number;
  avg?: number;
  distinctCount?: number;
}

function isNumeric(value: string): boolean {
  if (value.trim() === "") return false;
  return Number.isFinite(Number(value));
}

function summarizeColumn(name: string, values: string[]): ColumnStats {
  const nonEmpty = values.filter((v) => v.trim() !== "");
  const numericCount = nonEmpty.filter(isNumeric).length;
  const isNumericColumn = nonEmpty.length > 0 && numericCount === nonEmpty.length;

  if (isNumericColumn) {
    const nums = nonEmpty.map(Number);
    const sum = nums.reduce((a, b) => a + b, 0);
    return {
      name,
      kind: "numeric",
      min: Math.min(...nums),
      max: Math.max(...nums),
      avg: Math.round((sum / nums.length) * 100) / 100,
    };
  }

  return {
    name,
    kind: "text",
    distinctCount: new Set(nonEmpty).size,
  };
}

export interface CsvSummaryOptions {
  /** Max data rows included as a sample table. */
  sampleRows?: number;
  /** Hard cap on the returned summary's character length. */
  maxChars?: number;
}

const DEFAULT_SAMPLE_ROWS = 15;
const DEFAULT_MAX_CHARS = 4000;

/**
 * Turns parsed CSV rows into a compact, LLM-ready text block: column names
 * + inferred type/stats, row count, and a bounded sample table - not the
 * full dataset. This is the "parse-to-context" alternative to full
 * RAG-embedding a CSV (see docs/architecture.md): a single data upload
 * only needs to answer questions about itself in the very next turn, so
 * embedding+chunking+vector-searching it buys nothing a direct, complete
 * (if summarized) context block doesn't already give for free - and it
 * skips an OpenAI embeddings call entirely.
 */
export function summarizeCsv(
  parsed: ParsedCsv,
  title: string,
  options: CsvSummaryOptions = {},
): string {
  const sampleRows = options.sampleRows ?? DEFAULT_SAMPLE_ROWS;
  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;

  const columns = parsed.headers.map((header, i) =>
    summarizeColumn(header || `column_${i + 1}`, parsed.rows.map((r) => r[i] ?? "")),
  );

  const columnLines = columns.map((c) =>
    c.kind === "numeric"
      ? `- ${c.name} (numeric): min ${c.min}, max ${c.max}, avg ${c.avg}`
      : `- ${c.name} (text): ${c.distinctCount} distinct value(s)`,
  );

  const sample = parsed.rows.slice(0, sampleRows);
  const tableLines = [
    parsed.headers.join(" | "),
    parsed.headers.map(() => "---").join(" | "),
    ...sample.map((r) => r.join(" | ")),
  ];
  const truncatedNote =
    parsed.rows.length > sample.length
      ? `\n(showing the first ${sample.length} of ${parsed.rows.length} rows)`
      : "";

  const text = [
    `Tabular data titled "${title}": ${parsed.rows.length} row(s), ${parsed.headers.length} column(s).`,
    `Columns:\n${columnLines.join("\n")}`,
    `Sample rows (use these exact values - never invent numbers - when charting, tabulating, or summarizing this data):\n${tableLines.join("\n")}${truncatedNote}`,
  ].join("\n\n");

  return text.length > maxChars ? `${text.slice(0, maxChars)}\n(truncated)` : text;
}
