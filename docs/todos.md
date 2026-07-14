# gloomy — todos

Last updated: Jul 15, 2026. Genesis deadline: **Jul 17, 2026, 23:59 UTC**.

Use this as the run-order checklist. Detailed guides: [`deploy-coolify.md`](./deploy-coolify.md), [`okx-genesis.md`](./okx-genesis.md), [`openui-migration.md`](./openui-migration.md).

---

## Phase 1 — Code & quality (local)

- [x] API logging + hot reload (`apps/api/src/log.ts`, `tsx watch`)
- [x] Conversation compounding (full thread history to `/api/chat`)
- [x] CSV ingest → data-driven charts (`apps/api/src/csv/`, parse-to-context)
- [x] OpenUI migration — Lang transport + extended library + `Math` (LaTeX)
  - See [`openui-migration.md`](./openui-migration.md) for what changed
- [x] Quality gates passed locally (typecheck, **52/52** tests, `next build`, Docker image)
- [ ] **Commit + push** OpenUI migration to `main` (large uncommitted tree — required for Coolify)
- [ ] Run prod migration `0002_openui_lang.sql` on deployed Postgres after push
- [ ] Trigger Coolify redeploy for `apps/api` (and `apps/web` if deployed)
- [ ] Fix LLM billing: OpenAI key reported inactive; set `ANTHROPIC_API_KEY` or reactivate OpenAI before live `/api/chat` generation

---

## Phase 2 — Production deploy (Coolify)

Reference: [`deploy-coolify.md`](./deploy-coolify.md)

### `apps/api` (required for OKX registration)

- [x] Coolify app created with **Dockerfile** build pack (not Nixpacks)
- [x] Build context `/`, Dockerfile `apps/api/Dockerfile`, port `4000`
- [x] Dockerfile `--ignore-scripts` fix pushed (`686124b`)
- [ ] Coolify redeployed with latest `main` (OpenUI Lang changes)
- [ ] Environment variables set (runtime-only for secrets — uncheck “build variable”):
  - [ ] `OPENAI_API_KEY` and/or `ANTHROPIC_API_KEY`
  - [ ] `DATABASE_URL` (Postgres **with pgvector** — Supabase/Neon recommended)
  - [ ] `PUBLIC_API_URL=https://<api-domain>`
  - [ ] `PUBLIC_WEB_URL=https://<web-domain>` (if web is deployed)
  - [ ] Optional: `AGENT_TASK_KEY`, `LOG_LEVEL`
- [ ] Production DB ready:
  - [ ] `CREATE EXTENSION IF NOT EXISTS vector;`
  - [ ] `pnpm run db:migrate` against prod `DATABASE_URL` (includes `0002_openui_lang` migration if not applied)
- [ ] Domain + HTTPS green on Coolify

### `apps/web` (recommended — `/d` deliverables + chat UI)

- [ ] Coolify app: Dockerfile `apps/web/Dockerfile`, context `/`, port `3000`
- [ ] **Build arg** `NEXT_PUBLIC_API_URL=https://<api-domain>` (not runtime-only)
- [ ] Domain + HTTPS
- [ ] Redeploy after any API URL change (rebuild, not just restart)

### Post-deploy verification

- [ ] `curl https://<api-domain>/health` → `{"ok":true,...}`
- [ ] `curl https://<api-domain>/.well-known/agent.json` → shows real `PUBLIC_API_URL`, not `localhost`
- [ ] `POST https://<api-domain>/api/chat` with a question → returns OpenUI Lang (or legacy payload) + `viewUrl`
- [ ] Open `https://<web-domain>/chat` — ask a question, see multi-block UI (Stack + Chart/Table/custom)
- [ ] Upload a small CSV, ask “chart these days” — chart uses real values
- [ ] Open a `/d?p=…` link from `/api/agent/task` — renders on web

---

## Phase 3 — OKX.ai ASP registration

Reference: [`okx-genesis.md` §5](./okx-genesis.md), `apps/api/README.md`

**Prerequisites**

- [x] `onchainos` skills installed (`npx skills add okx/onchainos-skills`)
- [x] Avatar ready: `apps/web/public/gloomy-asp-avatar.png`
- [ ] API live at permanent **public HTTPS** URL (localhost rejected)
- [ ] OKX wallet connected in terminal/agent session
- [ ] `onchainos` CLI logged in (API keys in shell or `~/.onchainos/.env` — not on the server)

**Registration steps** (you run these; only `agent create` needs wallet confirmation)

- [ ] `onchainos preflight`
- [ ] `onchainos agent pre-check --role asp`
- [ ] `onchainos agent upload --file apps/web/public/gloomy-asp-avatar.png` → save CDN URL
- [ ] `onchainos agent validate-listing --role asp` with gloomy fields (name, description, A2MCP service → `https://<api-domain>/api/chat`, fee e.g. `"10"`)
- [ ] `onchainos agent create --role asp ...` → note `#<id>`
- [ ] `onchainos agent activate #<id>`
- [ ] Re-verify curls from Phase 2
- [ ] Confirm listing **live/approved** on [okx.ai/agents](https://www.okx.ai/agents)

---

## Phase 4 — Genesis hackathon submission

Deadline: **Jul 17, 2026, 23:59 UTC**

- [ ] Record demo (≤90s): show `/chat` or a `/d` link — question/PDF/CSV → rich interactive UI
- [ ] Post on X with **#OKXAI** (intro + demo)
- [ ] Submit official Google form (link on HackQuest page) with ASP details + X post URL
- [ ] Optional: drive a few real `/api/chat` or marketplace completions for Revenue Rocket / Social Buzz categories

---

## Phase 5 — Optional / future

- [ ] Deploy `apps/web-3d` on Coolify (port `3002`, separate Dockerfile)
- [ ] Large-CSV retrieval (chunk + embed when summary exceeds ~4000 chars)
- [ ] Multi-document grounding (more than one active `documentId` per thread)
- [ ] Streaming OpenUI Lang in `/chat` (progressive render vs wait-for-full-response)
- [ ] PDF export of generated views (not an OpenUI feature today)

---

## Quick reference — env vars

| Variable | Where | Notes |
|---|---|---|
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | Coolify `apps/api` | At least one required for real answers |
| `DATABASE_URL` | Coolify `apps/api` | pgvector Postgres; not `localhost:5433` |
| `PUBLIC_API_URL` | Coolify `apps/api` | `https://<api-domain>` |
| `PUBLIC_WEB_URL` | Coolify `apps/api` | `https://<web-domain>` for manifest + viewUrl |
| `NEXT_PUBLIC_API_URL` | Coolify `apps/web` **build arg** | Baked at Next.js build time |
| `OKX_API_KEY` / `OKX_SECRET_KEY` | Local shell / `~/.onchainos/.env` | For `onchainos` CLI only — **not** on server |
