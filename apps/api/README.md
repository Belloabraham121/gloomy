# apps/api

Backend: Node.js + TypeScript + Express. Owns the LLM tool-use loop
(Claude **and** OpenAI handlers), caching, progress tracking, and — later —
the RAG retriever. Shared by both `apps/web` and `apps/web-3d`'s concepts,
though `apps/web-3d` runs its own CopilotKit runtime route for chat.

## Current state (build order steps 1, 3, 6 — step 4 RAG not started)

- `GET /health` — liveness check.
- `POST /api/chat` — accepts `{ threadId, sessionId?, messages }`.
  1. Checks the cache (Postgres, keyed on a hash of the question) — a hit
     returns immediately with `cached: true` and never touches any LLM.
  2. On a miss, picks a provider (see below) and runs a tool-use turn with
     one tool per component in `packages/a2ui-spec`. Whatever the model
     returns is validated against that same Zod schema (never trusted
     as-is), with one retry feeding the validation error back.
  3. Stores the result in the cache and records a progress row (creating a
     session if `sessionId` wasn't passed).
  4. Returns `{ threadId, sessionId, cached, provider, component, props }`.
  - Returns **501** with a clear message if no provider is configured
    (checked *after* the cache lookup, so cache hits work with zero keys).
  - Returns **400** if `messages` is empty, **502** if the model never
    produces a valid tool call (including after the retry).
  - Caching and progress tracking are best-effort: no `DATABASE_URL` means
    they're silently skipped and `/api/chat` still works.

### Provider selection

`src/llm/index.ts`: `LLM_PROVIDER=anthropic|openai` forces one, and fails
loudly if that provider's key is missing rather than silently falling back.
Unset, Anthropic is preferred when `ANTHROPIC_API_KEY` is present, else
OpenAI when `OPENAI_API_KEY` is. Both handlers share the same validation
gate (`src/llm/shared.ts`) and the same provider-neutral tool specs
(`src/llm/tools.ts`, JSON Schema generated from the Zod schemas).

## Run it

```bash
cp .env.example .env     # ANTHROPIC_API_KEY and/or OPENAI_API_KEY + DATABASE_URL
pnpm install
pnpm run db:migrate       # applies src/db/migrations/ to DATABASE_URL
pnpm dev                   # http://localhost:4000
pnpm test                   # unit tests + (if DATABASE_URL is set) live DB integration tests
```

`DATABASE_URL` needs a Postgres with the `pgvector` extension available
(`CREATE EXTENSION vector;`) — a hosted option like Supabase or Neon has it
built in; see the root README's database discussion for why.

## Testing

All run via `pnpm test`, 20 tests total:

- `src/llm/anthropic.test.ts` — mocked Anthropic client: valid tool call,
  unknown component, retry-succeeds, retry-still-fails, text-only response.
- `src/llm/openai.test.ts` — mocked OpenAI client: same five cases plus
  malformed-JSON tool arguments (OpenAI sends arguments as a string).
- `src/llm/provider.test.ts` — selection logic: preference order, forcing,
  forced-but-missing-key, unrecognized value, nothing configured.
- `src/db/db.test.ts` — real Postgres (skips cleanly if `DATABASE_URL`
  isn't set): cache miss/set/upsert, session creation and reuse, and an
  actual pgvector cosine-similarity query.

## Layout

```
apps/api/
├── src/
│   ├── index.ts
│   ├── routes/
│   │   └── chat.ts             # POST /api/chat
│   ├── llm/
│   │   ├── index.ts             # getLlmProvider() - env-driven selection
│   │   ├── shared.ts            # ChatMessage, errors, the shared Zod validation gate
│   │   ├── tools.ts             # a2ui-spec schemas -> provider-neutral tool specs
│   │   ├── system-prompt.ts
│   │   ├── anthropic.ts         # Claude tool-use loop
│   │   ├── openai.ts            # OpenAI function-calling loop
│   │   └── *.test.ts
│   ├── db/
│   │   ├── schema.ts             # cache_entries, sessions, progress_entries, sources, chunks (pgvector)
│   │   ├── client.ts             # getDb() -> Drizzle client, or null if DATABASE_URL unset
│   │   ├── migrate.ts            # applies src/db/migrations/
│   │   ├── migrations/
│   │   └── db.test.ts
│   ├── cache/
│   │   └── cache.ts              # getCachedResponse / setCachedResponse
│   ├── progress/
│   │   └── progress.ts           # recordProgress (creates/reuses a session)
│   └── rag/                       # step 4, not built yet
├── drizzle.config.ts
├── .env.example
├── package.json
└── tsconfig.json
```
