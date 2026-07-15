import { normalizeUiStyle, stylePromptBlock, type UiStyleId } from "@gloomy/a2ui-spec";
import { SYSTEM_PROMPT } from "./system-prompt.js";

/**
 * Assembles the full system string for one generation turn: base OpenUI
 * prompt + optional forced UI style + optional PDF/CSV grounding block.
 */
export function composeSystemPrompt(options: {
  style?: UiStyleId | string | null;
  groundingContext?: string | null;
}): string {
  const style = normalizeUiStyle(options.style);
  const styleBlock = stylePromptBlock(style);
  const parts = [
    SYSTEM_PROMPT,
    styleBlock,
    options.groundingContext?.trim() || null,
  ].filter((p): p is string => Boolean(p));
  return parts.join("\n\n");
}
