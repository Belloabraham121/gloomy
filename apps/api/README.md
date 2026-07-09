# apps/api

Backend: Node.js + TypeScript. Owns the Claude tool-use loop, the RAG
retriever, caching, and progress tracking. Shared by both `apps/web` and
`apps/web-3d`.

**Not scaffolded yet.** This is build order step 1. Planned layout once
scaffolded:

```
apps/api/
├── src/
│   ├── index.ts
│   ├── routes/
│   │   ├── chat.ts        # streaming chat endpoint, Claude tool-use loop
│   │   └── progress.ts    # step 6
│   ├── claude/
│   │   ├── client.ts
│   │   ├── systemPrompt.ts
│   │   └── tools/         # one tool per A2UI component, built from packages/a2ui-spec
│   ├── rag/                # step 4
│   │   ├── ingest.ts
│   │   ├── retriever.ts
│   │   └── sources/
│   └── cache/               # step 6
├── test/
├── package.json
└── tsconfig.json
```

Step 1 scope is intentionally narrow: a `/api/chat` route that Claude
tool-use can respond on with hardcoded/stubbed component data, enough to
prove `apps/web` and `apps/api` can talk to each other end-to-end. RAG,
caching, and progress tracking are explicitly out of scope until steps 4
and 6.
