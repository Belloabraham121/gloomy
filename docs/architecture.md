# Architecture

## Request flow (2D / OpenUI path) — as actually built

1. User asks a question in `apps/web` (or clicks a suggested question). If
   a document is active (see "Document upload + RAG grounding" below), the
   question is appended as a new card on the stacking canvas rather than
   replacing the previous one.
2. `apps/web` `POST`s `{ threadId, sessionId?, documentId?, messages }` to
   `apps/api`'s `/api/chat` — `messages` is the **full accumulated thread**,
   not just the new question (see "Conversation history" below), so
   follow-ups like "now chart that" have context to build on.
3. `apps/api` checks the cache (Postgres, keyed on a hash of the *latest*
   question in the thread *and* `documentId` — see "Caching and progress
   tracking" below). A hit returns immediately — no LLM is called, and no
   API key needs to be set.
4. On a miss, `apps/api` picks a provider (`src/llm/index.ts`:
   `LLM_PROVIDER=anthropic|openai` forces one; otherwise Anthropic is
   preferred when both keys are present) and runs a tool-use turn over the
   whole (capped) message thread. The available tools are generated from
   `packages/a2ui-spec` — one tool per A2UI component (`Diagram`,
   `StepThrough`, `Quiz`, `Simulation`, `Chart`, `FormulaStepper`). The
   model picks one and fills its arguments. If `documentId` was passed, the
   retrieved grounding context (a PDF excerpt or a parsed CSV summary — see
   below) is appended to `SYSTEM_PROMPT` before the call.
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

## Conversation history — implemented

Earlier the frontend sent exactly one `{ role: "user", content }` message
per request, so the model never saw prior turns — a literal restart every
message. Now `apps/web/src/lib/chat-history.ts`'s `buildThreadMessages`
builds the full thread before every `askQuestion()` call:

- Every prior user question in the current conversation, verbatim.
- Every prior *successful* assistant turn, replaced with a short bracketed
  note (`[assistant generated a Chart titled "Q3 revenue"]`) rather than
  its full `{component, props}` payload — enough for the model to know
  what was already shown without re-sending (and re-paying tokens for) the
  whole structured payload every turn.
- Capped to the most recent 10 prior turns client-side; `apps/api/src/routes/chat.ts`
  also caps the thread it will act on to the most recent 24 messages
  server-side, independent of what the client sends (defense in depth —
  bounds LLM context/token cost regardless of a buggy or malicious client).

`SYSTEM_PROMPT` (`apps/api/src/llm/system-prompt.ts`) tells the model how
to read those bracketed notes and to treat a follow-up ("now chart that",
"make it a quiz") as refining the same underlying subject through a
different component — while still always calling exactly one catalog tool
per turn, same as before.

**Caching stays keyed on just the latest question** (+ `documentId`), not
a hash of the whole thread: hashing the full history would make the cache
miss on every follow-up by construction (the history is different every
time), defeating the point of caching repeat questions. The accepted
tradeoff: the exact same question text asked from two different prior
contexts can hit the same cached component. Revisit if that turns out to
matter in practice (e.g. hash the question plus a digest of the history).

## Document upload + data grounding (build order step 4 + CSV) — implemented

`POST /api/documents` (`apps/api/src/routes/documents.ts`, `multer` memory
storage, PDF or CSV, 20MB cap) dispatches to one of two pipelines in
`apps/api/src/rag/ingest.ts` based on the upload's mimetype/extension:

**PDF → `ingestPdf`** (full RAG):
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
4. One `sources` row and N `chunks` rows (each with a real embedding) are
   inserted (Drizzle).

**CSV → `ingestCsv`** (parse-to-context, deliberately *not* RAG):
1. `csv/parse.ts`'s `parseCsv` (hand-rolled, handles quoted/escaped fields
   and CRLF, no dependency) turns the file into headers + rows.
2. `summarizeCsv` reduces that to one compact text block: per-column
   inferred type (`numeric` → min/max/avg, `text` → distinct count), row
   count, and a bounded sample table (first 15 rows, whole thing capped to
   ~4000 chars) — the real values from the file, explicitly instructed to
   be used as-is rather than invented.
3. One `sources` row and exactly **one** `chunks` row are inserted, with
   `embedding: null`.

   *Why not chunk+embed a CSV like a PDF?* A CSV upload only needs to
   answer questions about itself in the very next turn or two. Chunking it
   into paragraph-sized pieces and vector-embedding each one (an extra
   OpenAI call) risks a similarity search dropping the very rows/columns
   the model needed for that turn's chart. Handing the model one complete,
   bounded summary of the whole table is simpler, cheaper, and strictly
   more reliable for "make a chart from this data" than a top-k retrieval
   over row-shaped chunks would be. If a future large-CSV use case needs
   true retrieval (e.g. thousands of rows too big to summarize), that's
   flagged as future work rather than built speculatively now.

`POST /api/chat` accepts an optional `documentId`, resolved by
`rag/grounding.ts` into a text block appended to `SYSTEM_PROMPT` for that
turn only (no change to the tool-use/validation/retry logic itself).
`rag/retrieve.ts`'s `retrieveChunks` picks the retrieval mode per source
automatically:
- Chunks with a stored embedding (PDF) → embed the question, pgvector
  cosine (`<=>`) nearest-neighbor query, top-k.
- Chunks with **no** embedding (CSV) → returned directly, unconditionally
  — there's exactly one, so there's nothing to rank, and this path never
  calls `embedText`/OpenAI at all, so CSV grounding works even in an
  Anthropic-only setup with no `OPENAI_API_KEY`.

`apps/web`'s `/chat` page turns this into a stacking canvas
(`apps/web/src/app/chat/page.tsx`): an upload control above the prompt bar
accepts PDF or CSV, calls `uploadDocument()` (`lib/api.ts`), shows
upload/ready/error state, and once a document is ready every subsequent
question passes its `sourceId` through as `documentId` — so the canvas
accumulates a document/data overview plus grounded follow-up cards, all
sharing the same source.

**Future work (explicitly out of scope for the hackathon deadline):**
retrieval-scale CSV ingestion (chunked/embedded rows for datasets too
large to summarize in ~4000 chars), and multi-file grounding (more than
one active `documentId` per conversation).

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
