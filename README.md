# gloomy

Built for the **OKX Hackathon**. Turns a user's question into a live, on-screen
explanation — diagrams, step-throughs, quizzes, simulations — instead of a wall
of chat text, grounded in real sources instead of the model's raw memory.

> Working name. Swap this section for the real product pitch once it's locked.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| 2D generative UI | [OpenUI](https://www.openui.com/) (`@openuidev/react-lang`, `@openuidev/react-ui`) on Next.js | Zod-typed component contracts + a token-efficient streaming DSL, so the LLM can only ever emit UI we've defined. |
| 3D / simulation generative UI | Copilot generative UI ([CopilotKit](https://www.copilotkit.ai/)) | Used only where an interactive 3D/simulated view is the right medium — kept as its own surface rather than forced into the OpenUI component catalog. |
| Backend | Node.js + TypeScript | One language across backend and both frontends; strong Anthropic TS SDK support. |
| Model | Claude (Anthropic), tool-use | Backend defines one tool per A2UI component; Claude picks a component and fills its props. |
| Grounding | RAG over a real source corpus | Added once the hardcoded-question loop works — see build order below. |
| Package management | pnpm workspaces | Single monorepo, shared types between backend and frontend via `packages/a2ui-spec`. |

**Important divergence from OpenUI's default transport:** OpenUI ships stream
adapters for OpenAI-compatible, LangGraph, and AG-UI protocols, but not
Anthropic. `apps/api` will need a small custom adapter that reshapes Claude's
tool-use/streaming events into the shape OpenUI's `Renderer` expects (or an
`/api/chat` route in `apps/web` that translates before forwarding). Flagging
this now so it isn't a surprise during step 1 of the build order.

## Architecture

```
┌─────────────┐        ┌──────────────────────────┐        ┌──────────────┐
│  apps/web   │  HTTP  │        apps/api           │  HTTP  │  Claude API  │
│  (Next.js + │◄──────►│  Node.js + TS             │◄──────►│  (tool-use)  │
│  OpenUI)    │ stream │  - Claude client + tools   │        └──────────────┘
│             │        │  - A2UI component tools    │
│  Diagram    │        │  - RAG retriever           │        ┌──────────────┐
│  StepThrough│        │  - Cache                   │◄──────►│ Vector store │
│  Quiz       │        │  - Progress tracking        │        │ / sources    │
└─────────────┘        └──────────────────────────┘        └──────────────┘

┌─────────────┐
│ apps/web-3d │  Separate surface for 3D / simulation-heavy answers,
│ (CopilotKit)│  driven by the same apps/api backend.
└─────────────┘
```

`packages/a2ui-spec` is the single source of truth for each component's prop
schema (Zod). Both `apps/web`'s OpenUI component library and `apps/api`'s
Claude tool definitions import from it, so the UI contract and the tool
contract can never drift apart.

## Folder structure

```
gloomy/
├── apps/
│   ├── web/        # OpenUI + Next.js frontend — the main 2D generative UI surface
│   ├── web-3d/      # CopilotKit frontend — 3D / simulation generative UI surface
│   └── api/         # Node.js + TS backend — Claude tool-use, RAG, cache, progress
├── packages/
│   └── a2ui-spec/   # Shared Zod schemas for the A2UI component catalog
├── docs/            # Architecture notes, component spec, build order
└── scripts/         # Dev/build helper scripts (e.g. run web + api together)
```

Each `apps/*` and `packages/*` directory currently just has a placeholder
README — the actual `npx @openuidev/cli create` / backend scaffold is build
order step 1, not part of this commit.

## A2UI component catalog

"A2UI" = the fixed set of components the backend is allowed to ask for and
the frontend knows how to render. Starting set (see `docs/a2ui-components.md`
for prop-level detail):

1. **Diagram** — labeled nodes/edges for explaining structure or relationships.
2. **StepThrough** — an ordered sequence of steps/states, one revealed at a time.
3. **Quiz** — a question with choices and immediate feedback.

Planned second wave (step 5 of the build order): Simulation, Chart,
FormulaStepper.

## Build order

- [x] 1. Scaffold `apps/web` (OpenUI) + `apps/api` (backend) skeleton, confirm they talk to each other.
- [ ] 2. Build the 3 A2UI components (Diagram, StepThrough, Quiz) with hardcoded data — no LLM yet. Confirm rendering works well on web and iPad Safari (via simulator).
- [ ] 3. Wire Claude tool-use to populate those 3 components dynamically for a small hardcoded set of ~10 questions.
- [ ] 4. Add RAG grounding so content generation pulls from real sources instead of the model's raw knowledge.
- [ ] 5. Expand the component catalog (Simulation, Chart, FormulaStepper) once the core loop is validated.
- [ ] 6. Add caching + basic progress tracking.
- [ ] 7. Once the web version feels solid, revisit whether a native shell (e.g. wrapping `apps/web` for iPad) is worth it.

## Getting started

```bash
pnpm install                                   # from repo root, installs both apps

cd apps/api && pnpm dev                        # terminal 1 — http://localhost:4000

cd apps/web && cp .env.local.example .env.local && pnpm dev   # terminal 2 — http://localhost:3000
```

Open `http://localhost:3000` — it should say "Connected. apps/api replied:
...". That's build order step 1 done. `apps/web-3d` isn't scaffolded yet
(deferred to step 5, see its README).

## Docs

- [`docs/architecture.md`](docs/architecture.md) — data flow in more detail.
- [`docs/a2ui-components.md`](docs/a2ui-components.md) — prop-level spec for each A2UI component.
- [OpenUI docs](https://www.openui.com/docs/openui-lang) — upstream framework docs.
- [CopilotKit docs](https://docs.copilotkit.ai/) — upstream framework docs for the 3D surface.
