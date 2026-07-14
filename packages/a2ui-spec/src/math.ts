import { z } from "zod/v4";

/**
 * Real LaTeX rendering (KaTeX on the frontend, see
 * apps/web/src/components/a2ui/Math.tsx). Not part of the legacy
 * `a2uiRegistry` tool-call union (see index.ts) since it only exists as an
 * OpenUI Lang component - there is no pre-OpenUI Math tool.
 */
export const mathSchema = z.object({
  latex: z.string().describe("A LaTeX expression, e.g. \\\\frac{a}{b} or E = mc^2 (no surrounding $ or \\\\[ \\\\])."),
  display: z
    .boolean()
    .optional()
    .describe("true for a centered block equation, false/omitted for inline math within a sentence."),
});

export type MathProps = z.infer<typeof mathSchema>;

export const mathDescription =
  "Renders a real LaTeX expression (KaTeX). Use for any formula, equation, or mathematical notation instead of writing it as plain text.";
