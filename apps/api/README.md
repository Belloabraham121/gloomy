# apps/api

Backend: Node.js + TypeScript + Express. Owns the Claude tool-use loop, the
RAG retriever, caching, and progress tracking. Shared by both `apps/web` and
`apps/web-3d`.

## Current state (build order step 1)

Minimal skeleton, no Claude/RAG yet:

- `GET /health` — liveness check.
- `POST /api/chat` — stub. Accepts `{ threadId, messages }`, echoes the last
  user message back as `{ threadId, reply }`. Proves `apps/web` and
  `apps/api` can talk to each other; not real chat logic yet.

## Run it

```bash
pnpm install   # from repo root or here
pnpm dev       # starts on http://localhost:4000
```

## Planned layout (not all built yet)

```
apps/api/
├── src/
│   ├── index.ts
│   ├── routes/
│   │   ├── chat.ts        # done (stub) — becomes the real Claude tool-use loop in step 3
│   │   └── progress.ts    # step 6
│   ├── claude/              # step 3
│   │   ├── client.ts
│   │   ├── systemPrompt.ts
│   │   └── tools/           # one tool per A2UI component, built from packages/a2ui-spec
│   ├── rag/                 # step 4
│   │   ├── ingest.ts
│   │   ├── retriever.ts
│   │   └── sources/
│   └── cache/                # step 6
├── test/
├── package.json
└── tsconfig.json
```

Next up: build order step 2 happens entirely in `apps/web` (hardcoded A2UI
components, no backend changes needed). Step 3 is where `/api/chat` here
becomes a real Claude tool-use loop.
