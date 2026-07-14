"use client";

import { useMemo } from "react";
import katex from "katex";
import { BlockMath, InlineMath } from "react-katex";
import type { MathProps } from "@gloomy/a2ui-spec";

/**
 * Real LaTeX rendering via KaTeX. New in the OpenUI migration (see
 * docs/openui-migration.md) - there was no equivalent pre-OpenUI, since the
 * old single-tool-call contract had nowhere to put a standalone formula
 * that wasn't part of FormulaStepper's term-by-term reveal.
 */
export function Math({ latex, display }: MathProps) {
  // KaTeX throws on malformed LaTeX; never let one bad expression from the
  // model take down the whole multi-block render.
  const errored = useMemo(() => {
    try {
      katex.renderToString(latex, { throwOnError: true });
      return false;
    } catch {
      return true;
    }
  }, [latex]);

  if (errored) {
    return <code className="a2ui-math-error">{latex}</code>;
  }

  return display ? (
    <div className="a2ui-math a2ui-math-block">
      <BlockMath errorColor="#ff6b6b">{latex}</BlockMath>
    </div>
  ) : (
    <span className="a2ui-math a2ui-math-inline">
      <InlineMath errorColor="#ff6b6b">{latex}</InlineMath>
    </span>
  );
}
