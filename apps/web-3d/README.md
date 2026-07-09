# apps/web-3d

The 3D / simulation generative UI surface, using Copilot generative UI
([CopilotKit](https://www.copilotkit.ai/)).

**Not scaffolded yet.** Only build this out once the OpenUI path
(`apps/web`) is validated for a component that genuinely needs 3D/simulated
interaction — don't duplicate effort here speculatively (build order step 5
territory, not step 1).

Plan when we get there:

- Scaffold with CopilotKit's Next.js quickstart.
- Share `apps/api` as the backend — same chat/tool-use endpoint, different
  rendering surface.
- Only components that actually need 3D live here; everything else stays in
  `apps/web`.
