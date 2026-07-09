"use client";

import { useMemo, useState } from "react";
import type { SimulationProps } from "@gloomy/a2ui-spec";
import { evaluateFormula } from "@/lib/safe-math";

export function Simulation({
  title,
  description,
  parameters,
  formula,
}: SimulationProps) {
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(parameters.map((p) => [p.id, p.defaultValue])),
  );

  const result = useMemo(() => {
    try {
      return { ok: true as const, value: evaluateFormula(formula, values) };
    } catch (err) {
      return { ok: false as const, message: (err as Error).message };
    }
  }, [formula, values]);

  return (
    <div className="a2ui-card">
      <h3 className="a2ui-title">{title}</h3>
      <p className="a2ui-simulation-description">{description}</p>

      {parameters.map((param) => (
        <label key={param.id} className="a2ui-simulation-slider">
          <span>
            {param.label}: <strong>{values[param.id]}</strong>
          </span>
          <input
            type="range"
            min={param.min}
            max={param.max}
            step={param.step}
            value={values[param.id]}
            onChange={(e) =>
              setValues((prev) => ({
                ...prev,
                [param.id]: Number(e.target.value),
              }))
            }
          />
        </label>
      ))}

      <div className="a2ui-simulation-result">
        <code>{formula}</code>
        {result.ok ? (
          <span className="a2ui-simulation-value">= {result.value.toFixed(3)}</span>
        ) : (
          <span className="a2ui-simulation-error">
            Could not evaluate: {result.message}
          </span>
        )}
      </div>
    </div>
  );
}
