"use client";

import { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ComponentShowcase } from "@/components/landing/ComponentShowcase";
import { LandingDashboard } from "@/components/landing/LandingDashboard";
import { PaperStory } from "@/components/landing/PaperStory";
import { ScenarioTheater } from "@/components/landing/ScenarioTheater";

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

        // component showcase icons wobble forever once settled
        gsap.utils.toArray<HTMLElement>(".lv3-showcase-icon").forEach((icon, i) => {
          gsap.to(icon, {
            rotate: i % 2 === 0 ? 10 : -10,
            duration: gsap.utils.random(2.2, 3.2),
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          });
        });

        // component showcase: cards pop in, then the section pins and the
        // track scrubs horizontally - on every width, mobile included
        const track = document.querySelector<HTMLElement>(".lv3-showcase-track");
        const viewport = document.querySelector<HTMLElement>(
          ".lv3-showcase-viewport",
        );
        if (track && viewport) {
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
        }

        // paper story: pinned scrub through paper -> chunks -> store ->
        // answer. CSS defaults show the final stage (for reduced-motion /
        // no-JS); reset everything to stage 1 here before the pin starts.
        const psStage = document.querySelector<HTMLElement>(".lv3-ps-stage");
        if (psStage) {
          const spark = document.querySelector<SVGPathElement>(".lv3-ps-spark-path");
          if (spark) {
            const sparkLen = spark.getTotalLength();
            gsap.set(spark, { strokeDasharray: sparkLen, strokeDashoffset: sparkLen });
          }
          gsap.set(
            ".lv3-ps-paper, .lv3-ps-chunks, .lv3-ps-store, .lv3-ps-question, .lv3-ps-answer, .lv3-ps-caption",
            { autoAlpha: 0 },
          );

          const psTl = gsap.timeline({
            scrollTrigger: {
              trigger: ".lv3-paper-section",
              start: "top top",
              end: "+=2400",
              pin: true,
              scrub: 1,
            },
          });

          psTl
            // stage 1: the paper
            .to(".lv3-ps-caption.c1", { autoAlpha: 1, duration: 0.3 })
            .fromTo(
              ".lv3-ps-paper",
              { y: 70, scale: 0.9 },
              { autoAlpha: 1, y: 0, scale: 1, duration: 1 },
              "<",
            )
            .to({}, { duration: 0.4 })
            // stage 2: split into chunks
            .to(".lv3-ps-caption.c1", { autoAlpha: 0, duration: 0.3 })
            .to(".lv3-ps-caption.c2", { autoAlpha: 1, duration: 0.3 }, "<")
            .to(".lv3-ps-paper", { scale: 0.8, autoAlpha: 0, duration: 0.7 }, "<")
            .set(".lv3-ps-chunks", { autoAlpha: 1 }, "<0.2")
            .fromTo(
              ".lv3-ps-chunk",
              { scale: 0.35, autoAlpha: 0, y: 30 },
              {
                scale: 1,
                autoAlpha: 1,
                y: 0,
                duration: 0.6,
                ease: "back.out(1.4)",
                stagger: 0.1,
              },
              "<",
            )
            .to({}, { duration: 0.4 })
            // stage 3: embedded + stored
            .to(".lv3-ps-caption.c2", { autoAlpha: 0, duration: 0.3 })
            .to(".lv3-ps-caption.c3", { autoAlpha: 1, duration: 0.3 }, "<")
            .to(
              ".lv3-ps-chunks",
              { scale: 0.2, autoAlpha: 0, transformOrigin: "50% 45%", duration: 0.7 },
              "<",
            )
            .fromTo(
              ".lv3-ps-store",
              { scale: 0.5, y: 20 },
              { autoAlpha: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(1.5)" },
              "<0.3",
            )
            .from(".lv3-ps-dot", { scale: 0, duration: 0.3, stagger: 0.015 }, "<0.2")
            .to({}, { duration: 0.4 })
            // stage 4: ask -> the grounded answer assembles
            .to(".lv3-ps-caption.c3", { autoAlpha: 0, duration: 0.3 })
            .to(".lv3-ps-caption.c4", { autoAlpha: 1, duration: 0.3 }, "<")
            .fromTo(
              ".lv3-ps-question",
              { x: 60 },
              { autoAlpha: 1, x: 0, duration: 0.5 },
              "<",
            )
            .to(".lv3-ps-dot.hot", { scale: 1.5, duration: 0.3, stagger: 0.1 })
            .fromTo(
              ".lv3-ps-answer",
              { y: 30, scale: 0.95 },
              { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: "back.out(1.3)" },
            )
            .from(".lv3-ps-answer > span", { autoAlpha: 0, duration: 0.3, stagger: 0.08 }, "<0.2");
          if (spark) {
            psTl.to(spark, { strokeDashoffset: 0, duration: 0.6 });
          }
          psTl.to({}, { duration: 0.5 });
        }

        // scenario theater: laptop screen plays two question -> thinking ->
        // answer beats, pinned + scrubbed. CSS shows scene 0 finished; reset
        // each scene to "question only" first.
        const laptop = document.querySelector<HTMLElement>(".lv3-laptop");
        if (laptop) {
          const scenes = gsap.utils.toArray<HTMLElement>(".lv3-theater-scene");
          const drawFigureCallouts = (scene: HTMLElement) =>
            scene.querySelectorAll<SVGPathElement>(".lv3-fig-callout");

          // init: both scenes show only their question, thinking enabled but
          // hidden (CSS default-hides it via display:none)
          scenes.forEach((scene) => {
            gsap.set(scene.querySelector(".lv3-theater-thinking"), {
              display: "block",
              autoAlpha: 0,
            });
            gsap.set(scene.querySelector(".lv3-theater-answer"), { autoAlpha: 0 });
            gsap.set(scene.querySelector(".lv3-theater-q"), { autoAlpha: 0, y: -10 });
            drawFigureCallouts(scene).forEach((path) => {
              const len = path.getTotalLength();
              gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
            });
          });
          // scene 1 participates in the timeline (CSS hides it otherwise) and
          // starts one screen-width to the right
          gsap.set(scenes[1], { visibility: "visible", xPercent: 100 });
          gsap.set(scenes[0], { xPercent: 0 });

          const theaterTl = gsap.timeline({
            scrollTrigger: {
              trigger: ".lv3-theater-section",
              start: "top top",
              end: "+=3200",
              pin: true,
              scrub: 1,
            },
          });

          scenes.forEach((scene, i) => {
            const q = scene.querySelector(".lv3-theater-q");
            const thinking = scene.querySelector(".lv3-theater-thinking");
            const answer = scene.querySelector(".lv3-theater-answer");
            const callouts = drawFigureCallouts(scene);

            if (i > 0) {
              // slide previous scene out, this one in
              theaterTl
                .to(scenes[i - 1], { xPercent: -100, duration: 0.8 })
                .set(scenes[i - 1], { autoAlpha: 0 })
                .to(scene, { xPercent: 0, duration: 0.8 }, "<");
            }

            theaterTl
              .to(q, { autoAlpha: 1, y: 0, duration: 0.5 })
              .to({}, { duration: 0.3 })
              .to(thinking, { autoAlpha: 1, duration: 0.4 })
              .to({}, { duration: 0.5 })
              .to(thinking, { autoAlpha: 0, duration: 0.3 })
              .to(answer, { autoAlpha: 1, duration: 0.5 }, "<")
              .to(callouts, { strokeDashoffset: 0, duration: 0.5, stagger: 0.15 }, "<0.1")
              .to({}, { duration: 0.6 });
          });
        }
      });

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
        <PaperStory />
        <ScenarioTheater />

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
            </nav>
          </div>
        </footer>
      </div>
    </main>
  );
}
