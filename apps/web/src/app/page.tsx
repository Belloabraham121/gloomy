"use client";

import { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { LogoMark } from "@/components/Logo";
import { LiveDemo } from "@/components/landing/LiveDemo";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const MARQUEE_ITEMS = [
  "Diagrams",
  "Quizzes",
  "Simulations",
  "Step-throughs",
  "Charts",
  "Formulas",
];

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

const CATALOG = [
  ["Diagram", "structure & relationships"],
  ["StepThrough", "processes, one step at a time"],
  ["Quiz", "check your understanding"],
  ["Simulation", "models you can perturb"],
  ["Chart", "quantities over time"],
  ["FormulaStepper", "derivations, term by term"],
] as const;

function Words({ text, className }: { text: string; className?: string }) {
  return (
    <span className="line">
      {text.split(" ").map((word, i, arr) => (
        <span key={i} className={`word ${className ?? ""}`}>
          {word}
          {i < arr.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}

export default function LandingPage() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // hero: masked word reveal
        gsap.from(".lv2-hero-title .word", {
          yPercent: 115,
          duration: 1,
          ease: "power4.out",
          stagger: 0.055,
          delay: 0.15,
        });
        gsap.from(".lv2-kicker, .lv2-hero-sub, .lv2-cta", {
          y: 26,
          autoAlpha: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.1,
          delay: 0.5,
        });

        // rotating badge
        gsap.to(".lv2-badge-ring", {
          rotation: 360,
          duration: 16,
          ease: "none",
          repeat: -1,
          transformOrigin: "50% 50%",
        });

        // marquee: seamless loop (track holds two identical halves)
        gsap.to(".lv2-marquee-track", {
          xPercent: -50,
          duration: 20,
          ease: "none",
          repeat: -1,
        });

        // scroll-triggered section reveals
        gsap.utils.toArray<HTMLElement>(".lv2-reveal").forEach((el) => {
          gsap.from(el, {
            y: 48,
            autoAlpha: 0,
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 86%" },
          });
        });

        // staggered card entrances
        gsap.from(".lv2-step", {
          y: 60,
          autoAlpha: 0,
          rotate: 0,
          duration: 0.8,
          ease: "back.out(1.4)",
          stagger: 0.12,
          scrollTrigger: { trigger: ".lv2-steps", start: "top 82%" },
        });
        gsap.from(".lv2-catalog-pill", {
          y: 34,
          autoAlpha: 0,
          duration: 0.55,
          ease: "back.out(1.7)",
          stagger: 0.07,
          scrollTrigger: { trigger: ".lv2-catalog", start: "top 86%" },
        });

        // footer wordmark slides up
        gsap.from(".lv2-footer-word", {
          yPercent: 40,
          autoAlpha: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: ".lv2-footer", start: "top 88%" },
        });
      });
    },
    { scope: root },
  );

  return (
    <main className="lv2" ref={root}>
      {/* hero */}
      <section className="lv2-hero lv2-wrap">
        <span className="lv2-kicker">
          <i />
          OKX AI agent — generative learning UI
        </span>

        <h1 className="lv2-hero-title">
          <Words text="Answers you" />
          <span className="line">
            <span className="word accent">can touch,</span>
          </span>
          <span className="line">
            <span className="word">not </span>
            <span className="word outline">walls</span>
            <span className="word"> of text.</span>
          </span>
        </h1>

        <div className="lv2-hero-row">
          <div>
            <p className="lv2-hero-sub">
              gloomy turns any question into one interactive component — a
              diagram, a step-through, a quiz, a live simulation — generated
              on the fly, grounded by a schema the model can&apos;t break.
            </p>
            <div className="lv2-cta">
              <Link href="/chat" className="lv2-btn coral">
                Try gloomy →
              </Link>
              <Link href="/gallery" className="lv2-btn">
                Browse components
              </Link>
            </div>
          </div>

          <div className="lv2-badge" aria-hidden>
            <svg viewBox="0 0 128 128" className="lv2-badge-ring">
              <defs>
                <path
                  id="lv2-badge-circle"
                  d="M 64,64 m -50,0 a 50,50 0 1,1 100,0 a 50,50 0 1,1 -100,0"
                />
              </defs>
              <text>
                <textPath href="#lv2-badge-circle">
                  okx ai agent ✦ generative ui ✦ ask · see · understand ✦
                </textPath>
              </text>
            </svg>
            <span className="lv2-badge-cloud">
              <LogoMark size={36} variant="ink" />
            </span>
          </div>
        </div>
      </section>

      {/* marquee ribbon */}
      <div className="lv2-marquee" aria-hidden>
        <div className="lv2-marquee-track">
          {[0, 1].map((half) => (
            <span key={half}>
              {MARQUEE_ITEMS.map((item) => (
                <span key={item}>{item} ✦</span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* live generative section */}
      <section className="lv2-section lv2-wrap">
        <p className="lv2-eyebrow lv2-reveal">Don&apos;t read about it — click it</p>
        <h2 className="lv2-h2 lv2-reveal">
          This part of the page
          <br />
          is <span className="accent">generative</span>
        </h2>
        <p className="lv2-section-sub lv2-reveal">
          Pick a prompt. Watch it type, then watch this very section reshape
          itself into a different component — that&apos;s the whole product,
          running on the real catalog.
        </p>
        <div className="lv2-reveal">
          <LiveDemo variant="lv2" />
        </div>
      </section>

      {/* how it works */}
      <section className="lv2-section lv2-wrap">
        <p className="lv2-eyebrow lv2-reveal">How it works</p>
        <h2 className="lv2-h2 lv2-reveal">
          Three steps,
          <br />
          <span className="accent">zero reading lists</span>
        </h2>
        <div className="lv2-steps">
          {HOW_IT_WORKS.map((step, i) => (
            <div className="lv2-step" key={step.title}>
              <span className="lv2-step-num">{i + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* catalog */}
      <section className="lv2-section lv2-wrap">
        <p className="lv2-eyebrow lv2-reveal">The catalog</p>
        <h2 className="lv2-h2 lv2-reveal">
          Six components.
          <br />
          <span className="accent">Infinite lessons.</span>
        </h2>
        <div className="lv2-catalog">
          {CATALOG.map(([name, blurb]) => (
            <div className="lv2-catalog-pill" key={name}>
              <strong>{name}</strong>
              <span>{blurb}</span>
            </div>
          ))}
        </div>
      </section>

      {/* usage */}
      <section className="lv2-section lv2-wrap">
        <p className="lv2-eyebrow lv2-reveal">How to use it</p>
        <h2 className="lv2-h2 lv2-reveal">
          On <span className="accent">OKX AI</span>, or
          <br />
          on your own machine
        </h2>
        <div className="lv2-usage">
          <div className="lv2-usage-card dark lv2-reveal">
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
          <div className="lv2-usage-card lv2-reveal">
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

      {/* footer */}
      <footer className="lv2-footer">
        <div className="lv2-wrap">
          <p className="lv2-footer-word">
            glo<em>o</em>my
          </p>
          <div className="lv2-footer-row">
            <LogoMark size={22} variant="ink" />
            <span>Built for the OKX AI Genesis Hackathon</span>
            <nav>
              <Link href="/chat">Chat</Link>
              <Link href="/gallery">Gallery</Link>
            </nav>
          </div>
        </div>
      </footer>
    </main>
  );
}
