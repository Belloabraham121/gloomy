# apps/web

The main 2D generative UI surface: Next.js (App Router) + [OpenUI](https://www.openui.com/)
(`@openuidev/react-lang`, `@openuidev/react-ui`).

## Current state (build order steps 1, 2, 3)

- **`/`** — the real chat page. Ask a question (or click a suggestion),
  it POSTs to `apps/api`'s `/api/chat`, and renders whatever component
  Claude's tool-use picked via `A2uiRenderer`. Shows a clear message if
  `apps/api` hasn't got `ANTHROPIC_API_KEY` configured (501) instead of a
  generic error. Session id is kept in `localStorage` (see `lib/session.ts`)
  so `apps/api` can group progress rows without any real auth.
- **`/gallery`** — all 6 A2UI components rendered from hardcoded fixture
  data (`src/fixtures/sample-a2ui.ts`), no backend involved. Useful as a
  design/dev reference independent of whether `apps/api` is running.
- **`src/lib/a2ui-library.ts`** — pairs each `packages/a2ui-spec` schema
  with its React component two ways: as an OpenUI `defineComponent`/
  `createLibrary` (for future OpenUI Lang rendering) and as a plain
  `component-name -> React component` map (`a2uiComponents`), which is what
  both `/` and `/gallery` actually render through today. See
  `../../docs/architecture.md` for why direct JSON rendering is used
  instead of OpenUI's Lang parser for now.

## Run it

```bash
cp .env.local.example .env.local   # points at apps/api, defaults to :4000
pnpm install
pnpm dev                            # http://localhost:3000
```

Needs `apps/api` running (`pnpm dev` there) — see its README for how to
get a cache hit working without an `ANTHROPIC_API_KEY` at all, useful for
testing the frontend independent of Claude.

## Layout

```
apps/web/
├── src/
│   ├── app/
│   │   ├── page.tsx           # real chat page
│   │   └── gallery/page.tsx   # hardcoded fixture showcase
│   ├── components/
│   │   ├── a2ui/               # Diagram, StepThrough, Quiz, Simulation, Chart, FormulaStepper
│   │   └── A2uiRenderer.tsx    # dispatches a { component, props } payload to the right one
│   ├── lib/
│   │   ├── a2ui-library.ts      # OpenUI defineComponent/createLibrary + the direct-render map
│   │   ├── api.ts                # askQuestion() -> apps/api's /api/chat
│   │   ├── session.ts            # localStorage session id
│   │   ├── diagram-layout.ts     # grid layout math for Diagram
│   │   └── safe-math.ts          # restricted arithmetic evaluator for Simulation (no eval/Function)
│   └── fixtures/
│       └── sample-a2ui.ts        # hardcoded data for /gallery
```
