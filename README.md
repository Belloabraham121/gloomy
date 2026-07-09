# gloomy

Built for the **OKX Hackathon**. Turns a user's question into a live, on-screen
explanation — diagrams, step-throughs, quizzes, simulations — instead of a wall
of chat text, grounded in real sources instead of the model's raw memory.

> Working name. Swap this section for the real product pitch once it's locked.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| 2D generative UI | [OpenUI](https://www.openui.com/) (`@openuidev/react-lang`, `@openuidev/react-ui`) on Next.js | Zod-typed component contracts so the LLM can only ever ask for UI we've defined. |
| 3D / simulation generative UI | Copilot generative UI ([CopilotKit](https://www.copilotkit.ai/)) | Not started — reserved for cases OpenUI's 2D catalog genuinely can't cover. |
| Backend | Node.js + TypeScript + Express | One language across backend and both frontends; strong Anthropic TS SDK support. |
| Model | Claude (Anthropic), tool-use | Backend defines one tool per A2UI component; Claude picks a component and fills its props; the response is validated against the same Zod schema before it's trusted. |
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
│  apps/web   │  HTTP  │        apps/api           │  HTTP  │  Claude API  │
│  (Next.js + │◄──────►│  Node.js + TS             │◄──────►│  (tool-use)  │
│  OpenUI)    │  JSON  │  - Claude client + tools   │        └──────────────┘
│             │        │  - A2UI component tools    │
│  Diagram    │        │  - Cache + progress         │        ┌──────────────┐
│  StepThrough│        │  - RAG retriever (planned)  │◄──────►│  Postgres +  │
│  Quiz       │        │                              │        │  pgvector    │
│  Simulation │        └──────────────────────────┘        └──────────────┘
│  Chart      │
│  FormulaStep│        ┌─────────────┐
└─────────────┘        │ apps/web-3d │  Not built — separate surface for
                        │ (CopilotKit)│  3D / simulation-heavy answers,
                        └─────────────┘  driven by the same apps/api.
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
│   ├── web-3d/      # CopilotKit frontend — not started
│   └── api/         # Node.js + TS backend — Claude tool-use, cache, progress, DB
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
- [x] 3. Wire Claude tool-use to populate components dynamically. *(Code path is real and tested against a mocked Anthropic client + real HTTP checks; never exercised against a live model — no `ANTHROPIC_API_KEY` was available while building. Add one to `apps/api/.env` to actually try it.)*
- [ ] 4. Add RAG grounding so content generation pulls from real sources instead of the model's raw knowledge. Not started — `sources`/`chunks` tables exist (pgvector-ready) but nothing ingests into them.
- [x] 5. Expand the component catalog (Simulation, Chart, FormulaStepper) — built alongside the first 3 in step 2, since it was pure schema/rendering work with no dependency on the core loop being validated first.
- [x] 6. Add caching + basic progress tracking. Real Postgres cache (hit skips Claude entirely, verified working with zero Claude credentials) + progress rows per response.
- [ ] 7. Once the web version feels solid, revisit whether a native shell (e.g. wrapping `apps/web` for iPad) is worth it.

## Getting started

```bash
pnpm install   # from repo root — installs everything, builds packages/a2ui-spec

# apps/api — terminal 1
cd apps/api
cp .env.example .env          # fill in ANTHROPIC_API_KEY for real Claude, DATABASE_URL for cache/progress
pnpm run db:migrate             # applies src/db/migrations/ — needs a Postgres with `CREATE EXTENSION vector;` available
pnpm dev                         # http://localhost:4000

# apps/web — terminal 2
cd apps/web
cp .env.local.example .env.local
pnpm dev                         # http://localhost:3000
```

Open `http://localhost:3000` and ask a question. Without `ANTHROPIC_API_KEY`
set, you'll get a clear "Claude isn't configured" message rather than a
crash — everything else (the UI, the cache path, `/gallery`) works without
it. `/gallery` shows all 6 components with hardcoded data, independent of
whether `apps/api` is even running.

`apps/web-3d` isn't scaffolded — see its README for when that's warranted.

### Testing

```bash
cd apps/api && pnpm test   # mocked-Claude-client tests always run; live-Postgres tests run if DATABASE_URL is set, skip cleanly otherwise
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
