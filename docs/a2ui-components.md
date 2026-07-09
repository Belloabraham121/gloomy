# A2UI component spec

Draft prop contracts for the first 3 components (build order step 2). These
will become Zod schemas in `packages/a2ui-spec`, consumed by:

- `apps/web`'s OpenUI library via `defineComponent({ props: <schema>, ... })`
- `apps/api`'s Claude tool definitions (one tool per component, generated
  from the same schema)

Treat everything below as a first draft to validate against real hardcoded
data in step 2, not a frozen contract.

## Diagram

Labeled nodes/edges for explaining structure or relationships.

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

An ordered sequence of steps/states, one revealed at a time.

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

A question with choices and immediate feedback.

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

## Second wave (build order step 5, not started)

- **Simulation** — parameterized, interactive model the user can perturb.
- **Chart** — quantitative data over time/category.
- **FormulaStepper** — a formula/derivation revealed term by term.

Prop contracts TBD once the first 3 are validated end-to-end.
