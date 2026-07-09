# A2UI component spec

**Implemented.** All 6 prop contracts below are real Zod schemas in
`packages/a2ui-spec` (see that package for the exact source), consumed by:

- `apps/web`'s OpenUI library (`lib/a2ui-library.ts`, via `defineComponent`)
  and its React implementations in `components/a2ui/`.
- `apps/api`'s Claude tool definitions (`claude/tools.ts`, one tool per
  component, JSON Schema generated from the same Zod schema via
  `z.toJSONSchema`).

The shapes below match the real schemas; treat this file as documentation
of the contract, not a draft to diverge from — if you change a schema,
update this file in the same change.

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

## Chart

Quantitative data over a category/time axis, rendered as plain SVG
(line or bar) — no charting library dependency.

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
navigation pattern as StepThrough.

```ts
{
  title: string;
  terms: Array<{
    expression: string;
    note?: string;
  }>;
}
```
