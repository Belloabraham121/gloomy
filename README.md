# gloomy

Built for the **OKX Hackathon**. Turns a user's question into a live, on-screen
explanation — diagrams, step-throughs, quizzes, simulations — instead of a wall
of chat text, grounded in real sources instead of the model's raw memory.

> Working name. Swap this section for the real product pitch once it's locked.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| 2D generative UI | [OpenUI](https://www.openui.com/) (`@openuidev/react-lang`, `@openuidev/react-ui`) on Next.js | Zod-typed component contracts so the LLM can only ever ask for UI we've defined. |
| 3D / simulation generative UI | Copilot generative UI ([CopilotKit](https://www.copilotkit.ai/)) + react-three-fiber | `apps/web-3d`: the copilot reconfigures a live WebGL scene from natural language; a manual panel drives the same state so it works with no API keys. |
| Backend | Node.js + TypeScript + Express | One language across backend and both frontends. |
| Models | Claude (Anthropic) **and** OpenAI, tool-use / function calling | One handler per provider behind a single interface (`apps/api/src/llm/`); `LLM_PROVIDER` env picks, Anthropic preferred when both keys are set. Either way the response is validated against the same Zod schema before it's trusted. |
| Database | Postgres + pgvector, via Drizzle | Cache + progress tracking today; the same database will hold RAG source embeddings once step 4 starts. One database instead of three separate services (vector DB + cache store + relational DB) — see `docs/architecture.md`. |
| Grounding | RAG over a real source corpus | Not started (build order step 4) — needs an actual source corpus, which is a curation task, not just code. |
| Package management | pnpm workspaces | Single monorepo, shared types between backend and frontend via `packages/a2ui-spec`. |

**Divergence from OpenUI's default transport:** OpenUI's `Renderer`/Lang DSL
expects a stream in a shape it ships adapters for (OpenAI-compatible,
LangGraph, AG-UI) — not Anthropic's. Rather than hand-author untested OpenUI
Lang generation prompts with no live model access to validate them against,
`apps/api` returns plain `{ component, props }` JSON and `apps/web` renders
it directly against the real React components (bypassing OpenUI's parser at
runtime, while still defining everything as a proper OpenUI
`defineComponent`/`createLibrary` for later). Full writeup in
`docs/architecture.md`.

## Architecture

```
┌─────────────┐        ┌──────────────────────────┐        ┌──────────────┐
│  apps/web   │  HTTP  │        apps/api           │  HTTP  │ Claude API   │
│  (Next.js + │◄──────►│  Node.js + TS             │◄──────►│  - or -      │
│  OpenUI)    │  JSON  │  - src/llm: Anthropic +    │        │ OpenAI API   │
│             │        │    OpenAI handlers          │        └──────────────┘
│  Diagram    │        │  - A2UI component tools    │
│  StepThrough│        │  - Cache + progress         │        ┌──────────────┐
│  Quiz       │        │  - RAG retriever (planned)  │◄──────►│  Postgres +  │
│  Simulation │        │                              │        │  pgvector    │
│  Chart      │        └──────────────────────────┘        └──────────────┘
│  FormulaStep│
└─────────────┘        ┌─────────────┐  Copilot generative UI: the model
                        │ apps/web-3d │  reconfigures a live 3D scene
                        │ (CopilotKit │  (wave field / orbitals / torus
                        │  + r3f)     │  knot) via its own /api/copilotkit
                        └─────────────┘  runtime (Anthropic or OpenAI).
```

`packages/a2ui-spec` is the single source of truth for each component's prop
schema (Zod v4). Both `apps/web`'s OpenUI component library and `apps/api`'s
Claude tool definitions import from it, so the UI contract and the tool
contract can never drift apart. It ships a real build (`tsc`) rather than
raw source — see its README for why that matters here.

## Folder structure

```
gloomy/
├── apps/
│   ├── web/        # OpenUI + Next.js frontend — the main 2D generative UI surface
│   ├── web-3d/      # CopilotKit + react-three-fiber — copilot-driven live 3D scenes
│   └── api/         # Node.js + TS backend — Claude/OpenAI tool-use, cache, progress, DB
├── packages/
│   └── a2ui-spec/   # Shared Zod schemas for the A2UI component catalog (compiled)
├── docs/            # Architecture notes, component spec, build order
└── scripts/         # (empty — dev is two `pnpm dev` terminals, see below)
```

## A2UI component catalog

"A2UI" = the fixed set of components the backend is allowed to ask for and
the frontend knows how to render. All 6 are implemented (see
`docs/a2ui-components.md` for prop-level detail and rendering notes):
**Diagram**, **StepThrough**, **Quiz**, **Simulation**, **Chart**,
**FormulaStepper**.

## Build order

- [x] 1. Scaffold `apps/web` (OpenUI) + `apps/api` (backend) skeleton, confirm they talk to each other.
- [x] 2. Build the A2UI components with hardcoded data — no LLM yet. Confirmed rendering on desktop and iPad-width viewports (real headless-browser checks, not just eyeballing).
- [x] 3. Wire LLM tool-use to populate components dynamically — both a Claude handler and an OpenAI handler behind one interface (`apps/api/src/llm/`). *(Code paths are real and tested against mocked clients + real HTTP checks; never exercised against live models — no API keys were available while building. Add `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` to `apps/api/.env` to actually try it.)*
- [ ] 4. Add RAG grounding so content generation pulls from real sources instead of the model's raw knowledge. Not started — `sources`/`chunks` tables exist (pgvector-ready) but nothing ingests into them.
- [x] 5. Expand the component catalog (Simulation, Chart, FormulaStepper) — built alongside the first 3 in step 2, since it was pure schema/rendering work with no dependency on the core loop being validated first.
- [x] 6. Add caching + basic progress tracking. Real Postgres cache (hit skips Claude entirely, verified working with zero Claude credentials) + progress rows per response.
- [ ] 7. Once the web version feels solid, revisit whether a native shell (e.g. wrapping `apps/web` for iPad) is worth it.

## Getting started

```bash
pnpm install   # from repo root — installs everything, builds packages/a2ui-spec

# apps/api — terminal 1
cd apps/api
cp .env.example .env          # fill in ANTHROPIC_API_KEY and/or OPENAI_API_KEY, plus DATABASE_URL for cache/progress
pnpm run db:migrate             # applies src/db/migrations/ — needs a Postgres with `CREATE EXTENSION vector;` available
pnpm dev                         # http://localhost:4000

# apps/web — terminal 2
cd apps/web
cp .env.local.example .env.local
pnpm dev                         # http://localhost:3000

# apps/web-3d — terminal 3 (optional)
cd apps/web-3d
cp .env.local.example .env.local  # add a key for the copilot chat; the 3D scene works without one
pnpm dev                           # http://localhost:3002
```

Open `http://localhost:3000` and ask a question. With no API keys set,
you'll get a clear "no LLM provider configured" message rather than a
crash — everything else (the UI, the cache path, `/gallery`, the entire 3D
lab minus its chat) works without keys. `/gallery` shows all 6 components
with hardcoded data, independent of whether `apps/api` is even running.

### Testing

```bash
cd apps/api && pnpm test   # mocked Claude + OpenAI client tests always run; live-Postgres tests run if DATABASE_URL is set, skip cleanly otherwise
```

### Database

Needs a Postgres with the `pgvector` extension available. Hosted options
with it built in: [Supabase](https://supabase.com) or
[Neon](https://neon.tech). Locally, `CREATE EXTENSION vector;` needs
`postgresql-<version>-pgvector` (or equivalent) installed.

## Docs

- [`docs/architecture.md`](docs/architecture.md) — data flow, and the real
  engineering decisions/bugs hit while building this (OpenUI transport gap,
  a cross-bundler monorepo resolution conflict, cache design).
- [`docs/a2ui-components.md`](docs/a2ui-components.md) — prop-level spec for each A2UI component, matching the real schemas.
- [OpenUI docs](https://www.openui.com/docs/openui-lang) — upstream framework docs.
- [CopilotKit docs](https://docs.copilotkit.ai/) — upstream framework docs for the 3D surface.
