# gloomy API (`apps/api`)

The backend that turns a question into one schema-validated interactive
component. Express + TypeScript (ESM), multi-provider LLM (Claude / OpenAI),
optional Postgres + pgvector for cache / progress / PDF grounding (RAG).

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness check → `{ ok: true, service }`. |
| `GET` | `/.well-known/agent.json` (also `/agent`) | Machine-readable agent manifest: name, description, version, the 6 A2UI capabilities, endpoint URLs. Used for agent discovery / the OKX ASP listing. |
| `POST` | `/api/chat` | `{ messages:[{role,content}], sessionId?, documentId? }` → one `{ component, props, provider, cached }` payload, validated against the A2UI Zod schema. `messages` is the full thread (capped server-side to the most recent 24) so follow-ups build on prior turns — see "Conversation history" in `docs/architecture.md`. Cache hit → returns immediately with `cached:true`, no LLM call. |
| `POST` | `/api/agent/task` | Marketplace fulfillment: `{ task, jobId?, documentId? }` → `{ component, props, viewUrl, deliverMessage }`. `viewUrl` is a stateless public render link (`/d?p=…` on the web app); `deliverMessage` is ready for `onchainos agent deliver --message`. Optional auth via `AGENT_TASK_KEY` env + `x-agent-key` header. |
| `POST` | `/api/documents` | Multipart PDF **or CSV** upload (field `file`) → `{ sourceId, title, chunkCount }`; ground later questions by passing that `documentId` to `/api/chat`. CSV is parsed (not RAG-embedded) into a compact real-data summary — see "Document upload + data grounding" in `docs/architecture.md`. |

### Provider selection (`src/llm/index.ts`)

`LLM_PROVIDER=anthropic|openai` forces one (and fails loudly if that key is
missing). Unset, Anthropic is preferred when `ANTHROPIC_API_KEY` is present,
else OpenAI. Both handlers share one Zod validation gate (`src/llm/shared.ts`)
and provider-neutral tool specs generated from `packages/a2ui-spec`.

### Degrades safely (important for a public deploy)

- **No LLM key** → `/api/chat` returns `501` with a clear message (checked
  *after* the cache lookup, so cached answers still work with zero keys).
- **No / unreachable `DATABASE_URL`** → cache, progress, and grounding become
  no-ops; a configured-but-down Postgres is treated as a cache miss, never a
  crash. `400` on empty `messages`, `502` if the model never returns a valid
  tool call (incl. after one retry).

## Local dev

```bash
cd apps/api
cp .env.example .env        # add ANTHROPIC_API_KEY and/or OPENAI_API_KEY
pnpm run db:migrate         # only if using Postgres (needs the pgvector extension)
pnpm dev                    # http://localhost:4000
pnpm test                   # 29 tests: mocked-client + RAG unit tests always run;
                            # live-Postgres tests run only if DATABASE_URL is set + reachable
```

## Deploy (required before OKX ASP registration)

The ASP service endpoint registered on-chain must be a **public, permanent
`https://` URL** (`localhost` / `http` / private IPs are rejected), so the API
must be deployed first. A production `Dockerfile` already exists at
`apps/api/Dockerfile`.

**Any container host works (Railway / Render / Fly / Coolify / a VPS).** The one
non-obvious bit, because this is a pnpm monorepo:

1. **Build context = the repo root**, Dockerfile path = `apps/api/Dockerfile`
   (the image installs the whole workspace so `@gloomy/a2ui-spec` resolves).
2. **Env vars on the host:**
   - `ANTHROPIC_API_KEY` and/or `OPENAI_API_KEY` — at least one (required for real answers).
   - `PUBLIC_API_URL=https://<your-api-domain>` — makes `/.well-known/agent.json` advertise the real URL.
   - optional: `LLM_PROVIDER`, `DATABASE_URL` (Postgres+pgvector, e.g. Supabase / Neon), `PUBLIC_WEB_URL`.
   - `PORT` is read from the env if the host injects one.
3. **Verify the live deploy:**
   ```bash
   curl https://<your-api-domain>/health
   curl https://<your-api-domain>/.well-known/agent.json
   curl -X POST https://<your-api-domain>/api/chat \
     -H 'Content-Type: application/json' \
     -d '{"messages":[{"role":"user","content":"How does a circle'\''s area relate to its radius?"}]}'
   # → a { component, props } payload once keys are set
   ```

Point the frontend's `NEXT_PUBLIC_API_URL` (on Vercel) at this same URL.

## Register gloomy as an OKX ASP (Agent Service Provider)

Registration is an **ERC-8004 agent identity on XLayer**, created through the
`onchainos` CLI from the `okx/onchainos-skills` toolkit (`okx-ai` skill).
On-chain fees are covered by OKX. **It touches your OKX wallet — run it yourself**
in a session where your wallet is connected; the `okx-ai` skill drives the exact
conversational flow and renders a confirmation card before the single on-chain
write. Prerequisites and steps, taken directly from that skill's
`references/identity-register.md`:

**Prerequisites**
1. The API deployed at a public `https://` URL (above) — becomes the permanent on-chain service endpoint.
2. An OKX wallet / OnchainOS account connected (the CLI pre-flight handles wallet login).
3. An **avatar image file** (ASP registration requires one; image links are rejected).

**Flow** (trigger it by telling the skill *"register gloomy as an ASP"*):
1. `onchainos preflight` — updates/verifies the CLI + wallet login.
2. `onchainos agent pre-check --role asp` — first-time consent + per-wallet uniqueness (one ASP per address).
3. `onchainos agent upload --file <avatar>` → avatar CDN URL.
4. Listing fields:
   - **Name**: `gloomy` (3–25 chars).
   - **Description**: e.g. *"Turns a question, a PDF, or a CSV dataset into one interactive, schema-validated learning component that remembers the conversation."* (≤500 chars).
   - **Service**: name (5–30-char noun phrase, e.g. "Interactive concept explainer") · 2-part description (what it does / what the caller provides) · **Type `A2MCP`** (HTTP API) · **Fee** digits only, USDT implied (e.g. `"10"`) · **Endpoint** = `https://<your-api-domain>/api/chat`.
5. `onchainos agent validate-listing --role asp --name … --description … --service '[…]'` — QA pass.
6. `onchainos agent create --role asp --name … --description … --picture <url> --service '[…]'` → new `#id`.
7. `onchainos agent activate #<id>` — publish it so others can discover / hire it.

> The endpoint is **permanent on-chain** — deploy to a stable domain before
> registering; changing it later needs an `agent update`.

## Fulfilling marketplace tasks (the A2A lane)

Marketplace task envelopes (`{msgType:"a2a-agent-chat", jobId, sender:{role:1},…}`
and `{agentId, message:{source:"system", event, jobId}}`) arrive over **XMTP
into the ASP operator's agent session** (Claude Code / OpenClaw with
`okx/onchainos-skills` + the `okx-a2a` daemon) — they are *not* HTTP calls to
this API. The session reacts by running `onchainos agent next-action` and
executing its output (see the skill's `references/task-core.md`). gloomy's part
of the lane is the fulfillment: one HTTP call that does the actual work and
returns a deliver-ready result.

The full flow, using the skill's own commands:

1. **Envelope arrives** in the operator session → the `okx-ai` skill activates
   and drives negotiation / `apply` via
   `onchainos agent next-action --role auto --agentId <id> --message '<…>'`.
2. **Wait for the `job_accepted` system event.** Per the skill
   (`task-asp.md`): *never* do the work or deliver before it — escrow isn't
   funded until then, and the CLI rejects `deliver` while `status != accepted`.
3. **Fulfill** with one call:
   ```bash
   curl -X POST https://<your-api-domain>/api/agent/task \
     -H 'Content-Type: application/json' \
     -H 'x-agent-key: <AGENT_TASK_KEY, if configured>' \
     -d '{"task":"<the job description from the task>","jobId":"<jobId>"}'
   ```
   → `{ component, props, viewUrl, deliverMessage }`. `viewUrl` is a
   **stateless** link (`/d?p=<encoded payload>` on the web app) that renders
   the interactive component for the buyer forever, with no storage behind it.
4. **Deliver**:
   ```bash
   onchainos agent deliver <jobId> --message "<deliverMessage>" --agent-id <aspAgentId>
   ```
   (optionally also `--file` with the raw `{component, props}` JSON saved to disk).

Service-type note for the listing: register the service as **`A2A`**
(agent-to-agent) for the marketplace lane above; the **`A2MCP`** (direct API)
lane is `/api/chat`. One listing can carry both services.

## Testing

`pnpm test`, 46 tests:
- `src/llm/{anthropic,openai,provider}.test.ts` — mocked clients: valid tool
  call, unknown component, retry succeeds/fails, text-only, malformed JSON args,
  and provider selection logic.
- `src/rag/{chunk,pdf}.test.ts` — chunker + real-PDF text extraction (no key needed).
- `src/csv/parse.test.ts` — CSV parsing (quoted fields, CRLF, empty input) and
  summary generation (numeric/text column stats, sample-row + total-length caps).
- `src/payload-link.test.ts` + `src/routes/agent-task.test.ts` — deliverable
  link round-trip, URL safety, tamper/garbage rejection, and the fulfillment
  endpoint's link/auth helpers.
- `src/db/db.test.ts` — live Postgres (skips cleanly without a reachable
  `DATABASE_URL`): cache miss/set/upsert, per-document cache scoping, session
  reuse, and a real pgvector cosine query.

## Layout

```
apps/api/src/
├── index.ts                 # app wiring, body-size guard
├── routes/
│   ├── agent.ts             # GET /.well-known/agent.json + /agent (manifest)
│   ├── agent-task.ts        # POST /api/agent/task (marketplace fulfillment)
│   ├── chat.ts              # POST /api/chat (+ grounding)
│   └── documents.ts         # POST /api/documents (PDF upload)
├── llm/                     # getLlmProvider(), Claude + OpenAI loops, Zod gate, tool specs
├── rag/                     # pdf → chunk → embed → retrieve (grounding)
├── db/                      # Drizzle schema, client, migrations
├── cache/                   # best-effort cache (DB errors → miss)
└── progress/                # best-effort progress rows
```
