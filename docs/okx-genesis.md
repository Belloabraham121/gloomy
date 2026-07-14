# OKX.AI Genesis Hackathon — prep + ASP registration guide for gloomy

Working notes for entering **gloomy** in the OKX.AI Genesis Hackathon, hosted
on HackQuest. Sources linked throughout; verify dates/links against the live
pages before acting, since hackathon pages get edited.

> ⚠️ **Deadline check (as of Jul 14, 2026):** the HackQuest listing shows
> **"3 days left"** — registration + submission close **Jul 17, 2026, 23:59
> UTC**. The commonly-quoted "7‑day builder journey" is HackQuest's generic
> template, not the actual runway left for this cohort. Plan for **~3 days**,
> not 7 — the day-by-day plan below is compressed accordingly.

## 1. Rules / key constraints

- **Host:** OKX, co-hosted with HackQuest. Online, global, open beyond crypto.
- **Prize pool:** $100,000 total — Best Product / Creative Genius / Revenue
  Rocket ($20k each: 1st $10k, 2nd $6k, 3rd $4k), Finance Copilot / Software
  Utility / Lifestyle Companion / Artistic Excellence ($7.5k each, 3×$2.5k),
  Social Buzz ($10k, 10×$1k for social traction).
- **Schedule:** Registration + submission both **Jul 2, 2026 11:00 UTC → Jul
  17, 2026 23:59 UTC**. Reward announcement **Jul 23, 2026 23:00**.
- **How to enter (4 steps, all required):**
  1. Build an ASP (Agent Service Provider) solving a real use case — crypto
     or non-crypto both welcome.
  2. **List it on the OKX.AI marketplace and get it approved/live.** If the
     listing isn't approved or doesn't go live, the whole submission is
     invalid — this is the hard gate, not a formality.
  3. Post an intro + demo (≤90s, can be embedded in the same post — no
     separate video upload required) on X with **#OKXAI**.
  4. Submit the official Google form (linked from the HackQuest page's "Start
     Register" / Step 4 button) before the deadline, including ASP details +
     the X post link.
- **Judging:** internal OKX AI review; per-category criteria are qualitative
  ("strongest product experience", "revenue/orders/reviews", etc.) except
  Revenue Rocket and Social Buzz, which reward measurable traction during the
  campaign — so it's worth actually driving a few real chats/uses and an X
  post with engagement, not just registering and stopping.

**Sources:** [HackQuest hackathon page](https://hackquest.io/en/hackathons/OKXAI-Genesis-Hackathon) · [OKX Build X hackathon page](https://web3.okx.com/xlayer/build-x-hackathon) · [OKX Build X series](https://web3.okx.com/xlayer/build-x-series) · [OKX AI marketplace](https://www.okx.ai/)

## 2. Required developer resources

- **`onchainos` CLI + skills** — `okx/onchainos-skills` on GitHub. Install:
  `npx skills add okx/onchainos-skills` (auto-detects Cursor/Claude
  Code/Codex/OpenCode). The relevant skill is **`okx-ai`**: ERC-8004 on-chain
  agent identity (register/update/search/rate/service-list) + task
  marketplace (publish/accept/deliver/dispute). `okx-guide` handles onboarding
  / role-routing if you're unsure where to start.
  [Repo](https://github.com/okx/onchainos-skills) · [README](https://github.com/okx/onchainos-skills/blob/main/README.md)
- **OKX Developer Portal** (only needed if you outgrow the CLI's built-in
  sandbox keys — not required for a single ASP registration):
  [web3.okx.com/onchainos/dev-portal](https://web3.okx.com/onchainos/dev-portal) →
  connect wallet → verify → create project → generate `OKX_API_KEY` /
  `OKX_SECRET_KEY` / `OKX_PASSPHRASE`.
- **Chain:** registration is an ERC-8004 identity on **XLayer**; on-chain fees
  are covered by OKX for this campaign.
- **Agent/service types:** `A2MCP` (direct HTTP API, buyer calls your
  endpoint directly — this is gloomy's `/api/chat`) vs `A2A` (agent-to-agent,
  negotiated over XMTP through the marketplace task lane — gloomy's
  `/api/agent/task`). One listing can carry both services.
- **In-repo reference:** `apps/api/README.md` already documents the exact
  registration + task-fulfillment flow end-to-end (prerequisites, CLI
  commands, listing field values, curl checks) — section 5 below is a
  condensed, execution-ordered version of it.

No local `okx-ai` (or `onchainos`) Cursor skill is currently installed in this
environment (checked `~/.cursor/skills-cursor` and `~/.agents/skills` — only
unrelated skills present, e.g. `swap-integration`, `find-skills`). Install it
yourself with the `npx skills add okx/onchainos-skills` command above before
running the registration flow, so the `okx-ai` skill drives the exact
conversational steps (pre-flight, consent, listing validation) instead of you
hand-rolling `onchainos` calls.

## 3. How gloomy fits (don't pivot — strengthen the existing pitch)

gloomy is already a clean **Software Utility** ASP: it turns a question, an
uploaded PDF, **or an uploaded CSV/dataset**, into one schema-validated
interactive UI component (Diagram, StepThrough, Quiz, Simulation, Chart,
FormulaStepper) via Claude/OpenAI tool-use, non-crypto, real utility, both
`A2MCP` (`/api/chat`) and `A2A` (`/api/agent/task` marketplace lane) already
implemented server-side. That's a genuinely complete ASP, not a hackathon
stub — the gap is deployment + registration, not features.

**Two product gaps closed this session** (see `docs/architecture.md` for
the implementation notes):
1. **Conversation now compounds.** `/api/chat` accepts and uses the full
   thread history, not just the latest message, so "now chart that" / "make
   it a quiz" builds on the component that was just shown instead of
   starting over.
2. **CSV → real data-driven Chart.** Upload a CSV and gloomy parses the
   actual columns/rows into a compact summary (types, min/max/avg, sample
   rows) and grounds the next turn in it, so "chart these days" produces a
   `Chart` populated from the real numbers in the file — not an invented
   generic explanation box. This still returns exactly one interactive
   component per turn, same contract as before; it's a stronger
   demonstration of "fits the data" rather than a new kind of output.

**3 ways to strengthen the submission without inventing a new product:**

1. **Make the demo instantly legible.** The `viewUrl` (`/d?p=…`) is a
   stateless, shareable render of *one* interactive component — perfect for
   the required X demo: ask gloomy a question, screen-record the component
   appearing, drop the `/d?p=…` link in the reply so judges can interact with
   it live instead of just watching a video.
2. **Lean on "Revenue Rocket" mechanics.** The listing already supports a fee
   (`onchainos agent create --fee "10"` etc.) — pick a small non-zero fee for
   the marketplace `A2A` service so real task completions during the judging
   window count as qualified revenue, not just registration.
3. **Sharpen the one-line pitch for non-crypto judges** (the hackathon is
   explicitly open beyond crypto): *"Ask any question, upload a PDF or a
   CSV — get back one interactive, data-aware lesson (diagram, quiz,
   step-through, simulation, chart) that remembers the conversation,
   instead of a wall of text."* Lead with that on X and in the marketplace
   description; the AI/agent/onchain plumbing is the "how", not the pitch.

## 4. Compressed prep plan (≈3 days left, not 7)

**Day 0 (today, remainder) — Deploy + install tooling**
- Deploy `apps/api` to a public HTTPS host (Railway/Render/Fly/Coolify/VPS) —
  see `apps/api/README.md` "Deploy" section. Set `ANTHROPIC_API_KEY` and/or
  `OPENAI_API_KEY`, `PUBLIC_API_URL`. Verify `/health` and
  `/.well-known/agent.json` respond publicly.
- Deploy `apps/web` (e.g. Vercel), point `NEXT_PUBLIC_API_URL` at the API.
- Run `npx skills add okx/onchainos-skills` in a Cursor/Claude Code session
  connected to your OKX wallet. Do **not** run registration yet.
- Avatar file is ready: `apps/web/public/gloomy-asp-avatar.png` (generated
  this session — square, dark/purple, matches the site's `#6c5ce7` accent).
  Swap it for your own art if you want something more bespoke before
  registering.

**Day 1 — Register the ASP**
- Run the registration flow yourself (wallet must be connected on your end —
  see section 5 below for the exact commands and field values).
- Once `onchainos agent activate #<id>` succeeds, hit the verification curls
  in section 5 to confirm the live listing actually answers.
- Do a handful of real `/api/chat` calls (and one `/api/agent/task` +
  `deliver` round trip if you have time) so there's real usage before judging.

**Day 2 — Demo + submit**
- Record the ≤90s demo: ask a real question in `/chat`, show the generated
  component, drop the `/d?p=…` link.
- Post on X with **#OKXAI**, the pitch line from section 3, and the demo.
- Fill out the official Google form (ASP details + X post link) — don't wait
  until the last hour; OKX reviews listings in parallel during the window, so
  earlier submission gives more time to fix a rejected listing.
- Buffer slack for OKX's internal review turnaround before 23:59 UTC Jul 17.

**If anything slips:** the hard gate is "listed + live on OKX.AI" — prioritize
getting the ASP registered and activated over polishing the demo video.

## 5. Onchainos registration — exact steps for gloomy

Condensed from `apps/api/README.md` (which cites the `okx-ai` skill's
`references/identity-register.md` directly) into a run-order checklist.
**You must run this yourself** — it touches your OKX wallet, and step 6 is a
single on-chain write the skill will show you a confirmation card for first.

**Prerequisites (must all be true before starting):**
- [ ] `apps/api` is deployed at a permanent public `https://` URL (not
      localhost/http/private IP — the CLI rejects those).
- [ ] `onchainos`/`okx-ai` skill installed (`npx skills add
      okx/onchainos-skills`) in the agent session you'll register from.
- [ ] Your OKX wallet is connected in that session.
- [ ] An avatar image file on disk — use `apps/web/public/gloomy-asp-avatar.png`
      from this repo, or your own.

**Trigger it** by telling the `okx-ai` skill *"register gloomy as an ASP"* —
it drives these steps:

```bash
# 1. Preflight — verifies/updates CLI + wallet login
onchainos preflight

# 2. First-time consent + per-wallet uniqueness check (one ASP per address)
onchainos agent pre-check --role asp

# 3. Upload the avatar → CDN URL (image links are rejected, must be a file)
onchainos agent upload --file apps/web/public/gloomy-asp-avatar.png
```

**4. Fill the listing fields** (values to use for gloomy):

| Field | Value |
|---|---|
| Name | `gloomy` (3–25 chars) |
| Description | "Turns a question, a PDF, or a CSV dataset into one interactive, schema-validated learning component that remembers the conversation." (≤500 chars) |
| Service name | e.g. `Interactive concept explainer` (5–30 char noun phrase) |
| Service type | `A2MCP` for the direct API; add a second service entry with type `A2A` for the marketplace task lane (both can live on one listing) |
| Fee | digits only, USDT implied — e.g. `"10"` (non-zero recommended, see §3.2) |
| Endpoint | `https://<your-api-domain>/api/chat` (for the `A2MCP` service) |

```bash
# 5. QA pass before writing on-chain
onchainos agent validate-listing --role asp \
  --name "gloomy" \
  --description "Turns a question, a PDF, or a CSV dataset into one interactive, schema-validated learning component that remembers the conversation." \
  --service '[{"name":"Interactive concept explainer","type":"A2MCP","fee":"10","endpoint":"https://<your-api-domain>/api/chat"}]'

# 6. The single on-chain write — confirm the wallet prompt when it appears
onchainos agent create --role asp \
  --name "gloomy" \
  --description "Turns a question, a PDF, or a CSV dataset into one interactive, schema-validated learning component that remembers the conversation." \
  --picture "<CDN URL from step 3>" \
  --service '[{"name":"Interactive concept explainer","type":"A2MCP","fee":"10","endpoint":"https://<your-api-domain>/api/chat"}]'
# → returns a new #id

# 7. Publish it so it's discoverable/hireable
onchainos agent activate #<id>
```

**Verify the live deploy responds** (run before *and* after registering):

```bash
curl https://<your-api-domain>/health
curl https://<your-api-domain>/.well-known/agent.json
curl -X POST https://<your-api-domain>/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"How does a circle'\''s area relate to its radius?"}]}'
```

> The endpoint is **permanent on-chain** once registered — don't register
> against a throwaway/preview URL; changing it later needs `onchainos agent
> update`.

**Then, separately (not part of on-chain registration, but required for
hackathon eligibility):**
- Confirm the listing shows as **live/approved** on
  [okx.ai/agents](https://www.okx.ai/agents) — this is the hard eligibility
  gate, not the on-chain tx.
- Post the X demo with `#OKXAI`.
- Submit the Google form linked from the [HackQuest page](https://hackquest.io/en/hackathons/OKXAI-Genesis-Hackathon)'s Step 4 / "Start Register" button.

## 6. What I cannot do for you

- **Wallet confirmation for `onchainos agent create`** — this is a real
  on-chain write from your address; you must run it in a session with your
  wallet connected and approve the prompt yourself.
- **The Google form + X post** — both need your accounts/identity.
- **Confirming the listing goes live** — that's OKX's internal review, not
  something the CLI or this repo controls.
- I did **not** run any `onchainos` commands or touch your wallet this
  session; I also did not commit or push anything.
