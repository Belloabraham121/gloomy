# apps/api

Backend: Node.js + TypeScript + Express. Owns the Claude tool-use loop, the
RAG retriever, caching, and progress tracking. Shared by both `apps/web` and
`apps/web-3d`.

## Current state (build order steps 1, 3, 6 — step 4 RAG not started)

- `GET /health` — liveness check.
- `POST /api/chat` — accepts `{ threadId, sessionId?, messages }`.
  1. Checks the cache (Postgres, keyed on a hash of the question) — a hit
     returns immediately with `cached: true` and never touches Claude.
  2. On a miss, calls Claude with one tool per component in
     `packages/a2ui-spec`, validates whatever it returns against that same
     Zod schema (never trusts model output as-is), and retries once with
     the validation error fed back if it's malformed.
  3. Stores the result in the cache and records a progress row (creating a
     session if `sessionId` wasn't passed).
  4. Returns `{ threadId, sessionId, cached, component, props }`.
  - Returns **501** with a clear message if `ANTHROPIC_API_KEY` isn't set
    (checked *after* the cache lookup, so cache hits work without a key at
    all) — copy `.env.example` to `.env` and fill it in for real responses.
  - Returns **400** if `messages` is empty, **502** if Claude never produces
    a valid tool call (including after the retry).
  - Caching and progress tracking are best-effort: if `DATABASE_URL` isn't
    set, they're silently skipped and `/api/chat` still works, it just
    always calls Claude and doesn't record anything.

Not built yet: RAG grounding (step 4) — the `sources`/`chunks` tables exist
in the schema (pgvector-ready) but nothing ingests into them yet.

## Run it

```bash
cp .env.example .env   # fill in ANTHROPIC_API_KEY and DATABASE_URL
pnpm install
pnpm run db:migrate      # applies src/db/migrations/ to DATABASE_URL
pnpm dev                  # starts on http://localhost:4000
pnpm test                  # unit tests + (if DATABASE_URL is set) live DB integration tests
```

`DATABASE_URL` needs a Postgres with the `pgvector` extension available
(`CREATE EXTENSION vector;`) — a hosted option like Supabase or Neon has it
built in; see the root README's database discussion for why.

## Testing

Two test files, both run via `pnpm test`:

- `src/claude/run-tool-use.test.ts` — mocks the Anthropic client (no API
  key needed). Covers: a valid tool call, an unknown component name, a
  validation failure that succeeds on retry, one that still fails on
  retry, and a text-only (non-tool-call) response.
- `src/db/db.test.ts` — runs against a **real** Postgres (skips cleanly if
  `DATABASE_URL` isn't set, e.g. in CI without a DB service). Covers: cache
  miss/set/upsert, session creation and reuse, and an actual pgvector
  cosine-similarity query — not just "does it typecheck," but "does the
  HNSW index return the right nearest neighbor."

## Layout

```
apps/api/
├── src/
│   ├── index.ts
│   ├── routes/
│   │   └── chat.ts             # POST /api/chat
│   ├── claude/
│   │   ├── client.ts            # Anthropic client, throws MissingApiKeyError if unconfigured
│   │   ├── system-prompt.ts
│   │   ├── tools.ts             # a2ui-spec schemas -> Anthropic tool definitions (Zod v4 toJSONSchema)
│   │   ├── run-tool-use.ts      # the tool-use + validation + retry loop
│   │   └── run-tool-use.test.ts
│   ├── db/
│   │   ├── schema.ts             # cache_entries, sessions, progress_entries, sources, chunks (pgvector)
│   │   ├── client.ts             # getDb() -> Drizzle client, or null if DATABASE_URL unset
│   │   ├── migrate.ts            # applies src/db/migrations/ (run via `pnpm run db:migrate`)
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
