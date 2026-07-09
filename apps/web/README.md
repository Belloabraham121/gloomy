# apps/web

The main 2D generative UI surface: Next.js (App Router) + [OpenUI](https://www.openui.com/)
(`@openuidev/react-lang`, `@openuidev/react-ui`).

## Current state (build order step 1)

Minimal skeleton, no A2UI components or Claude wiring yet:

- `src/app/page.tsx` — calls `apps/api`'s `/api/chat` stub on load and
  displays whether the round trip succeeded. This is the "confirm they talk
  to each other" check from the build order, not a real chat UI.
- OpenUI packages are installed as dependencies so step 2 (building the
  Diagram/StepThrough/Quiz component library with `defineComponent`) can
  start immediately, but nothing uses them yet.

## Run it

```bash
cp .env.local.example .env.local   # points at apps/api, defaults to :4000
pnpm install                        # from repo root or here
pnpm dev                            # starts on http://localhost:3000
```

Requires `apps/api` running (`pnpm dev` there) for the page to show
"Connected" instead of an error.

## Next steps

- Step 2: define the A2UI component library (`Diagram`, `StepThrough`,
  `Quiz`) using `defineComponent` + the Zod schemas from
  `packages/a2ui-spec` (see `../../docs/a2ui-components.md`), render them
  with hardcoded data via OpenUI's `Renderer` — no LLM involved yet.
- Step 3: replace the `/api/chat` stub call with real streaming from
  `apps/api`'s Claude tool-use loop.
