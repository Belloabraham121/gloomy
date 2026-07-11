import { BlockchainFigure } from "@/components/landing/BlockchainFigure";
import { LogoMark } from "@/components/Logo";
import { StemCellFigure } from "@/components/landing/StemCellFigure";

interface Scenario {
  key: string;
  question: string;
  figure: React.ReactNode;
  explanation: string[];
}

const SCENARIOS: Scenario[] = [
  {
    key: "stem-cells",
    question: "Explain how a stem cell differentiates into other cells",
    figure: <StemCellFigure />,
    explanation: [
      "A stem cell is unspecialized — it can keep renewing itself.",
      "Chemical signals push it down a path: it becomes a neuron, a muscle cell, or a red blood cell.",
      "Each specialized cell then does one job well — signaling, contracting, or carrying oxygen.",
    ],
  },
  {
    key: "blockchain",
    question: "Walk me through how a block gets added to a blockchain",
    figure: <BlockchainFigure />,
    explanation: [
      "Each block stores the previous block's hash — that link is what makes the chain tamper-evident.",
      "New transactions wait in the mempool until a validator bundles them into a candidate block.",
      "Once the network agrees it's valid, the block is appended and the transactions are final.",
    ],
  },
];

function LaptopScreen({ scenario, index }: { scenario: Scenario; index: number }) {
  return (
    <div className="lv3-theater-scene" data-scene={index}>
      {/* chrome */}
      <div className="lv3-theater-bar">
        <LogoMark size={16} variant="ink" />
        <span>gloomy</span>
      </div>

      <div className="lv3-theater-body">
        <div className="lv3-theater-q">{scenario.question}</div>

        <div className="lv3-theater-thinking status loading">
          Thinking about the best way to show this&hellip;
        </div>

        <div className="lv3-theater-answer">
          <div className="lv3-theater-figure">{scenario.figure}</div>
          <div className="lv3-theater-explain">
            {scenario.explanation.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Scroll-scrubbed "watch the product answer" theater: a laptop frame whose
 * screen plays two question→thinking→answer beats. page.tsx owns the pinned
 * master timeline; CSS defaults show scene 0 complete so reduced-motion /
 * no-JS still renders a finished screen.
 */
export function ScenarioTheater() {
  return (
    <section className="lv3-theater-section">
      <div className="lv3-showcase-head">
        <p className="lv3-eyebrow lv3-reveal">Ask it anything</p>
        <h2 className="lv3-h2 lv3-reveal">
          Watch it <em>think, then teach</em>
        </h2>
      </div>

      <div className="lv3-laptop">
        <div className="lv3-laptop-screen">
          {SCENARIOS.map((scenario, i) => (
            <LaptopScreen key={scenario.key} scenario={scenario} index={i} />
          ))}
        </div>
        <div className="lv3-laptop-deck">
          <span className="lv3-laptop-notch" />
        </div>
      </div>
    </section>
  );
}
