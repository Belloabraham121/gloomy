# Architecture

## Request flow (2D / OpenUI path) — as actually built

1. User asks a question in `apps/web` (or clicks a suggested question).
2. `apps/web` `POST`s `{ threadId, sessionId?, messages }` to `apps/api`'s
   `/api/chat`.
3. `apps/api` checks the cache (Postgres, keyed on a hash of the question).
   A hit returns immediately — Claude is never called, and
   `ANTHROPIC_API_KEY` doesn't even need to be set.
4. On a miss, `apps/api` runs a Claude tool-use turn. The available tools
   are generated from `packages/a2ui-spec` — one tool per A2UI component
   (`Diagram`, `StepThrough`, `Quiz`, `Simulation`, `Chart`,
   `FormulaStepper`). Claude picks one and fills its arguments.
5. Whatever Claude returns is validated against that same Zod schema (never
   trusted as-is). If invalid, one retry with the validation error fed back
   as a `tool_result`.
6. (Build order step 4, not started) Before/during the tool-use turn,
   `apps/api` would retrieve grounding context from the RAG layer and
   inject it into the prompt, so components are populated from real
   sources rather than the model's parametric knowledge.
7. The validated `{ component, props }` is cached, a progress row is
   recorded, and the whole thing is returned as a single JSON response —
   **not a stream**. See "Anthropic ↔ OpenUI transport gap" below for why.
8. `apps/web`'s `A2uiRenderer` dispatches `component` to the matching React
   component from `a2uiComponents` (in `lib/a2ui-library.ts`) and renders
   `props` directly.

## Request flow (3D / CopilotKit path)

Not built yet (deferred to step 5+ territory — see `apps/web-3d/README.md`).
Same steps 1–6 above, but the request would route to `apps/web-3d` and
render via CopilotKit's generative UI instead of `A2uiRenderer`. `apps/api`
is meant to be shared — it doesn't know or care which frontend asked, only
which tools/components are valid for the request.

## Why two frontends instead of one

OpenUI's component contract (Zod props → deterministic React render) is a
good fit for structured, mostly-2D teaching content but isn't built for
free-form 3D/simulated scenes. Rather than stretch one framework to cover
both, 3D-shaped answers would get routed to a CopilotKit surface instead.
The backend, tool definitions, cache, and progress tracking are shared
between both — only the rendering surface would differ.

## Anthropic ↔ OpenUI transport gap — resolved by not using it (yet)

OpenUI ships stream adapters for OpenAI-compatible APIs, LangGraph, and the
AG-UI protocol, plus a Lang DSL (`Renderer` + `createParser`) meant to be
fed that streamed text. None of that has an Anthropic adapter, and with no
live Claude API access available while building this, hand-authoring
correct OpenUI Lang generation prompts and trusting them without ever
testing against a real model was too large a risk of silent breakage.

What's actually implemented instead: `apps/api` returns plain
`{ component, props }` JSON (validated against the same Zod schema used to
define the component), and `apps/web`'s `A2uiRenderer` renders it directly
against the component's real React implementation — no OpenUI Lang parsing
involved at runtime. `lib/a2ui-library.ts` still registers everything as a
proper OpenUI `defineComponent`/`createLibrary`, so switching to real
streamed Lang output later (once there's a way to validate it against a
live model) is a matter of wiring a Claude-aware `streamProtocol`/adapter
and swapping `A2uiRenderer` for OpenUI's `Renderer` — the component
definitions and schemas don't need to change.

## A shared package that two different bundlers disagree about

`packages/a2ui-spec` is consumed by both `apps/web` (Next.js/webpack in
dev, needs to resolve TS source directly since there's no build step by
default) and `apps/api` (real Node ESM at runtime for `pnpm start`, which
requires explicit `.js` extensions on relative imports — no guessing). Those
two requirements are incompatible for a package shipping raw, unbuilt `.ts`
source: Next's bundler couldn't resolve `a2ui-spec`'s internal `./chart.js`
imports (no such file, only `chart.ts`), but stripping the extensions to
fix that broke real Node ESM resolution when `apps/api` actually runs its
compiled output (`tsc` build + `node dist/index.js`).

The fix: `a2ui-spec` gets a real build (`tsc`, NodeNext) producing `dist/`
with correct, resolvable `.js` files, and `package.json`'s `main`/`types`
point there instead of at `src/`. Both consumers then resolve it through
ordinary compiled JS via normal `node_modules` resolution — no bundler
special-casing needed. This was only caught by actually running `next dev`
and a real `node dist/index.js`, not by `tsc --noEmit` in either package
alone (each package's own tsconfig looked correct in isolation).

## Caching and progress tracking (build order step 6) — implemented

Postgres (via Drizzle) is used for both, defined in `apps/api/src/db/schema.ts`:

- `cache_entries` — keyed on a SHA-256 hash of the (trimmed, lowercased)
  question text. Once RAG grounding (step 4) lands, the source-set version
  needs to be folded into that key too, so an updated source corpus
  invalidates old cached answers instead of serving stale content.
- `sessions` / `progress_entries` — no auth; a session is just a
  server-generated id the client holds in `localStorage` (see root
  README's session-vs-account discussion). Every response (cached or not)
  records a progress row.

Both are optional at runtime: `getDb()` returns `null` if `DATABASE_URL`
isn't set, and callers degrade gracefully (cache always misses, progress
recording is skipped) rather than the whole chat endpoint failing. This is
a deliberate contrast with Claude, which is a hard dependency — see
`apps/api/src/claude/client.ts` vs `apps/api/src/db/client.ts`.

`sources`/`chunks` tables exist in the same schema, pgvector-ready
(`vector(1536)` column + HNSW cosine index), for step 4 — but nothing
ingests into them yet.
