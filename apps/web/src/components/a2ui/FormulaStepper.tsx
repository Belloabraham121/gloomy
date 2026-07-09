"use client";

import { useState } from "react";
import type { FormulaStepperProps } from "@gloomy/a2ui-spec";

export function FormulaStepper({ title, terms }: FormulaStepperProps) {
  const [index, setIndex] = useState(0);
  const term = terms[index];
  const isFirst = index === 0;
  const isLast = index === terms.length - 1;

  return (
    <div className="a2ui-card">
      <h3 className="a2ui-title">{title}</h3>
      <p className="a2ui-step-progress">
        Term {index + 1} of {terms.length}
      </p>
      <div className="a2ui-formula-term">
        <code>{term.expression}</code>
        {term.note && <p>{term.note}</p>}
      </div>
      <div className="a2ui-step-nav">
        <button
          type="button"
          className="a2ui-button"
          disabled={isFirst}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          Back
        </button>
        <button
          type="button"
          className="a2ui-button primary"
          disabled={isLast}
          onClick={() => setIndex((i) => Math.min(terms.length - 1, i + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}
