# apps/web

The main 2D generative UI surface: Next.js + [OpenUI](https://www.openui.com/).

**Not scaffolded yet.** This is build order step 1. Plan:

```bash
npx @openuidev/cli@latest create --name web --no-interactive
```

Then:

- Define the A2UI component library (`Diagram`, `StepThrough`, `Quiz`) using
  `defineComponent` + the Zod schemas from `packages/a2ui-spec`. See
  `../../docs/a2ui-components.md`.
- Implement `/api/chat` to forward to `apps/api`'s chat endpoint (see
  `../../docs/architecture.md` for the Anthropic↔OpenUI transport note).
- Wire `AgentInterface` or `Renderer` (start with `Renderer` — we own the
  chat shell rather than using OpenUI's full app shell, since this is a
  teaching UI, not a generic chat product).
