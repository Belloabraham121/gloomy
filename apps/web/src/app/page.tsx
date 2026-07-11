"use client";

import { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ComponentShowcase } from "@/components/landing/ComponentShowcase";
import { LandingDashboard } from "@/components/landing/LandingDashboard";
import { PipelineDiagram } from "@/components/landing/PipelineDiagram";

gsap.registerPlugin(ScrollTrigger, useGSAP);

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

function Cloud({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 220 90" fill="none" aria-hidden>
      <ellipse cx="60" cy="60" rx="46" ry="26" fill="currentColor" />
      <ellipse cx="115" cy="45" rx="52" ry="32" fill="currentColor" />
      <ellipse cx="168" cy="62" rx="40" ry="22" fill="currentColor" />
    </svg>
  );
}

export default function LandingPage() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // hero entrance: words rise, token chips pop
        gsap.from(".lv3-hero-title .plain", {
          y: 34,
          autoAlpha: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.08,
          delay: 0.1,
        });
        gsap.from(".lv3-token", {
          scale: 0.6,
          autoAlpha: 0,
          rotate: () => gsap.utils.random(-8, 8),
          duration: 0.8,
          ease: "back.out(2)",
          stagger: 0.16,
          delay: 0.45,
        });
        gsap.from(".lv3-hero-sub, .lv3-cta-row", {
          y: 22,
          autoAlpha: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.12,
          delay: 0.7,
        });

        // clouds drift forever, each at its own pace
        gsap.utils.toArray<HTMLElement>(".lv3-cloud").forEach((cloud, i) => {
          gsap.to(cloud, {
            x: i % 2 === 0 ? 46 : -40,
            y: i % 2 === 0 ? 10 : -8,
            duration: gsap.utils.random(9, 14),
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          });
        });

        // the dashboard rises out of the meadow
        gsap.from(".lv3-demo", {
          y: 110,
          autoAlpha: 0,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: ".lv3-demo", start: "top 92%", once: true },
        });

        // sections below
        gsap.utils.toArray<HTMLElement>(".lv3-reveal").forEach((el) => {
          gsap.from(el, {
            y: 42,
            autoAlpha: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          });
        });
        gsap.from(".lv3-cards .lv3-card", {
          y: 44,
          autoAlpha: 0,
          duration: 0.7,
          ease: "back.out(1.3)",
          stagger: 0.1,
          scrollTrigger: { trigger: ".lv3-cards", start: "top 85%", once: true },
        });
        gsap.from(".lv3-usage .lv3-card", {
          y: 44,
          autoAlpha: 0,
          duration: 0.7,
          ease: "back.out(1.3)",
          stagger: 0.12,
          scrollTrigger: { trigger: ".lv3-usage", start: "top 88%", once: true },
        });

        // component showcase icons wobble forever once settled, on every
        // width - the entrance pop itself is width-specific, set up below
        gsap.utils.toArray<HTMLElement>(".lv3-showcase-icon").forEach((icon, i) => {
          gsap.to(icon, {
            rotate: i % 2 === 0 ? 10 : -10,
            duration: gsap.utils.random(2.2, 3.2),
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          });
        });

        // pipeline diagram: nodes pop, connecting lines draw in sequence
        const pipeEdges = gsap.utils.toArray<SVGPathElement>(".lv3-pipe-edge");
        pipeEdges.forEach((path) => {
          const length = path.getTotalLength();
          gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
        });
        const pipeNodes = gsap.utils.toArray<SVGGElement>(".lv3-pipe-node");
        if (pipeNodes.length > 0) {
          const pipeTl = gsap.timeline({
            scrollTrigger: {
              trigger: ".lv3-pipe-section",
              start: "top 80%",
              once: true,
            },
          });
          pipeNodes.forEach((node, i) => {
            pipeTl.from(
              node,
              { scale: 0.6, autoAlpha: 0, duration: 0.45, ease: "back.out(2)" },
              i === 0 ? 0 : "+=0.05",
            );
            if (pipeEdges[i]) {
              pipeTl.to(
                pipeEdges[i],
                { strokeDashoffset: 0, duration: 0.5, ease: "power2.inOut" },
                "<0.1",
              );
            }
          });
        }
      });

      // horizontal-scroll pin for the component showcase - desktop only,
      // a native swipeable strip takes over below 900px (see CSS)
      mm.add(
        "(min-width: 900px) and (prefers-reduced-motion: no-preference)",
        () => {
          const track = document.querySelector<HTMLElement>(".lv3-showcase-track");
          const viewport = document.querySelector<HTMLElement>(
            ".lv3-showcase-viewport",
          );
          if (!track || !viewport) return;

          // cards pop in with a playful over-rotation as the section arrives
          gsap.from(".lv3-showcase-card", {
            scale: 0.7,
            rotate: () => gsap.utils.random(-10, 10),
            autoAlpha: 0,
            duration: 0.6,
            ease: "back.out(1.7)",
            stagger: 0.08,
            scrollTrigger: { trigger: ".lv3-showcase", start: "top 75%", once: true },
          });

          const scrollAmount = () => track.scrollWidth - viewport.clientWidth;

          gsap.to(track, {
            x: () => -scrollAmount(),
            ease: "none",
            scrollTrigger: {
              trigger: ".lv3-showcase",
              start: "top top",
              end: () => "+=" + scrollAmount(),
              scrub: 1,
              pin: true,
              invalidateOnRefresh: true,
            },
          });
        },
      );

      mm.add(
        "(max-width: 899.98px) and (prefers-reduced-motion: no-preference)",
        () => {
          // mobile gets a simpler, non-rotated reveal - no pin/scrub, cards
          // are a native swipeable strip instead (see the CSS breakpoint)
          gsap.from(".lv3-showcase-card", {
            y: 30,
            autoAlpha: 0,
            duration: 0.6,
            ease: "power3.out",
            stagger: 0.1,
            scrollTrigger: { trigger: ".lv3-showcase", start: "top 82%", once: true },
          });
        },
      );

      const handleLoad = () => ScrollTrigger.refresh();
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    },
    { scope: root },
  );

  return (
    <main className="lv3" ref={root}>
      {/* sky + meadow scene */}
      <div className="lv3-scene" aria-hidden>
        <div className="lv3-sky" />
        <div className="lv3-dots" />
        <Cloud className="lv3-cloud c1" />
        <Cloud className="lv3-cloud c2" />
        <Cloud className="lv3-cloud c3" />
        <div className="lv3-hill h1" />
        <div className="lv3-hill h2" />
        <div className="lv3-hill h3" />
        <div className="lv3-flowers" />
      </div>

      {/* hero */}
      <section className="lv3-hero">
        <h1 className="lv3-hero-title">
          <span className="lv3-line">
            <span className="plain">Turn</span>
            <span className="lv3-token lilac">
              <i aria-hidden>?</i>
              <em>Questions</em>
            </span>
            <span className="plain">into</span>
          </span>
          <span className="lv3-line">
            <span className="plain">living</span>
            <span className="lv3-token peach">
              <i aria-hidden>✦</i>
              <em>Interfaces</em>
            </span>
          </span>
        </h1>

        <p className="lv3-hero-sub">
          gloomy answers with one interactive component — a diagram, a quiz,
          a live simulation — generated on the fly and grounded by a schema
          the model can&apos;t break.
        </p>

        <div className="lv3-cta-row">
          <Link href="/chat" className="lv3-cta">
            Ask your first question ↗
          </Link>
        </div>
      </section>

      {/* the generative dashboard, rising from the meadow */}
      <section className="lv3-demo-wrap">
        <LandingDashboard />
      </section>

      {/* below the fold: light editorial sections */}
      <div className="lv3-below">
        <section className="lv3-section">
          <p className="lv3-eyebrow lv3-reveal">How it works</p>
          <h2 className="lv3-h2 lv3-reveal">
            Three steps, <em>zero reading lists</em>
          </h2>
          <div className="lv3-cards">
            {HOW_IT_WORKS.map((step, i) => (
              <div className="lv3-card" key={step.title}>
                <span className="lv3-card-num">{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <ComponentShowcase />
        <PipelineDiagram />

        <section className="lv3-section">
          <p className="lv3-eyebrow lv3-reveal">How to use it</p>
          <h2 className="lv3-h2 lv3-reveal">
            On <em>OKX AI</em>, or on your own machine
          </h2>
          <div className="lv3-usage">
            <div className="lv3-card">
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
            <div className="lv3-card">
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

        <footer className="lv3-footer">
          <p className="lv3-footer-word">
            glo<em>o</em>my
          </p>
          <div className="lv3-footer-row">
            <span>Built for the OKX AI Genesis Hackathon</span>
            <nav>
              <Link href="/chat">Chat</Link>
              <Link href="/gallery">Gallery</Link>
            </nav>
          </div>
        </footer>
      </div>
    </main>
  );
}
