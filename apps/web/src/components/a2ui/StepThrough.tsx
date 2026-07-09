"use client";

import { useState } from "react";
import type { StepThroughProps } from "@gloomy/a2ui-spec";

export function StepThrough({ title, steps }: StepThroughProps) {
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  return (
    <div className="a2ui-card">
      <h3 className="a2ui-title">{title}</h3>
      <p className="a2ui-step-progress">
        Step {index + 1} of {steps.length}
      </p>
      <div className="a2ui-step-body">
        <h4>{step.heading}</h4>
        <p>{step.body}</p>
        {step.highlight && (
          <div className="a2ui-step-highlight">{step.highlight}</div>
        )}
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
          onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}
