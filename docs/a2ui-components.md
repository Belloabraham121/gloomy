# A2UI component spec

**Implemented.** These are gloomy's **custom** OpenUI Lang components — real
Zod schemas in `packages/a2ui-spec` (`openui-components.ts`'s
`customComponentSpecs` is the single source of truth for name + schema +
description; see that package for the exact source), consumed by:

- `apps/web`'s extended OpenUI library (`lib/a2ui-library.tsx`, via
  `defineComponent`) and its React implementations in `components/a2ui/`.
- `apps/api`'s generated system prompt
  (`apps/api/src/llm/generated/openui-contract.ts`, produced from the same
  library — see `docs/openui-migration.md`) and its `@openuidev/lang-core`
  validation of whatever OpenUI Lang the model returns.

These are only 6 of the components the model can actually use — it composes
them alongside OpenUI's own built-ins (`Stack`, `Card`, `Tabs`, `Accordion`,
`Table`, `MarkDownRenderer`, `BarChart`/`LineChart`/`AreaChart`/…) in one
Lang program; see `docs/openui-migration.md` for the full transport. The
shapes below match the real schemas; treat this file as documentation of
gloomy's custom components' contract, not a draft to diverge from — if you
change a schema, update this file in the same change.

## Diagram

Labeled nodes/edges for explaining structure or relationships. Renders as
an SVG grid layout (single row up to 4 nodes, wraps beyond that) with
straight edges; long edge labels are truncated (18 chars) and stacked
labels between the same node pair are offset to avoid collisions — see
`apps/web/src/components/a2ui/Diagram.tsx` and `lib/diagram-layout.ts`.

```ts
{
  title: string;
  nodes: Array<{
    id: string;
    label: string;
    description?: string;
  }>;
  edges: Array<{
    from: string; // node id
    to: string;   // node id
    label?: string;
  }>;
}
```

## StepThrough

An ordered sequence of steps/states, revealed one at a time via Back/Next
buttons (not all at once).

```ts
{
  title: string;
  steps: Array<{
    heading: string;
    body: string;          // short explanation for this step
    highlight?: string;    // optional callout, e.g. "common mistake"
  }>;
}
```

## Quiz

A question with choices; clicking a choice locks it in immediately and
shows correct/incorrect feedback plus the explanation (no changing your
answer after selecting).

```ts
{
  question: string;
  choices: Array<{
    id: string;
    label: string;
  }>;
  correctChoiceId: string;
  explanation: string; // shown after the user answers, right or wrong
}
```

## Simulation

A parameterized model with sliders; `formula` is evaluated live against
the current slider values using a restricted arithmetic expression
evaluator (`apps/web/src/lib/safe-math.ts`) — deliberately not
`eval`/`Function`, since `formula` originates from an LLM and should never
reach a real JS evaluator.

```ts
{
  title: string;
  description: string;
  parameters: Array<{
    id: string;
    label: string;
    min: number;
    max: number;
    step: number;
    defaultValue: number;
  }>;
  formula: string; // arithmetic expression over parameter ids, e.g. "3.14159 * r ^ 2"
}
```

## Chart (retired — legacy decode/render only, not model-facing)

Quantitative data over a category/time axis, rendered as plain SVG
(line or bar) — no charting library dependency.

**Retired in the OpenUI migration** (see `docs/openui-migration.md`): the
model is no longer offered this component and cannot generate it — OpenUI's
own `BarChart`/`LineChart`/`AreaChart`/`PieChart`/`RadarChart`/`ScatterChart`
are richer and the system prompt tells the model to prefer them for
quantitative data. The schema and React component are kept **only** so a
`{component: "Chart", ...}` payload minted before this migration (an old
cached row, or an old delivered `/d?p=…` link) still decodes and renders —
see the legacy path in `apps/web/src/components/A2uiRenderer.tsx`. Not part
of `packages/a2ui-spec`'s `customComponentSpecs`.

```ts
{
  title: string;
  kind: "line" | "bar";
  xLabel: string;
  yLabel: string;
  series: Array<{
    name: string;
    points: Array<{ x: string | number; y: number }>;
  }>;
}
```

## FormulaStepper

A formula or derivation revealed term by term via Back/Next, same
navigation pattern as StepThrough. `expression` is plain text/LaTeX-ish
notation, not real LaTeX — for a single static formula, prefer `Math`
below.

```ts
{
  title: string;
  terms: Array<{
    expression: string;
    note?: string;
  }>;
}
```

## Math

**New in the OpenUI migration** (see `docs/openui-migration.md`) — real
LaTeX, rendered with KaTeX (`apps/web/src/components/a2ui/Math.tsx`, via
`katex` + `react-katex`). No pre-OpenUI equivalent existed: the old
single-component contract had nowhere to put a standalone formula outside
`FormulaStepper`'s term-by-term reveal. Malformed LaTeX (`katex.
renderToString(latex, { throwOnError: true })` throws) falls back to a
plain `<code>` block with the raw string, so one bad expression never
crashes the render.

```ts
{
  latex: string;      // e.g. "\\frac{a}{b}" or "E = mc^2" — no surrounding $ or \[ \]
  display?: boolean;  // true = centered block equation; false/omitted = inline
}
```

Not part of Card/Tabs/Accordion's fixed child-type union — the model is
instructed to always nest it inside a `Stack`.
