"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Diagram } from "@/components/a2ui/Diagram";
import { StepThrough } from "@/components/a2ui/StepThrough";
import { blockchainStepThrough, stemCellDiagram } from "@/fixtures/sample-a2ui";

const AgentsScene = dynamic(
  () => import("@/components/landing/AgentsScene").then((m) => m.AgentsScene),
  { ssr: false },
);

function LazyAgentsView() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="lv3-scenario-3d">
      {visible && <AgentsScene />}
    </div>
  );
}

interface Scenario {
  key: string;
  prompt: string;
  node: React.ReactNode;
}

const SCENARIOS: Scenario[] = [
  {
    key: "stem-cells",
    prompt: "Explain how a stem cell differentiates into other cell types",
    node: <Diagram {...stemCellDiagram} />,
  },
  {
    key: "blockchain",
    prompt: "Walk me through how a block gets added to a blockchain",
    node: <StepThrough {...blockchainStepThrough} />,
  },
  {
    key: "agents",
    prompt: "Show me how multiple agents work together",
    node: <LazyAgentsView />,
  },
];

export function ScenarioReveal() {
  return (
    <section className="lv3-scenario-section">
      <div className="lv3-showcase-head">
        <p className="lv3-eyebrow lv3-reveal">Ask it anything</p>
        <h2 className="lv3-h2 lv3-reveal">
          Not just diagrams — <em>real understanding</em>
        </h2>
      </div>

      <div className="lv3-scenarios">
        {SCENARIOS.map((s) => (
          <div className="lv3-scenario" key={s.key} data-key={s.key}>
            <p className="lv3-scenario-prompt">{s.prompt}</p>
            <div className="lv3-scenario-thinking status loading">
              Thinking about the best way to show this&hellip;
            </div>
            <div className="lv3-scenario-result lv3-stage">{s.node}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
