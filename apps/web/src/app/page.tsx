import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { LiveDemo } from "@/components/landing/LiveDemo";

const A2UI_COMPONENTS = [
  ["Diagram", "structure & relationships"],
  ["StepThrough", "processes, one step at a time"],
  ["Quiz", "check your understanding"],
  ["Simulation", "models you can perturb"],
  ["Chart", "quantities over time"],
  ["FormulaStepper", "derivations, term by term"],
] as const;

const HOW_IT_WORKS = [
  {
    title: "Ask anything",
    body: "Type a question the way you'd ask a friend. No prompt engineering, no format flags.",
  },
  {
    title: "The model picks a component",
    body: "Claude or GPT chooses the one component that fits best — from a fixed, schema-validated catalog it can't escape.",
  },
  {
    title: "You interact, not scroll",
    body: "Step through it, answer it, drag its sliders. Understanding something beats reading about it.",
  },
];

export default function LandingPage() {
  return (
    <main className="landing">
      {/* drifting cloud backdrop */}
      <div className="clouds" aria-hidden>
        <i className="cloud c1" />
        <i className="cloud c2" />
        <i className="cloud c3" />
        <i className="cloud c4" />
        <span className="spark s1" />
        <span className="spark s2" />
        <span className="spark s3" />
      </div>

      {/* hero */}
      <section className="landing-hero">
        <div className="landing-mark float">
          <LogoMark size={84} />
        </div>
        <h1 className="landing-title">
          Answers you can <em>touch</em>,<br />
          not walls of text.
        </h1>
        <p className="landing-sub">
          gloomy turns any question into one interactive component — a
          diagram, a step-through, a quiz, a live simulation — generated on
          the fly, grounded by a schema the model can&apos;t break.
        </p>
        <div className="landing-cta">
          <Link href="/chat" className="a2ui-button primary big">
            Try gloomy
          </Link>
          <Link href="/gallery" className="a2ui-button big">
            Browse components
          </Link>
        </div>
      </section>

      {/* the interactive bit: this section of the page IS the product */}
      <section className="landing-section">
        <p className="hero-eyebrow">Don&apos;t read about it — click it</p>
        <h2 className="landing-h2">
          This part of the page is <em>generative</em>
        </h2>
        <p className="landing-section-sub">
          Pick a prompt below. Watch it type, then watch this very section
          reshape itself into a different component — that&apos;s the whole
          product, running on the real catalog.
        </p>
        <LiveDemo />
      </section>

      {/* how it works */}
      <section className="landing-section">
        <p className="hero-eyebrow">How it works</p>
        <h2 className="landing-h2">
          Three steps, <em>zero reading lists</em>
        </h2>
        <div className="landing-steps">
          {HOW_IT_WORKS.map((step, i) => (
            <div className="landing-step" key={step.title}>
              <span className="landing-step-num">{i + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* catalog strip */}
      <section className="landing-section">
        <p className="hero-eyebrow">The catalog</p>
        <h2 className="landing-h2">
          Six components. <em>Infinite lessons.</em>
        </h2>
        <div className="landing-catalog">
          {A2UI_COMPONENTS.map(([name, blurb]) => (
            <div className="landing-catalog-card" key={name}>
              <code>{name}</code>
              <span>{blurb}</span>
            </div>
          ))}
        </div>
      </section>

      {/* using it via okx.ai */}
      <section className="landing-section">
        <p className="hero-eyebrow">How to use it</p>
        <h2 className="landing-h2">
          On <em>OKX AI</em>, or on your own machine
        </h2>
        <div className="landing-usage">
          <div className="landing-usage-card">
            <h3>From the OKX AI marketplace</h3>
            <ol>
              <li>
                Find <strong>gloomy</strong> on{" "}
                <a href="https://www.okx.ai" rel="noreferrer" target="_blank">
                  okx.ai
                </a>{" "}
                under agents.
              </li>
              <li>Ask it any question you&apos;d normally ask a chatbot.</li>
              <li>
                Get back a live component instead of paragraphs — interact
                with it right there.
              </li>
            </ol>
          </div>
          <div className="landing-usage-card">
            <h3>Run it yourself</h3>
            <ol>
              <li>
                Clone the repo &amp; <code>pnpm install</code>.
              </li>
              <li>
                Add <code>ANTHROPIC_API_KEY</code> or{" "}
                <code>OPENAI_API_KEY</code> to <code>apps/api/.env</code>.
              </li>
              <li>
                <code>pnpm dev</code> in <code>apps/api</code> and{" "}
                <code>apps/web</code>, then open{" "}
                <Link href="/chat">the chat</Link>.
              </li>
            </ol>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <LogoMark size={22} />
        <span>gloomy — built for the OKX AI Genesis Hackathon</span>
        <nav>
          <Link href="/chat">Chat</Link>
          <Link href="/gallery">Gallery</Link>
        </nav>
      </footer>
    </main>
  );
}
