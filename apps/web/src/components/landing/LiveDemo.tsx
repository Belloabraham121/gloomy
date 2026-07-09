"use client";

import { useEffect, useRef, useState } from "react";
import { Chart } from "@/components/a2ui/Chart";
import { Diagram } from "@/components/a2ui/Diagram";
import { Quiz } from "@/components/a2ui/Quiz";
import { Simulation } from "@/components/a2ui/Simulation";
import { StepThrough } from "@/components/a2ui/StepThrough";
import {
  sampleChart,
  sampleDiagram,
  sampleQuiz,
  sampleSimulation,
  sampleStepThrough,
} from "@/fixtures/sample-a2ui";

interface DemoState {
  key: string;
  prompt: string;
  chip: string;
  node: React.ReactNode;
}

const DEMO_STATES: DemoState[] = [
  {
    key: "diagram",
    chip: "Show it as a diagram",
    prompt: "Show me how a request flows through gloomy",
    node: <Diagram {...sampleDiagram} />,
  },
  {
    key: "steps",
    chip: "Walk me through it",
    prompt: "Walk me through it step by step instead",
    node: <StepThrough {...sampleStepThrough} />,
  },
  {
    key: "quiz",
    chip: "Quiz me instead",
    prompt: "Actually — quiz me on this",
    node: <Quiz {...sampleQuiz} />,
  },
  {
    key: "sim",
    chip: "Let me play with it",
    prompt: "Give me something I can play with",
    node: <Simulation {...sampleSimulation} />,
  },
  {
    key: "chart",
    chip: "Chart the numbers",
    prompt: "Chart the numbers for me",
    node: <Chart {...sampleChart} />,
  },
];

export function LiveDemo() {
  const [active, setActive] = useState(0);
  const [typed, setTyped] = useState(DEMO_STATES[0].prompt);
  const [phase, setPhase] = useState<"idle" | "typing">("idle");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  function choose(index: number) {
    if (index === active || phase === "typing") return;
    const target = DEMO_STATES[index];
    setPhase("typing");
    setTyped("");

    let i = 0;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      i++;
      setTyped(target.prompt.slice(0, i));
      if (i >= target.prompt.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        // brief beat after typing finishes, then morph the stage
        setTimeout(() => {
          setActive(index);
          setPhase("idle");
        }, 260);
      }
    }, 22);
  }

  const current = DEMO_STATES[active];

  return (
    <div className="demo-frame">
      <div className="demo-chrome" aria-hidden>
        <i />
        <i />
        <i />
        <span>gloomy — live</span>
      </div>

      <div className="demo-promptbar">
        <span className="demo-prompt-text">
          {typed}
          <i className={`demo-caret ${phase === "typing" ? "busy" : ""}`} />
        </span>
        <span className={`demo-status ${phase}`}>
          {phase === "typing" ? "generating…" : "rendered"}
        </span>
      </div>

      <div className="demo-stage" key={current.key}>
        {current.node}
      </div>

      <div className="demo-chips" role="group" aria-label="Try a different component">
        {DEMO_STATES.map((state, i) => (
          <button
            key={state.key}
            type="button"
            className={`demo-chip ${i === active ? "active" : ""}`}
            onClick={() => choose(i)}
            disabled={phase === "typing"}
          >
            {state.chip}
          </button>
        ))}
      </div>
    </div>
  );
}
