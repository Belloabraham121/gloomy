# Architecture

## Request flow (2D / OpenUI path) — as actually built

1. User asks a question in `apps/web` (or clicks a suggested question). If
   a document is active (see "Document upload + RAG grounding" below), the
   question is appended as a new card on the stacking canvas rather than
   replacing the previous one.
2. `apps/web` `POST`s `{ threadId, sessionId?, documentId?, messages }` to
   `apps/api`'s `/api/chat`.
3. `apps/api` checks the cache (Postgres, keyed on a hash of the question
   *and* `documentId` — see "Caching and progress tracking" below). A hit
   returns immediately — no LLM is called, and no API key needs to be set.
4. On a miss, `apps/api` picks a provider (`src/llm/index.ts`:
   `LLM_PROVIDER=anthropic|openai` forces one; otherwise Anthropic is
   preferred when both keys are present) and runs a tool-use turn. The
   available tools are generated from `packages/a2ui-spec` — one tool per
   A2UI component (`Diagram`, `StepThrough`, `Quiz`, `Simulation`,
   `Chart`, `FormulaStepper`). The model picks one and fills its arguments.
   If `documentId` was passed, the retrieved grounding context (see below)
   is appended to `SYSTEM_PROMPT` before the call.
5. Whatever the model returns — from either provider — is validated against
   that same Zod schema (never trusted as-is). If invalid, one retry with
   the validation error fed back (`tool_result` for Claude, a `tool` role
   message for OpenAI, whose string-encoded arguments also get a
   JSON.parse guard).
6. The validated `{ component, props }` is cached, a progress row is
   recorded, and the whole thing is returned as a single JSON response —
   **not a stream**. See "Anthropic ↔ OpenUI transport gap" below for why.
7. `apps/web`'s `A2uiRenderer` dispatches `component` to the matching React
   component from `a2uiComponents` (in `lib/a2ui-library.ts`) and renders
   `props` directly, appended as a new card on the canvas.

## Document upload + RAG grounding (build order step 4) — implemented

`POST /api/documents` (`apps/api/src/routes/documents.ts`, `multer` memory
storage, PDF only, 20MB cap) runs `apps/api/src/rag/ingest.ts`:

1. `pdf.ts` extracts raw text (`unpdf`, no network).
2. `chunk.ts` splits it into ~1000-char, ~150-char-overlap chunks — a
   hand-rolled paragraph-aware splitter with a sentence-splitting fallback
   for text with no paragraph breaks, not a dependency, since the logic is
   small and needed to be unit-testable without any API key.
3. `embeddings.ts` embeds every chunk via OpenAI `text-embedding-3-small`
   (1536 dims, matching the `vector(1536)` column). This needs
   `OPENAI_API_KEY` even when `LLM_PROVIDER=anthropic`, since Anthropic has
   no embeddings API — a dedicated error message flags this rather than
   letting it look like a generic missing-key failure.
4. One `sources` row and N `chunks` rows are inserted (Drizzle).

`POST /api/chat` accepts an optional `documentId`. When present,
`rag/retrieve.ts`'s `retrieveChunks` embeds the question and runs a
pgvector cosine (`<=>`) nearest-neighbor query scoped to that source,
`formatGroundingContext` turns the top-k chunks into a instruction block,
and it's appended to `SYSTEM_PROMPT` for that turn only — no change to the
tool-use/validation/retry logic itself.

`apps/web`'s `/chat` page turns this into a stacking canvas
(`apps/web/src/app/chat/page.tsx`): an upload control above the prompt bar
calls `uploadDocument()` (`lib/api.ts`), shows upload/ready/error state,
and once a document is ready every subsequent question passes its
`sourceId` through as `documentId` — so the canvas accumulates a document
overview plus grounded follow-up cards, all sharing the same source.

## Request flow (3D / CopilotKit path) — as actually built

`apps/web-3d` is its own surface with its own chat transport:

1. The page holds one `SceneConfig` state (preset / hue / speed / density)
   that drives a live react-three-fiber scene — three presets: an
   instanced wave field, orbiting bodies, a parametric torus knot.
2. CopilotKit's sidebar chat talks to `/api/copilotkit` (CopilotKit
   runtime inside `apps/web-3d` itself, not `apps/api`), with the same
   Anthropic/OpenAI provider-selection convention.
3. The model changes the scene through a `useCopilotAction`
   (`configure_scene`) and can see the current state via
   `useCopilotReadable`. Everything it sends passes through
   `sanitizeSceneConfig` before touching the scene — the same
   never-trust-model-output philosophy as `apps/api`'s Zod gate, just
   with clamping instead of rejection since a 3D scene has safe bounds.
4. A manual control panel drives the identical state, so the whole 3D
   surface works with zero API keys.

Note the asymmetry: the 2D path centralizes LLM calls in `apps/api`
(cache + progress + one validation gate), while the 3D lab uses
CopilotKit's own runtime because that's what its generative-UI hooks are
built around. If the 3D lab later needs caching/progress, route its
runtime through `apps/api` instead.

## Why two frontends instead of one

OpenUI's component contract (Zod props → deterministic React render) is a
good fit for structured, mostly-2D teaching content but isn't built for
free-form 3D/simulated scenes. Rather than stretch one framework to cover
both, 3D-shaped answers get routed to the CopilotKit surface instead.

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
  question text plus the `documentId` it was grounded in (`""` when
  ungrounded), so the same question against a different — or no —
  document never wrongly hits another document's cached answer.
- `sessions` / `progress_entries` — no auth; a session is just a
  server-generated id the client holds in `localStorage` (see root
  README's session-vs-account discussion). Every response (cached or not)
  records a progress row.

Both are optional at runtime: `getDb()` returns `null` if `DATABASE_URL`
isn't set, and callers degrade gracefully (cache always misses, progress
recording is skipped) rather than the whole chat endpoint failing. This is
a deliberate contrast with Claude, which is a hard dependency — see
`apps/api/src/claude/client.ts` vs `apps/api/src/db/client.ts`.

`sources`/`chunks` tables live in the same schema, pgvector-ready
(`vector(1536)` column + HNSW cosine index) — see "Document upload + RAG
grounding" above for what ingests into and reads from them. `sources` also
carries a nullable `sessionId` (scopes a document to the canvas that
uploaded it) and a `status` column (`processing|ready|failed`) for future
upload-progress UI.
