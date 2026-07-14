import { createParser, type LibraryJSONSchema } from "@openuidev/lang-core";
import { OPENUI_LIBRARY_SCHEMA } from "./generated/openui-contract.js";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * The model's response couldn't be trusted as-is: either it didn't return
 * openui-lang at all (empty/no root), or it referenced a component name
 * that isn't in the library. Replaces the pre-migration `ToolUseError`
 * (there is no tool call to fail anymore - see docs/openui-migration.md).
 */
export class LangGenerationError extends Error {}

export class MissingApiKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingApiKeyError";
  }
}

// Server-side parser built from the exact JSON Schema apps/web's extended
// library produces (see apps/web/scripts/generate-openui-contract.ts) -
// this is what lets apps/api validate model output against the real
// component catalog without depending on React/react-ui itself.
const parser = createParser(OPENUI_LIBRARY_SCHEMA as unknown as LibraryJSONSchema);

const CODE_FENCE_RE = /^```(?:[\w-]*)\n([\s\S]*?)\n?```$/;

/** Strips a ```openui-lang ... ``` (or bare ```) fence if the model added one despite instructions not to. */
export function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(CODE_FENCE_RE);
  return match ? match[1].trim() : trimmed;
}

/**
 * The single gate both providers pass through: whatever text the model
 * returned is parsed as openui-lang and checked for the two failure modes
 * that actually matter - no resolvable `root` statement, or a reference to
 * a component name outside the library. Everything else (a missing
 * optional prop, a dropped unreachable statement, ...) is left to the
 * parser's own documented permissive behavior ("errors do not affect
 * rendering") rather than forcing a retry for cosmetic issues.
 */
export function validateLang(rawText: string): string {
  const lang = stripCodeFences(rawText);
  if (!lang) {
    throw new LangGenerationError("The model returned an empty response");
  }

  let result;
  try {
    result = parser.parse(lang);
  } catch (err) {
    throw new LangGenerationError(
      `openui-lang failed to parse: ${(err as Error).message}`,
    );
  }

  if (!result.root) {
    throw new LangGenerationError(
      "openui-lang has no resolvable 'root' statement",
    );
  }

  const unknownComponents = result.meta.errors.filter(
    (e) => e.code === "unknown-component",
  );
  if (unknownComponents.length > 0) {
    const names = Array.from(
      new Set(unknownComponents.map((e) => e.component)),
    ).join(", ");
    throw new LangGenerationError(
      `openui-lang references unknown component(s): ${names}`,
    );
  }

  return lang;
}
