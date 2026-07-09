# Architecture

## Request flow (2D / OpenUI path)

1. User asks a question in `apps/web`.
2. `apps/web` sends the conversation to `apps/api`'s chat endpoint.
3. `apps/api` runs a Claude tool-use loop. The available tools are generated
   from `packages/a2ui-spec` — one tool per A2UI component (`Diagram`,
   `StepThrough`, `Quiz`, ...). Claude picks a component and fills its props.
4. (Post step 4 of the build order) Before or during that loop, `apps/api`
   retrieves grounding context from the RAG layer and injects it into the
   prompt/tool results, so components are populated from real sources rather
   than the model's parametric knowledge.
5. `apps/api` streams the result back to `apps/web`.
6. `apps/web`'s OpenUI `Renderer` parses the stream and renders the matching
   component from the shared library.

## Request flow (3D / CopilotKit path)

Same steps 1–4, but the request originates from (or is routed to)
`apps/web-3d`, and the response is rendered via CopilotKit's generative UI
instead of OpenUI's `Renderer`. `apps/api` is shared — it doesn't know or
care which frontend asked, only which tools/components are valid for the
request.

## Why two frontends instead of one

OpenUI's component contract (Zod props → deterministic React render) is a
good fit for structured, mostly-2D teaching content but isn't built for
free-form 3D/simulated scenes. Rather than stretch one framework to cover
both, 3D-shaped answers get routed to a CopilotKit surface instead. The
backend, tool definitions, RAG layer, and caching are shared between both —
only the rendering surface differs.

## Anthropic ↔ OpenUI transport gap

OpenUI ships stream adapters for OpenAI-compatible APIs, LangGraph, and the
AG-UI protocol — not Anthropic. `apps/api` needs to either:

- expose an OpenAI-compatible streaming shape at its chat endpoint (translate
  Claude's stream into that shape before it leaves the backend), or
- implement a custom `streamProtocol`/`ChatLLM` adapter on the `apps/web`
  side that understands Claude's native event format.

Prefer the first option — it keeps `apps/web` a thin OpenUI consumer and
keeps all Claude-specific logic in one place (`apps/api`). Revisit if that
turns out to lose fidelity we need (e.g. tool-use event granularity).

## Caching and progress tracking (build order step 6)

Not designed yet. Candidates once we get there: cache generated component
payloads keyed on (question, source-set-version) to avoid re-hitting Claude
for repeat questions; progress tracking keyed on a user/session id, stored
alongside cache in `apps/api`.
