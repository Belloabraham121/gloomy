"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Chart } from "@/components/a2ui/Chart";
import { Diagram } from "@/components/a2ui/Diagram";
import { Quiz } from "@/components/a2ui/Quiz";
import { Simulation } from "@/components/a2ui/Simulation";
import { StepThrough } from "@/components/a2ui/StepThrough";
import { LogoMark } from "@/components/Logo";
import {
  sampleChart,
  sampleDiagram,
  sampleQuiz,
  sampleSimulation,
  sampleStepThrough,
} from "@/fixtures/sample-a2ui";

gsap.registerPlugin(useGSAP);

interface DemoState {
  key: string;
  chip: string;
  icon: string;
  prompt: string;
  heading: string;
  node: React.ReactNode;
}

const DEMO_STATES: DemoState[] = [
  {
    key: "diagram",
    chip: "As a diagram",
    icon: "◇",
    prompt: "Show me how a request flows through gloomy",
    heading: "Diagram",
    node: <Diagram {...sampleDiagram} />,
  },
  {
    key: "steps",
    chip: "Step by step",
    icon: "≡",
    prompt: "Walk me through it step by step instead",
    heading: "StepThrough",
    node: <StepThrough {...sampleStepThrough} />,
  },
  {
    key: "quiz",
    chip: "Quiz me",
    icon: "?",
    prompt: "Actually — quiz me on this",
    heading: "Quiz",
    node: <Quiz {...sampleQuiz} />,
  },
  {
    key: "sim",
    chip: "Let me play",
    icon: "∿",
    prompt: "Give me something I can play with",
    heading: "Simulation",
    node: <Simulation {...sampleSimulation} />,
  },
  {
    key: "chart",
    chip: "Chart it",
    icon: "▁▃▆",
    prompt: "Chart the numbers for me",
    heading: "Chart",
    node: <Chart {...sampleChart} />,
  },
];

const SIDEBAR_ITEMS = ["Dashboard", "Components", "Sessions", "Analytics"];

export function LandingDashboard() {
  const [active, setActive] = useState(0);
  const [typed, setTyped] = useState(DEMO_STATES[0].prompt);
  const [phase, setPhase] = useState<"idle" | "typing">("idle");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  useGSAP(
    () => {
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (prefersReduced || !stageRef.current) return;
      gsap.fromTo(
        stageRef.current.firstElementChild,
        { y: 26, autoAlpha: 0, scale: 0.975, filter: "blur(5px)" },
        {
          y: 0,
          autoAlpha: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.6,
          ease: "power3.out",
        },
      );
    },
    { dependencies: [active], scope: stageRef },
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
        setTimeout(() => {
          setActive(index);
          setPhase("idle");
        }, 240);
      }
    }, 20);
  }

  const current = DEMO_STATES[active];

  return (
    <div className="lv3-demo">
      {/* the setting prompts */}
      <div className="lv3-chips" role="group" aria-label="Try a different component">
        {DEMO_STATES.map((state, i) => (
          <button
            key={state.key}
            type="button"
            className={`lv3-chip ${i === active ? "active" : ""}`}
            onClick={() => choose(i)}
            disabled={phase === "typing"}
          >
            <i aria-hidden>{state.icon}</i>
            {state.chip}
          </button>
        ))}
      </div>

      {/* the dashboard window */}
      <div className="lv3-dash">
        <aside className="lv3-dash-side">
          <span className="lv3-dash-logo">
            <LogoMark size={22} variant="ink" />
            gloomy
          </span>
          <nav>
            {SIDEBAR_ITEMS.map((item, i) => (
              <span
                key={item}
                className={`lv3-dash-nav ${i === 0 ? "active" : ""}`}
              >
                <i aria-hidden />
                {item}
              </span>
            ))}
          </nav>
        </aside>

        <div className="lv3-dash-main">
          <div className="lv3-dash-top">
            <span className="lv3-dash-crumb">
              Live demo <em>/</em> {current.heading}
            </span>
            <div className="lv3-dash-prompt">
              <span className="lv3-dash-prompt-text">
                {typed}
                <i
                  className={`lv3-caret ${phase === "typing" ? "busy" : ""}`}
                />
              </span>
              <span className={`lv3-dash-status ${phase}`}>
                {phase === "typing" ? "generating…" : "✦ rendered"}
              </span>
            </div>
          </div>

          <div className="lv3-dash-body">
            <h3 className="lv3-dash-heading">
              Your answer, as a <em>{current.heading}</em>
            </h3>
            <p className="lv3-dash-sub">
              One question in, one interactive component out — picked and
              filled by the model, validated by the schema.
            </p>

            <div className="lv3-stage" ref={stageRef}>
              <div key={current.key}>{current.node}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
