# apps/api

Backend: Node.js + TypeScript + Express. Owns the Claude tool-use loop, the
RAG retriever, caching, and progress tracking. Shared by both `apps/web` and
`apps/web-3d`.

## Current state (build order steps 1 and 3)

- `GET /health` — liveness check.
- `POST /api/chat` — real Claude tool-use loop. Accepts
  `{ threadId, messages }`, calls Claude with one tool per component in
  `packages/a2ui-spec`, validates whatever Claude returns against that same
  Zod schema (never trusts model output as-is), retries once with the
  validation error fed back if it's malformed, and returns
  `{ threadId, component, props }`.
  - Returns **501** with a clear message if `ANTHROPIC_API_KEY` isn't set,
    rather than crashing — copy `.env.example` to `.env` and fill it in to
    enable real responses.
  - Returns **400** if `messages` is empty, **502** if Claude never produces
    a valid tool call (including after the retry).

Not built yet: RAG grounding (step 4), caching and progress tracking
(step 6, but see `packages/a2ui-spec`-adjacent DB work landing separately).

## Run it

```bash
cp .env.example .env   # fill in ANTHROPIC_API_KEY to enable real chat
pnpm install            # from repo root or here
pnpm dev                 # starts on http://localhost:4000
pnpm test                 # runs src/claude/run-tool-use.test.ts against a mocked Anthropic client
```

The test suite mocks the Anthropic client (no API key needed) and covers:
a valid tool call, an unknown component name, a validation failure that
succeeds on retry, a validation failure that still fails on retry, and a
text-only (non-tool-call) response.

## Layout

```
apps/api/
├── src/
│   ├── index.ts
│   ├── routes/
│   │   ├── chat.ts            # POST /api/chat
│   │   └── progress.ts        # step 6, not built yet
│   ├── claude/
│   │   ├── client.ts           # Anthropic client, throws MissingApiKeyError if unconfigured
│   │   ├── system-prompt.ts
│   │   ├── tools.ts            # a2ui-spec schemas -> Anthropic tool definitions (Zod v4 toJSONSchema)
│   │   ├── run-tool-use.ts     # the actual tool-use + validation + retry loop
│   │   └── run-tool-use.test.ts
│   ├── rag/                     # step 4, not built yet
│   └── cache/                    # step 6, not built yet
├── .env.example
├── package.json
└── tsconfig.json
```
