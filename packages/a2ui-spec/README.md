# packages/a2ui-spec

Shared source of truth for the A2UI component catalog's prop schemas (Zod
v4, via the `zod/v4` subpath — see below). All 6 components are defined:
`Diagram`, `StepThrough`, `Quiz`, `Simulation`, `Chart`, `FormulaStepper`.
Imported by:

- `apps/web` — to build the OpenUI component library (`defineComponent`)
  and the direct-render component map.
- `apps/api` — to generate matching Claude tool definitions
  (`z.toJSONSchema`) and to validate whatever Claude actually returns.

This keeps the "what the UI can render" contract and the "what the model can
ask for" contract from drifting apart — both sides import the exact same
schema object.

## Why this package has a real build step

`apps/web` (Next.js/webpack) and `apps/api` (real Node ESM in production,
`tsx`/esbuild in dev) resolve relative imports differently enough that
shipping raw, unbuilt `.ts` source caused real breakage in both directions
depending on which extension convention was used internally — see
`docs/architecture.md` for the specifics. The fix: this package actually
compiles (`tsc`, NodeNext) to `dist/`, and `package.json`'s `main`/`types`
point there. Both consumers then just resolve ordinary compiled JS through
normal `node_modules` resolution — no bundler-specific special-casing
needed on either side.

`pnpm install` runs the build automatically via this package's `prepare`
script, so in normal use you don't need to think about it. If you change a
schema and don't see it reflected elsewhere, run `pnpm --filter
@gloomy/a2ui-spec build` (or just `pnpm install` again) to rebuild `dist/`.

## Why `zod/v4` specifically

OpenUI's `defineComponent` requires Zod v4 schemas (`$ZodObject` from
`zod/v4/core`), not the default `zod` v3 export — even though the installed
`zod` package version is technically 3.25.x, it ships a `zod/v4` subpath
that's what OpenUI (and this package) actually imports from.
