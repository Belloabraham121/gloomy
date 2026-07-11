"use client";

import {
  CopilotKit,
  useCopilotAction,
  useCopilotReadable,
} from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { useState } from "react";
import { Scene } from "@/components/Scene";
import {
  DEFAULT_SCENE,
  PRESET_LABELS,
  SCENE_PRESETS,
  sanitizeSceneConfig,
  type SceneConfig,
} from "@/lib/scene-config";

function ConfigChip({ config }: { config: SceneConfig }) {
  return (
    <div className="lab-action-card">
      <span className="lab-action-eyebrow">Scene updated</span>
      <strong>{PRESET_LABELS[config.preset]}</strong>
      <span className="lab-action-meta">
        hue {Math.round(config.hue)}° · speed {config.speed.toFixed(1)}× ·
        density {config.density}
      </span>
    </div>
  );
}

function LabInner({ hasLlmKey }: { hasLlmKey: boolean }) {
  const [config, setConfig] = useState<SceneConfig>(DEFAULT_SCENE);

  useCopilotReadable({
    description:
      "The current 3D scene configuration the user is looking at. preset is one of waveField|orbitals|torusKnot|agents; hue is 0-360; speed is 0.1-3; density is 6-24.",
    value: config,
  });

  useCopilotAction({
    name: "configure_scene",
    description:
      "Reconfigure the live 3D scene the user is looking at. Use it whenever the user asks to change what is shown, its color, speed, or complexity. preset must be one of: waveField (an animated grid of columns, good for wave/field/signal concepts), orbitals (bodies orbiting a glowing center, good for orbital/atomic/planetary concepts), torusKnot (a continuous knotted loop, good for topology/geometry concepts), agents (nodes connected by lines with pulses traveling between them, good for multi-agent/collaboration/network concepts).",
    parameters: [
      {
        name: "preset",
        type: "string",
        description: "One of: waveField, orbitals, torusKnot, agents",
        required: false,
      },
      {
        name: "hue",
        type: "number",
        description: "Base color hue in degrees, 0-360",
        required: false,
      },
      {
        name: "speed",
        type: "number",
        description: "Animation speed multiplier, 0.1-3",
        required: false,
      },
      {
        name: "density",
        type: "number",
        description:
          "Structural density (grid size / body count / knot complexity), 6-24",
        required: false,
      },
    ],
    handler: async (args) => {
      let applied: SceneConfig | null = null;
      setConfig((prev) => {
        applied = sanitizeSceneConfig(args, prev);
        return applied;
      });
      return `Scene set to ${JSON.stringify(applied)}`;
    },
    render: ({ status }) =>
      status === "complete" ? <ConfigChip config={config} /> : <></>,
  });

  return (
    <main className="lab-main">
      <div className="lab-column">
        <p className="hero-eyebrow">Copilot generative UI</p>
        <h1 className="hero-title">
          The <em>3D lab</em>
        </h1>
        <p className="hero-sub">
          Ask the copilot for a scene — “show me orbitals, slow and red” — and
          it reconfigures the live render. Everything it can do, you can also
          do by hand below.
        </p>

        {!hasLlmKey && (
          <div className="lab-banner">
            No LLM key configured — the copilot chat won&apos;t answer. Set{" "}
            <code>ANTHROPIC_API_KEY</code> or <code>OPENAI_API_KEY</code> in{" "}
            <code>apps/web-3d/.env.local</code>. The scene and manual controls
            below work regardless.
          </div>
        )}

        <div className="lab-canvas-card">
          <Scene config={config} />
        </div>

        <div className="lab-controls">
          <div className="lab-control-row">
            {SCENE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={`lab-chip ${config.preset === preset ? "active" : ""}`}
                onClick={() => setConfig((c) => ({ ...c, preset }))}
              >
                {PRESET_LABELS[preset]}
              </button>
            ))}
          </div>

          <label className="lab-slider">
            <span>
              Hue <strong>{Math.round(config.hue)}°</strong>
            </span>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={config.hue}
              onChange={(e) =>
                setConfig((c) => ({ ...c, hue: Number(e.target.value) }))
              }
            />
          </label>
          <label className="lab-slider">
            <span>
              Speed <strong>{config.speed.toFixed(1)}×</strong>
            </span>
            <input
              type="range"
              min={0.1}
              max={3}
              step={0.1}
              value={config.speed}
              onChange={(e) =>
                setConfig((c) => ({ ...c, speed: Number(e.target.value) }))
              }
            />
          </label>
          <label className="lab-slider">
            <span>
              Density <strong>{config.density}</strong>
            </span>
            <input
              type="range"
              min={6}
              max={24}
              step={1}
              value={config.density}
              onChange={(e) =>
                setConfig((c) => ({ ...c, density: Number(e.target.value) }))
              }
            />
          </label>
        </div>
      </div>
    </main>
  );
}

export function Lab({ hasLlmKey }: { hasLlmKey: boolean }) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <CopilotSidebar
        defaultOpen={false}
        labels={{
          title: "Scene copilot",
          initial:
            "Tell me what to render — e.g. “show me a red torus knot” or “make the wave field denser and slower”.",
        }}
      >
        <LabInner hasLlmKey={hasLlmKey} />
      </CopilotSidebar>
    </CopilotKit>
  );
}
