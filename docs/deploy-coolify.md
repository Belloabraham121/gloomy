# Deploying gloomy on Coolify → registering it as an OKX.ai ASP

Exact, copy-pasteable walkthrough for getting `apps/api` live at a public
HTTPS URL on Coolify, verifying it, and registering **gloomy** as an OKX.AI
Agent Service Provider (ASP). Written for the Genesis Hackathon deadline of
**Jul 17, 2026, 23:59 UTC** — see `docs/okx-genesis.md` for the full
hackathon timeline; this doc is just the "make it live" mechanics.

This doc does **not** deploy anything, commit anything, or run any
`onchainos`/wallet commands — you run every command below yourself, in your
own Coolify UI / terminal / agent session.

---

## 0. Prerequisites

- A running **Coolify instance** (self-hosted server or Coolify Cloud) that
  you can log into.
- A **domain or subdomain** you control, e.g. `api.yourdomain.com` (and
  optionally `app.yourdomain.com` for the web frontend), with DNS you can
  point at your Coolify server's IP.
- The `gloomy` **GitHub repo connected** to Coolify (Coolify → Sources → add
  your GitHub App/PAT so Coolify can pull this repo).
- At least one of `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` ready to paste in
  (not committed anywhere).
- A **production Postgres with the `pgvector` extension** — see step 2.4;
  the local `apps/api/docker-compose.yml` (pgvector on host port `5433`) is
  dev-only and is not reachable from Coolify.

---

## 1. Why "Dockerfile" build pack, not Nixpacks

The repo root `package.json` has **no `scripts`** block — there's no single
`build`/`start` for a 3-app pnpm monorepo, so Coolify's Nixpacks
auto-detection has nothing to run and will fail (or build the wrong thing).
Each app ships its own production `Dockerfile`
(`apps/api/Dockerfile`, `apps/web/Dockerfile`, `apps/web-3d/Dockerfile`)
that already handles the pnpm workspace correctly. **Always pick "Dockerfile"
as the build pack**, never Nixpacks, for every service in this repo.

---

## 2. Deploy `apps/api` (required — this is what gets registered on-chain)

### 2.1 Create the resource

1. In Coolify: **+ New → Resource → (your project/environment) → Application**.
2. Source: pick the connected GitHub repo, branch `main` (or whichever
   branch you deploy from).
3. **Build Pack: `Dockerfile`** (not Nixpacks — see §1).
4. **Base Directory / Docker Build Context: `/`** (the repo root) — this is
   the field that matters most. It must be the repo root, *not*
   `apps/api`, because the Dockerfile needs to see
   `pnpm-workspace.yaml`, `pnpm-lock.yaml`, and `packages/a2ui-spec` to
   resolve the `@gloomy/a2ui-spec` workspace dependency. In the Coolify UI
   this field is sometimes called "Base Directory" and sometimes "Docker
   Build Context" depending on version — set it to `/` either way.
5. **Dockerfile Location: `apps/api/Dockerfile`**.
6. **Ports Exposes / Ports Mappings: `4000`** — `apps/api` listens on
   `process.env.PORT ?? 4000`; if Coolify injects its own `$PORT` env var
   the app honors it automatically, otherwise it defaults to `4000`. Set
   Coolify's exposed port to match whichever one is actually in effect
   (`4000` unless you explicitly set `PORT` yourself).

### 2.2 Environment variables

Add these in the application's **Environment Variables** tab. Only the
*names* are listed — paste your real values directly into Coolify's UI, never
into a file in this repo.

| Variable | Required? | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | one of these two | Real generation needs at least one LLM key. Without either, `/api/chat` returns `501` with a clear message (cache hits still work). |
| `OPENAI_API_KEY` | one of these two | Also required for PDF/CSV **embeddings** (`text-embedding-3-small`) even if you generate with `LLM_PROVIDER=anthropic` — Anthropic has no embeddings API. |
| `LLM_PROVIDER` | optional | `anthropic` \| `openai`. Unset = Anthropic preferred when both keys are present. |
| `DATABASE_URL` | strongly recommended | Production Postgres **with pgvector** — see §2.4 for exact connection-string shapes. Without it, caching/progress/RAG grounding silently no-op; `/api/chat` still answers, just uncached and ungrounded. |
| `PUBLIC_API_URL` | **required before registering** | `https://<api-domain>` — the exact public URL of this service. Makes `/.well-known/agent.json` advertise the real endpoint (used for ASP discovery/registration). |
| `PUBLIC_WEB_URL` | optional | `https://<web-domain>` — shown as `homepage` in the agent manifest, if you deploy `apps/web` too (§3). |
| `AGENT_TASK_KEY` | optional | Shared secret for `POST /api/agent/task` (the paid marketplace-fulfillment endpoint). If set, callers must send `x-agent-key: <value>`. Leave unset while testing; set it once real marketplace traffic starts. |
| `LOG_LEVEL` | optional | `debug` \| `info` \| `warn` \| `error`. Defaults to `info` in production. |
| `OKX_API_KEY` / `OKX_SECRET_KEY` / `OKX_PASSPHRASE` | **not needed here** | These are read by the *local* `onchainos` CLI (`~/.onchainos/.env` or your shell env) for wallet API-key login, **not** by this Express server — do not set them on the Coolify service. |

Do **not** set `PORT` unless you have a specific reason to override `4000` —
just make sure whatever value is in effect matches the port mapping in §2.1
step 6.

### 2.3 Deploy

Click **Deploy**. Watch the build log — it should show pnpm installing the
workspace, then building `@gloomy/a2ui-spec` and `@gloomy/api` in turn (see
`apps/api/Dockerfile`). If it fails, jump to §6 (Common pitfalls) before
retrying.

### 2.4 Production Postgres + pgvector

`apps/api/docker-compose.yml` only spins up a local pgvector container on
host port `5433` for development — it is **not** something Coolify will use
in production; you need a real, reachable production database. Three good
options, in order of least setup:

**Option A — Supabase or Neon (recommended, pgvector pre-installed)**

Both ship pgvector out of the box, so you skip installing the extension
yourself (you still run `CREATE EXTENSION vector;` once — see §2.5 — but it's
instant since the extension is already available on the host).

1. Create a project on [Supabase](https://supabase.com) or
   [Neon](https://neon.tech).
2. Copy its Postgres connection string. Shape:
   ```
   postgres://<user>:<password>@<host>:5432/<database>?sslmode=require
   ```
   (Supabase/Neon both require `sslmode=require` — check their dashboard for
   the exact copy-paste string, since the pooled vs. direct connection host
   differs per provider.)
3. Paste it into Coolify as `DATABASE_URL` on the `apps/api` resource.

**Option B — Coolify's one-click Postgres, self-managed pgvector**

Coolify's built-in "Postgresql" service template does **not** include
pgvector by default. If you use it anyway:

1. In Coolify, add a **Postgresql** resource in the same project.
2. You must get the `pgvector/pgvector` extension into that container's
   image — the stock `postgres` image Coolify uses does not have it
   compiled in. This typically means switching the Postgres resource's
   Docker image to a pgvector-enabled one (e.g. `pgvector/pgvector:pg16`,
   the same image `apps/api/docker-compose.yml` uses locally) via Coolify's
   "Image" override field for that resource, then redeploying it.
3. Once it's the pgvector image, connect and run `CREATE EXTENSION vector;`
   (§2.5).
4. Use Coolify's internal service name as the host in `DATABASE_URL` (Coolify
   shows the exact internal connection string on the resource's page) —
   shape:
   ```
   postgres://<user>:<password>@<internal-service-name>:5432/<database>
   ```

**Option C — a standalone `pgvector/pgvector` Docker service in Coolify**

Deploy `apps/api/docker/init-pgvector.sql`'s image directly as its own
Coolify "Docker Image" resource:

1. **+ New → Resource → Docker Image**, image `pgvector/pgvector:pg16`.
2. Set env vars `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (mirror
   `apps/api/docker-compose.yml`'s `gloomy` / `gloomy` / `gloomy_dev` or pick
   your own).
3. Give it a persistent volume for `/var/lib/postgresql/data` (Coolify
   prompts for this).
4. Use its internal Coolify network address as the host in `DATABASE_URL`.

Either way, the connection string shape `apps/api` expects (see
`apps/api/.env.example`) is:

```
postgres://<user>:<password>@<host>:<port>/<database>
```

### 2.5 Run the migration against the production database

`apps/api` needs its schema (including the pgvector-backed RAG chunk table)
applied once. The DB also needs the extension itself created — do that
first, then migrate. Two ways to run the migration, pick whichever is
easier for you:

**A. Locally, pointed at the production `DATABASE_URL`** (simplest — no
Coolify exec needed):

```bash
cd apps/api

# 1. Create the extension (one-time, via any Postgres client) — e.g. with psql:
psql "<your production DATABASE_URL>" -c "CREATE EXTENSION IF NOT EXISTS vector;"

# 2. Run the app's own migration script against that same URL:
DATABASE_URL="<your production DATABASE_URL>" pnpm run db:migrate
```

This runs `tsx src/db/migrate.ts` (see `apps/api/package.json`'s
`db:migrate` script), which applies everything under
`apps/api/src/db/migrations/`. Make sure your local machine's Postgres
client can actually reach the production host (Supabase/Neon are reachable
from anywhere by default; a Coolify-hosted Postgres may need its firewall/
"Allow public access" toggle turned on temporarily, or run option B instead).

**B. Via a one-off command inside the running Coolify container** (no local
DB access needed):

1. In Coolify, open the `apps/api` resource → **Terminal** (or "Execute
   Command" depending on Coolify version) to get a shell inside the running
   container.
2. From that shell:
   ```bash
   cd /repo/apps/api
   node -e "require('pg')" 2>/dev/null; \
   psql "$DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>/dev/null || echo "no psql in image — use option A or a one-off client"
   pnpm run db:migrate
   ```
   The production image is `node:22-alpine` with no `psql` client installed,
   so `CREATE EXTENSION vector;` may need to be run separately from a
   machine/tool that does have a Postgres client (e.g. option A's `psql`
   line, or your DB provider's SQL editor — Supabase and Neon both have a
   built-in SQL editor in their dashboard where you can just paste
   `CREATE EXTENSION IF NOT EXISTS vector;` and run it). `pnpm run
   db:migrate` itself works fine from inside the container since `tsx` and
   the `postgres` driver are already installed there.

Either way, confirm it worked by re-deploying/restarting `apps/api` in
Coolify and checking the logs for a clean startup (no DB connection errors),
then hit `/health` (§4).

### 2.6 Domain + HTTPS

1. In the `apps/api` resource → **Domains**, add `https://<api-domain>`
   (e.g. `https://api.yourdomain.com`).
2. Point that domain's DNS `A`/`CNAME` record at your Coolify server.
3. Coolify auto-provisions a Let's Encrypt certificate once DNS resolves —
   wait for the padlock to go green in the Coolify UI before moving on.
4. Re-deploy once the domain is attached so `PUBLIC_API_URL` (§2.2) matches
   the domain you just set.

---

## 3. Deploy `apps/web` (optional, but recommended)

Recommended because the marketplace fulfillment endpoint
(`POST /api/agent/task`) returns a `viewUrl` (`/d?p=…`) that only renders if
`apps/web` is actually live — useful for demoing gloomy and for buyers to see
delivered work.

1. **+ New → Resource → Application**, same repo, same branch.
2. **Build Pack: `Dockerfile`**.
3. **Base Directory / Docker Build Context: `/`** (repo root — same reason
   as `apps/api`).
4. **Dockerfile Location: `apps/web/Dockerfile`**.
5. **Ports Exposes / Ports Mappings: `3000`**.
6. **Build Argument** (not just a runtime env var — this is the important
   part): `NEXT_PUBLIC_API_URL=https://<api-domain>`. Next.js **inlines**
   `NEXT_PUBLIC_*` variables into the client JS bundle at *build* time, not
   at container start — `apps/web/Dockerfile` already declares
   `ARG NEXT_PUBLIC_API_URL` and promotes it to `ENV` before `pnpm --filter
   @gloomy/web build` runs, so it must be supplied as a **Docker build
   argument** in Coolify's "Build Arguments" section for this resource, not
   only as an "Environment Variable" (those are typically only injected at
   *runtime* in Coolify, which would be too late for Next.js's build-time
   inlining). If Coolify's UI doesn't distinguish build args from env vars
   for your version, set it in both places to be safe.
7. Add a domain (e.g. `https://app.yourdomain.com`) under **Domains**, wait
   for the Let's Encrypt cert, same as §2.6.
8. Deploy. If you change `apps/api`'s domain later, you must **rebuild**
   `apps/web` (not just restart) for the new `NEXT_PUBLIC_API_URL` to take
   effect.

(`apps/web-3d` follows the identical pattern with
`apps/web-3d/Dockerfile`, port `3002`, if you want it live too — it's not
required for ASP registration since gloomy registers `apps/api`'s
`/api/chat`.)

---

## 4. Post-deploy verification

Run these against your real `apps/api` domain once it's deployed and HTTPS
is green:

```bash
# 1. Liveness
curl https://<api-domain>/health
# → {"ok":true,"service":"..."}

# 2. Agent manifest — should now show PUBLIC_API_URL, not localhost
curl https://<api-domain>/.well-known/agent.json
# → { "name":"gloomy", ..., "endpoints": { "chat": { "url": "https://<api-domain>/api/chat", ... }, ... } }

# 3. A real chat call (needs at least one LLM key set in step 2.2)
curl -X POST https://<api-domain>/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"How does a circle'\''s area relate to its radius?"}]}'
# → a { component, props, provider, cached } payload
```

If step 2 still shows `localhost` or the wrong host, `PUBLIC_API_URL` isn't
set correctly on the `apps/api` resource, or the app hasn't been redeployed
since you set it. If step 3 returns `501`, no LLM key is configured. If step
3 hangs or 502s, check the Coolify logs for the container — likely a DB
connectivity or LLM API error.

---

## 5. Register gloomy as an OKX.AI ASP

Once §4's checks pass against your **permanent** production domain (not a
preview URL — the endpoint is written on-chain and changing it later needs
an `agent update`), register it. This section is condensed from
`apps/api/README.md` and the `okx-ai` skill's
`references/identity-register.md` into a run-order checklist.

**You must run this yourself** — it touches your OKX wallet, and
`agent create` performs a single on-chain write that the driving skill will
render a confirmation card for; only that one step needs your explicit
wallet approval. Everything before it (`preflight`, `pre-check`, `upload`,
`validate-listing`) is off-chain / read-only / safe to run freely.

**Prerequisites**
- [ ] `apps/api` verified live per §4, at its permanent domain.
- [ ] `onchainos`/`okx-ai` skill installed
      (`npx skills add okx/onchainos-skills`) in the session you register
      from.
- [ ] Your OKX wallet connected in that session.
- [ ] Avatar file ready: `apps/web/public/gloomy-asp-avatar.png` (already in
      this repo), or your own image (image *links* are rejected — must be a
      file upload).

**Trigger it** by telling the `okx-ai` skill *"register gloomy as an ASP"*
— it drives the conversational flow (consent, field Q&A, QA, confirmation
card) using these underlying CLI calls in order:

```bash
# 1. Preflight — verifies/updates CLI + wallet login (off-chain)
onchainos preflight

# 2. First-time consent + per-wallet uniqueness (one ASP per address) (off-chain)
onchainos agent pre-check --role asp

# 3. Upload the avatar → CDN URL (off-chain; image links are rejected, must be a file)
onchainos agent upload --file apps/web/public/gloomy-asp-avatar.png
```

**Listing field values for gloomy:**

| Field | Value |
|---|---|
| Name | `gloomy` (3–25 chars) |
| Description | `"Turns a question, a PDF, or a CSV dataset into one interactive, schema-validated learning component that remembers the conversation."` (mentions conversation memory + PDF + CSV; ≤500 chars) |
| Service [1] name | `Interactive concept explainer` (5–30-char noun phrase) |
| Service [1] type | `A2MCP` (direct HTTP API) |
| Service [1] fee | `"10"` (digits only, USDT implied — no symbol/unit) |
| Service [1] endpoint | `https://<api-domain>/api/chat` |
| Service [2] (optional) name | e.g. `Marketplace task fulfillment` |
| Service [2] type | `A2A` (agent-to-agent, negotiated over the marketplace) |
| Service [2] endpoint | not applicable for `A2A` in the same way — the CLI/skill's field prompts will clarify; conceptually it's `https://<api-domain>/api/agent/task`, fulfilled via `onchainos agent deliver` after a `job_accepted` event, not called directly by buyers |

```bash
# 4. QA pass before writing on-chain (off-chain)
onchainos agent validate-listing --role asp \
  --name "gloomy" \
  --description "Turns a question, a PDF, or a CSV dataset into one interactive, schema-validated learning component that remembers the conversation." \
  --service '[{"name":"Interactive concept explainer","type":"A2MCP","fee":"10","endpoint":"https://<api-domain>/api/chat"}]'

# 5. THE ON-CHAIN WRITE — confirm the wallet prompt when it appears
onchainos agent create --role asp \
  --name "gloomy" \
  --description "Turns a question, a PDF, or a CSV dataset into one interactive, schema-validated learning component that remembers the conversation." \
  --picture "<CDN URL returned by step 3>" \
  --service '[{"name":"Interactive concept explainer","type":"A2MCP","fee":"10","endpoint":"https://<api-domain>/api/chat"}]'
# → returns a new #id (newAgentId)

# 6. Publish it so it's discoverable/hireable (state toggle, no wallet prompt)
onchainos agent activate #<id>
```

> Only **step 5 (`agent create`)** is the on-chain wallet write you must
> personally confirm. Steps 1–4 and 6 are safe to run without a wallet
> confirmation prompt (step 6 is a state toggle, not a new transaction
> requiring the same confirm gate as `create`).

**Re-verify after registering:**

```bash
curl https://<api-domain>/health
curl https://<api-domain>/.well-known/agent.json
curl -X POST https://<api-domain>/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"How does a circle'\''s area relate to its radius?"}]}'
```

**Then, separately (required for hackathon eligibility, not part of the
on-chain tx):**
- Confirm the listing shows **live/approved** on
  [okx.ai/agents](https://www.okx.ai/agents) — this OKX-side review is the
  hard eligibility gate.
- Post the X demo with `#OKXAI`.
- Submit the official Google form linked from the HackQuest page's Step 4 /
  "Start Register" button, before **Jul 17, 2026, 23:59 UTC**.

See `docs/okx-genesis.md` for the full hackathon prep plan and deadlines.

---

## 6. Common pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| Build fails with `@gloomy/a2ui-spec not found` / `ENOENT packages/a2ui-spec` | Build context set to `apps/api` instead of the repo root `/` | Set "Base Directory" / "Docker Build Context" to `/`, keep "Dockerfile Location" as `apps/api/Dockerfile` |
| Coolify tries to run `pnpm install` / `npm run build` directly and fails | Build pack left on Nixpacks | Switch the resource's Build Pack to **Dockerfile** (§1) |
| `pnpm run db:migrate` fails with `extension "vector" is not available` | Target Postgres doesn't have pgvector installed | Use Supabase/Neon (pgvector pre-installed), or switch the Postgres image to `pgvector/pgvector:pg16` (§2.4 options A/B/C), then re-run `CREATE EXTENSION IF NOT EXISTS vector;` |
| `apps/web`'s deployed site calls the wrong/old API URL, or `localhost:4000` | `NEXT_PUBLIC_API_URL` set as a runtime env var only, not a **build arg**, or set after the last build | Set it under Coolify's Build Arguments for the `apps/web` resource (§3 step 6) and **rebuild** (not just restart) |
| `onchainos` rejects the endpoint during registration | Endpoint is `http://`, `localhost`, a private IP, or otherwise not really live | Re-run §4's curls against the real `https://<api-domain>` first; only register once they succeed publicly |
| `/.well-known/agent.json` still shows `localhost` after deploying | `PUBLIC_API_URL` not set, or set but not redeployed | Set `PUBLIC_API_URL=https://<api-domain>` in Coolify env vars (§2.2) and redeploy |
| `/api/chat` returns `501` | Neither `ANTHROPIC_API_KEY` nor `OPENAI_API_KEY` set | Set at least one in Coolify env vars and redeploy |
