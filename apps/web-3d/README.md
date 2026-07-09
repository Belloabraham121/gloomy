# apps/web-3d

The 3D / simulation generative UI surface: Next.js + Copilot generative UI
([CopilotKit](https://www.copilotkit.ai/)) + [react-three-fiber](https://r3f.docs.pmnd.rs/).

## How it works

The page shows a live WebGL scene (react-three-fiber) driven by a single
`SceneConfig` state: a preset (`waveField` | `orbitals` | `torusKnot`), a
hue, an animation speed, and a structural density. Two things can change
that state:

- **The copilot** — a `useCopilotAction` (`configure_scene`) lets the model
  reconfigure the scene from natural language ("show me orbitals, slow and
  red"), and `useCopilotReadable` exposes the current config so it knows
  what the user is looking at. Whatever the model sends is run through
  `sanitizeSceneConfig` before touching the scene — same philosophy as
  `apps/api`'s Zod gate: model output is never applied unchecked.
- **The manual panel** — preset chips + hue/speed/density sliders drive the
  identical state, so the whole surface works with zero API keys.

The chat runs through `/api/copilotkit` (CopilotKit runtime). Provider
selection follows the same convention as `apps/api`: `LLM_PROVIDER=
anthropic|openai` forces one, otherwise Anthropic is preferred when both
keys are present; with no keys the route returns 501 with a clear message
and the page shows a banner.

## Run it

```bash
cp .env.local.example .env.local   # add ANTHROPIC_API_KEY or OPENAI_API_KEY for the chat
pnpm install
pnpm dev                            # http://localhost:3002
```

The scene, drag-to-rotate camera, and manual controls all work without any
keys — only the copilot chat needs one.

## Layout

```
apps/web-3d/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # server component; passes hasLlmKey into the client Lab
│   │   ├── layout.tsx                 # shared gloomy header (links back to apps/web)
│   │   ├── globals.css                # gloomy design tokens + CopilotKit CSS-variable theme bridge
│   │   └── api/copilotkit/route.ts    # CopilotRuntime + Anthropic/OpenAI adapter selection
│   ├── components/
│   │   ├── Lab.tsx                    # CopilotKit provider, sidebar, action + readable, control panel
│   │   └── Scene.tsx                  # r3f canvas: WaveField / Orbitals / TorusKnot + camera rig
│   └── lib/
│       └── scene-config.ts            # SceneConfig type, defaults, sanitizeSceneConfig
```

## Notes

- `@anthropic-ai/sdk` here is ^0.57 (CopilotKit's adapter needs it);
  `apps/api` intentionally stays on its own version — pnpm keeps them
  isolated.
- Design tokens are a synced copy of `apps/web`'s. Two copies at two
  consumers is fine; extract to a shared package if a third appears.
