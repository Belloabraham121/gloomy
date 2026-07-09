# packages/a2ui-spec

Shared source of truth for the A2UI component catalog's prop schemas (Zod).
Imported by:

- `apps/web` — to build the OpenUI component library (`defineComponent`).
- `apps/api` — to generate matching Claude tool definitions.

This keeps the "what the UI can render" contract and the "what the model can
ask for" contract from drifting apart.

**Not scaffolded yet.** See `../../docs/a2ui-components.md` for the current
draft prop contracts (Diagram, StepThrough, Quiz) that will become the first
schemas here in build order step 2.
