# OpenUI migration

gloomy's generative UI transport was migrated from a single forced tool-call
(`{ component, props }`, one of 6 fixed components) to real **OpenUI Lang**:
the model now writes a whole declarative program that composes layout,
data (charts/tables), markdown, and gloomy's own teaching components
together, rendered through OpenUI's own `<Renderer>`. This doc is the
reference for what changed, why, and how to extend the library further.
`docs/architecture.md`'s "Anthropic ↔ OpenUI transport gap" section
predates this migration and is now historical — this doc supersedes it for
the transport layer.

## Why now

The prior doc flagged the blocker as "no live Claude API access to validate
hand-authored Lang prompts against a real model." That's no longer true (both
`ANTHROPIC_API_KEY`/`OPENAI_API_KEY` are exercisable), and OpenUI's own
`Library.prompt()` generates the syntax/component-signature portion of the
system prompt directly from the component schemas — so there's no
hand-authored Lang grammar to get subtly wrong. The remaining risk (the model
emitting Lang referencing an unknown component, or malformed syntax) is
handled by parsing+validating server-side before ever caching or returning a
response (see "Server-side validation" below).

## What changed, by area

### `packages/a2ui-spec` (shared contract)

- **`math.ts`** (new) — the `Math` component's Zod schema (`latex: string`,
  `display?: boolean`). This is the one genuinely new component: real LaTeX
  via KaTeX, which had no pre-OpenUI equivalent (the old contract had nowhere
  to put a standalone formula outside `FormulaStepper`'s term-by-term reveal).
- **`openui-components.ts`** (new) — `customComponentSpecs`: the single
  source of truth (name + Zod schema + description) for gloomy's 6 custom
  OpenUI Lang components (`Diagram`, `StepThrough`, `Quiz`, `Simulation`,
  `FormulaStepper`, `Math`). Both `apps/web` (real React renderers) and the
  generated prompt (see below) are built from this exact list, so they can
  never drift.
- **`lang-summary.ts`** (new) — `summarizeLangComponents(lang)`: a
  regex-based (not a real parser — deliberately, this is only ever used for
  human-readable breadcrumbs) extraction of the distinct component names
  used in a Lang program, e.g. `"Stack, Chart, Table"`. Used for
  conversation-history notes (`apps/web`) and progress-tracking rows
  (`apps/api`).
- **`payload-link.ts`** — versioned payload: `encodeLang`/`decodePayload`
  now produce/accept `{ v: 2, lang: string }` (an OpenUI Lang program) as the
  current contract, alongside the legacy `{ component, props }` shape (no
  `v` field) for backward compatibility. `isLangDeliverable()` discriminates
  the two. Old cached rows and old `/d?p=…` links (e.g. already-delivered
  OKX marketplace tasks) keep decoding and rendering exactly as before —
  nothing that predates this migration breaks.
- **`chart.ts`** — kept, unchanged, purely for legacy decode/render (see
  "Chart retirement" below). Not part of `customComponentSpecs`.

### `apps/web` (frontend)

- **`lib/a2ui-library.tsx`** (renamed from `.ts`, now has JSX) — the
  extended OpenUI library: `createLibrary({ components: [...builtins,
  ...custom] })`, merging every OpenUI built-in (`Stack`, `Tabs`,
  `Accordion`, `Card`, `Charts`, `Table`, `MarkDownRenderer`, forms, ...)
  from `@openuidev/react-ui/genui-lib` with gloomy's 6 custom components,
  each registered via `defineComponent` with a real JSX-rendering
  `component` function (calling a React component as a plain function
  instead of via JSX would silently break its hooks — this bit us once
  during the migration and is worth flagging for anyone adding a 7th
  component).
- **`lib/openui-prompt-options.ts`** (new) — `gloomyPromptOptions`:
  gloomy's `PromptOptions` (preamble + additional rules + examples) layered
  on top of OpenUI's own base rules, instructing the model to compose a
  *rich, multi-block* answer (layout + prose + the component(s) that
  actually answer the question) rather than one bare component, and
  documenting gloomy's 6 custom components (since the model can't infer
  their prop shapes from generic OpenUI conventions).
- **`components/a2ui/Math.tsx`** (new) — KaTeX (`katex` + `react-katex`)
  renderer; catches KaTeX's `throwOnError` and falls back to a `<code>`
  block with the raw LaTeX so one malformed expression never crashes the
  render.
- **`components/A2uiRenderer.tsx`** — the shared render surface for both
  `/chat` and `/d`:
  - `A2uiLangView({ lang, isStreaming })` renders a raw Lang string via
    OpenUI's `<Renderer library={a2uiLibrary} .../>` — used directly by
    `/chat` for its own fresh responses (never legacy).
  - `A2uiRenderer({ deliverable })` takes the union type from
    `decodePayload` and dispatches: a Lang payload goes to
    `A2uiLangView`; a legacy `{component, props}` payload renders straight
    from the old `a2uiComponents` map, bypassing OpenUI's parser entirely
    (there's nothing to parse — it's already validated by
    `decodeLegacyPayload`'s Zod check).
  - Both paths are wrapped in a class-based `RenderBoundary` (an actual
    React error boundary — hooks can't do
    `getDerivedStateFromError`) so one bad response degrades to a message
    instead of taking down the whole page.
  - **SSR gotcha, and the actual fix applied**: OpenUI's built-in Charts
    (recharts under the hood — specifically their tooltip portal) touch
    `document` unconditionally on render. Every page that renders OpenUI
    content (`/chat`, `/d`, `/gallery`) is already a Client Component, so
    there's no SEO/first-paint benefit to server-rendering it anyway — both
    `A2uiRenderer` and `A2uiLangView` gate their real output behind a
    `useMounted()` check and render a `Loading…` placeholder until after
    mount. Without this, Next 15 *does* recover automatically ("Switched to
    client rendering because the server rendering errored") — but that's a
    real SSR error thrown and logged on every request, not something to
    rely on deliberately.
  - **Streaming**: `A2uiLangView` accepts `isStreaming`, threaded straight
    to OpenUI's `<Renderer>` (which is what gates its own internal partial-
    parse safety, e.g. not rendering a chart series until its data array is
    fully closed). `apps/api` currently returns one full non-streaming JSON
    response (see "Non-streaming, still" below), so `isStreaming` is always
    `false` in practice today — wiring is in place for a future SSE/stream
    transport without needing to touch the Renderer integration again.
- **`app/layout.tsx` + `components/OpenUiThemeProvider.tsx`** (new) — OpenUI
  needs a `<ThemeProvider>` for its components' CSS variables. The package's
  root barrel (`@openuidev/react-ui`) is `"use client"` + `export *`, which
  Next's RSC flight loader can't statically analyze from a Server Component
  like the root layout; importing the `ThemeProvider` subpath instead skips
  that barrel but *also* skips its `"use client"` directive (the subpath
  build has none — `createContext`/`useContext` then blow up in the
  RSC/server environment: `"createContext is not a function"`).
  `OpenUiThemeProvider.tsx` is a two-line `"use client"` re-export that
  makes *itself* the actual RSC boundary, so the root layout (a Server
  Component) can safely render it.
- **`app/chat/page.tsx`, `app/d/page.tsx`** — render `A2uiLangView`/
  `A2uiRenderer` instead of dispatching `component`/`props` to a fixed map
  directly.
- **`app/gallery/page.tsx`** — kept the 6 custom components' direct-fixture
  rendering (still useful as a component catalog independent of any Lang
  parsing) and added a 7th item, `Math`, plus a new section rendering a
  hand-written OpenUI Lang program through the real `Renderer` — a
  `GalleryLangDemo` client wrapper (`next/dynamic(..., { ssr: false })`)
  keeps that demo out of the page's own SSR pass, same rationale as the
  `useMounted()` gate above (belt-and-suspenders; either alone is
  sufficient, `/chat` and `/d` only rely on the `useMounted()` gate).
- **`lib/chat-history.ts`** — `describeAssistantTurn` now calls
  `summarizeLangComponents(response.lang)` instead of reading a single
  `component` field, so history notes look like `[assistant generated
  Stack, Chart, Table]` instead of `[assistant generated a Chart]`.
- **`lib/api.ts`** — `ChatResponse` now carries `lang: string` +
  `viewUrl: string` instead of `component`/`props`.

### `apps/api` (backend)

- **Why generate, not import `react-ui` on the server.** `Library.prompt()`
  needs the actual component library object, but `@openuidev/react-ui`
  drags React, `recharts`, and Radix into what is otherwise a plain Express
  server that never renders anything. Instead, `apps/web`'s build owns the
  one canonical library (it already depends on `react-ui` to render), and a
  script serializes what `apps/api` needs into a committed file:
  - **`apps/web/scripts/generate-openui-contract.ts`** (new) — imports the
    real `a2uiLibrary` + `gloomyPromptOptions`, calls
    `library.prompt(gloomyPromptOptions)` and `library.toJSONSchema()`, and
    writes `apps/api/src/llm/generated/openui-contract.ts` (the system
    prompt string, the JSON Schema, the sorted component name list, the
    root component name). Run via `pnpm --filter @gloomy/web
    generate:openui-contract` whenever the library/prompt options change,
    and commit the regenerated file — there's no build-time codegen step in
    `apps/api`'s own build, it's a plain committed `.ts` file like any
    other source.
  - **`apps/api/src/llm/shared.ts`** — `validateLang(rawText)`: strips a
    stray ```` ```openui-lang ``` ```` fence if the model added one despite
    instructions not to, then parses the text with `@openuidev/lang-core`'s
    `createParser(OPENUI_LIBRARY_SCHEMA)` (built from the generated JSON
    Schema — no React/`react-ui` dependency in `apps/api` at all). Throws
    `LangGenerationError` (replacing the old `ToolUseError`) on the two
    failure modes that actually matter: no resolvable `root` statement, or
    a reference to a component name outside the library. Everything else
    (a dropped unreachable statement, a missing optional prop) is left to
    the parser's own documented permissive behavior rather than forcing a
    retry over something cosmetic.
- **`apps/api/src/llm/anthropic.ts` / `openai.ts`** —
  `runAnthropicLangTurn`/`runOpenAILangTurn` (replacing
  `runAnthropicToolUseTurn`/`runOpenAIToolUseTurn`): a plain chat completion
  with `SYSTEM_PROMPT` = the generated OpenUI system prompt (no
  `tool_choice`/function-calling — there's no tool call anymore, the whole
  response *is* the answer), `validateLang()` on the result, one retry with
  the validation error fed back as a follow-up message if the first attempt
  didn't validate.
- **`apps/api/src/llm/index.ts`** — `LlmProvider.runLangTurn(messages,
  groundingContext?) => Promise<string>` (replacing `runToolUseTurn(...) =>
  Promise<A2uiPayload>`). Provider selection (`getLlmProvider`,
  `LLM_PROVIDER` env override, missing-key errors) is unchanged.
- **`apps/api/src/llm/tools.ts`, `test-fixtures.ts`** — deleted (no tool
  specs to generate anymore; fixtures were only used by the tests that got
  rewritten for the new contract).
- **Caching / grounding / history — kept, adjusted for the new value type:**
  - `db/schema.ts`: `cache_entries.lang: text` replaces
    `component: text` + `props: jsonb`. `progress_entries.component: text`
    is renamed to `components: text` (a short comma-joined summary now,
    since a response is a whole program, not one component name) — see the
    accompanying Drizzle migration
    (`apps/api/src/db/migrations/0002_openui_lang.sql`). `cache_entries` is
    a fully-regenerable response cache, never user data, so the migration
    `TRUNCATE`s it rather than attempting a lossy `{component,props} → lang`
    backfill — old cache rows are simply gone after this deploy, and the
    next matching question just becomes a normal miss.
  - `cache/cache.ts`: `getCachedResponse` returns `string | null` (the Lang
    text); `setCachedResponse(question, lang, documentId?)`.
  - `progress/progress.ts`: `RecordProgressInput.components: string`.
  - PDF/CSV grounding (`rag/*`) is completely untouched — it only ever
    appended a text block to the system prompt, which is still exactly what
    happens, just with the generated OpenUI prompt as the base instead of
    the old static one.
  - Conversation history (`chat.ts`'s message thread cap, `apps/web`'s
    `buildThreadMessages`) is untouched at the transport level; only the
    per-turn *summary* shown to the model changed (see
    `summarizeLangComponents` above).
- **`routes/chat.ts`** — new response contract (see below); cache
  hit/miss, grounding, and progress-recording call sites now pass/return
  `lang` instead of `component`/`props`. `buildViewUrl(lang)` wraps
  `encodeLang` into a `/d?p=…` URL (absolute if `PUBLIC_WEB_URL` is set,
  relative otherwise, exactly like before).
- **`routes/agent-task.ts`** — `buildDeliverable(lang, webUrl)` builds
  `viewUrl` via `encodeLang` and `deliverMessage` via
  `summarizeLangComponents(lang)` (`"...generated an interactive UI (Stack,
  Diagram, Quiz) answering the request..."` instead of naming one
  component). Response contract updated to match `/api/chat`'s.
- **`routes/agent.ts`** — `/.well-known/agent.json`'s `capabilities` list is
  now every component in the generated library (OpenUI built-ins +
  gloomy's custom ones), each carrying its description where one exists
  (gloomy's custom components); added `uiTransport: "openui-lang"` and
  rewrote the `chat`/`task` endpoint descriptions to reflect
  `{ lang, viewUrl }`.

### Chart retirement

The old hand-rolled `Chart` component (plain SVG, no charting library) is
**not** part of `customComponentSpecs` / the model-facing library anymore —
OpenUI's own `BarChart`/`LineChart`/`AreaChart`/`PieChart`/`RadarChart`/
`ScatterChart` are richer, better-styled, and the prompt explicitly tells
the model to prefer them for quantitative data. `Chart`'s schema
(`chart.ts`) and React component (`components/a2ui/Chart.tsx`) are both
**kept**, purely so a `{component: "Chart", ...}` payload minted before
this migration (an old cached row, or an old delivered `/d?p=…` link) still
decodes and renders via the legacy path in `A2uiRenderer`/
`a2uiComponents`. It's also still shown in `/gallery` (relabeled "legacy,
kept for old cached/deliverable links").

## The new response contracts

**`POST /api/chat`** — request unchanged (`{ threadId?, sessionId?,
documentId?, messages }`); response:

```ts
{
  threadId: string;
  sessionId?: string;
  cached: boolean;
  provider?: "anthropic" | "openai"; // absent on a cache hit
  lang: string;      // an OpenUI Lang program
  viewUrl: string;   // /d?p=<encodeLang(lang)>, absolute if PUBLIC_WEB_URL is set
}
```

`viewUrl` matters for **non-web callers** (an OKX A2MCP consumer hitting
`/api/chat` directly has no OpenUI `<Renderer>` of its own) — they get a
ready-to-open renderable link alongside the raw Lang text.

**`POST /api/agent/task`** (marketplace fulfillment) — request unchanged
(`{ task, jobId?, documentId? }`); response:

```ts
{
  jobId?: string;
  cached: boolean;
  provider?: string;
  lang: string;
  viewUrl: string;
  deliverMessage: string; // ready for `onchainos agent deliver --message`
  note?: string;          // present only if PUBLIC_WEB_URL isn't set
}
```

Both are additive/renamed relative to the pre-migration `{ component,
props, viewUrl, deliverMessage }` shape — no field was removed except
`component`/`props` themselves, which are exactly what `lang` replaces.

## Server-side validation (never trust the model)

Whatever either provider returns is parsed with `@openuidev/lang-core`'s
`createParser` against the generated library schema before it's ever cached
or returned — never rendered/trusted purely because the API call succeeded.
Two failure modes trigger a retry (one, with the parser's error message fed
back as a follow-up message) and then a `502` if the retry also fails:

1. No resolvable `root` statement (empty response, or a response that isn't
   openui-lang at all).
2. A reference to a component name outside the generated library.

Anything else the parser flags (a dropped unreachable statement, a missing
optional prop that gets defaulted) is left alone, matching the parser's own
documented "errors don't affect rendering" permissiveness — forcing a retry
over something cosmetic would just burn tokens without improving the
answer.

## Non-streaming, still

`apps/api` returns one complete JSON response per turn, same as before this
migration — Lang generation didn't add real token-by-token streaming.
`isStreaming` is threaded through `A2uiLangView`/OpenUI's `<Renderer>` and
is always `false` in the current wiring; adding a real SSE transport later
is additive (the Renderer integration doesn't change, only how `lang` gets
assembled server-side before/while it's sent).

## Testing

- `apps/api/src/llm/anthropic.test.ts` / `openai.test.ts` — mocked clients:
  valid Lang on the first response, a stray code fence stripped, an
  unknown-component reference rejected, retry-then-succeed, retry-then-fail
  (empty response both times).
- `apps/api/src/payload-link.test.ts` — the pre-existing legacy
  `{component,props}` round-trip/tamper/garbage tests are untouched (still
  exercise `encodePayload`/`decodePayload`'s legacy path), plus new tests
  for `encodeLang`/`isLangDeliverable`: Lang round-trip (incl. non-ASCII),
  URL-safety, empty-`lang` rejection, and that a legacy and a v2 payload are
  distinguishable via `isLangDeliverable`. Also covers `mathSchema`
  accept/reject.
- `apps/api/src/routes/agent-task.test.ts` — `buildDeliverable` (viewUrl
  shape with/without `PUBLIC_WEB_URL`, `deliverMessage` content, and a full
  decode round-trip back to the original Lang) + `isAuthorized`.
- `apps/api/src/db/db.test.ts` — cache get/set/upsert and per-document
  scoping now assert against `lang` strings; `recordProgress` tests assert
  `components` instead of `component`.

## Extending the library

To add an 8th custom component:

1. Add its Zod schema to `packages/a2ui-spec/src/<name>.ts`, export it from
   `index.ts`.
2. Add `{ name, schema, description }` to `customComponentSpecs` in
   `openui-components.ts`.
3. Add its real React implementation under `apps/web/src/components/a2ui/`,
   and register it in `apps/web/src/lib/a2ui-library.tsx` via
   `defineComponent({ ..., component: ({ props }) => <YourComponent
   {...props} /> })` — **use JSX here**, not a plain function call, or the
   component's hooks silently break once OpenUI's `<Renderer>` actually
   mounts it.
4. Document its prop shape + any nesting rules for the model in
   `apps/web/src/lib/openui-prompt-options.ts`'s `additionalRules`.
5. Run `pnpm --filter @gloomy/web generate:openui-contract` and commit the
   regenerated `apps/api/src/llm/generated/openui-contract.ts`.
6. Update `docs/a2ui-components.md` and this doc's component list.

## Left partial / known follow-ups

- **`onAction`'s `continue_conversation`** (OpenUI's `Buttons`/`FollowUp`
  action type) is not wired to auto-resubmit a new question into the chat
  thread yet — only `open_url` is handled (`window.open`). Low risk: no
  current prompt guidance tells the model to emit buttons that rely on it,
  so it's dormant rather than broken.
- **No real token streaming** — see "Non-streaming, still" above.
- **`apps/web-3d`/CopilotKit surface** is untouched by this migration; it
  never used the A2UI/OpenUI Lang contract at all (see
  `docs/architecture.md`'s "Why two frontends instead of one").
