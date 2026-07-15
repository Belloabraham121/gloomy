import type {
  ChartProps,
  DiagramProps,
  FormulaStepperProps,
  ImageUploadProps,
  MathProps,
  QuizProps,
  SimulationProps,
  StepThroughProps,
} from "@gloomy/a2ui-spec";

export const sampleDiagram: DiagramProps = {
  title: "How a request flows through gloomy",
  nodes: [
    { id: "web", label: "apps/web", description: "Next.js + OpenUI" },
    { id: "api", label: "apps/api", description: "Claude tool-use" },
    { id: "claude", label: "Claude", description: "Picks a component" },
    { id: "db", label: "Postgres", description: "Cache + progress" },
  ],
  edges: [
    { from: "web", to: "api", label: "question" },
    { from: "api", to: "claude", label: "tool-use" },
    { from: "claude", to: "api", label: "component + props" },
    { from: "api", to: "db", label: "cache result" },
    { from: "api", to: "web", label: "render payload" },
  ],
};

export const sampleStepThrough: StepThroughProps = {
  title: "How OpenUI renders a component",
  steps: [
    {
      heading: "1. Define the schema",
      body: "Each A2UI component gets a Zod schema in packages/a2ui-spec describing its exact props.",
    },
    {
      heading: "2. Register the component",
      body: "apps/web pairs each schema with real React via defineComponent(), forming a library.",
    },
    {
      heading: "3. The model picks one",
      body: "Claude tool-use in apps/api selects a component and fills its props for a given question.",
      highlight: "The model can never invent a component outside this catalog.",
    },
    {
      heading: "4. Render",
      body: "apps/web renders the chosen component with the returned props.",
    },
  ],
};

export const sampleQuiz: QuizProps = {
  question: "Which package holds the shared prop schemas for A2UI components?",
  choices: [
    { id: "a", label: "apps/web" },
    { id: "b", label: "apps/api" },
    { id: "c", label: "packages/a2ui-spec" },
  ],
  correctChoiceId: "c",
  explanation:
    "packages/a2ui-spec is the single source of truth — both the OpenUI component library and Claude's tool definitions import from it.",
};

export const sampleSimulation: SimulationProps = {
  title: "Circle area",
  description: "Drag the radius to see how the area of a circle changes.",
  parameters: [
    { id: "r", label: "Radius", min: 1, max: 20, step: 1, defaultValue: 5 },
  ],
  formula: "3.14159 * r ^ 2",
};

export const sampleChart: ChartProps = {
  title: "Claude API calls per build order step (projected)",
  kind: "bar",
  xLabel: "Step",
  yLabel: "Calls",
  series: [
    {
      name: "Estimated",
      points: [
        { x: "2", y: 0 },
        { x: "3", y: 10 },
        { x: "4", y: 25 },
        { x: "5", y: 15 },
      ],
    },
  ],
};

export const sampleMath: MathProps = {
  latex: "A = \\pi r^2",
  display: true,
};

export const sampleImageUpload: ImageUploadProps = {
  label: "Hero photo",
  description: "Pick a JPEG/PNG/WebP/GIF from your device (uploads to apps/api).",
  multiple: false,
};

/**
 * A hand-written OpenUI Lang program exercising the full extended library
 * (layout + a custom teaching component + a built-in chart + Math) — used by
 * the gallery to demonstrate the Renderer path end-to-end, not just the
 * legacy direct-component fixtures above. See docs/openui-migration.md.
 */
export const sampleOpenUiLang = `root = Stack([title, intro, formula, chartCard], "column", "l")
title = TextContent("Circle area, from formula to chart", "large-heavy")
intro = TextContent("The area of a circle scales with the square of its radius:")
formula = Math("A = \\\\pi r^2", true)
chartCard = Card([chartHeader, chart])
chartHeader = CardHeader("Area by radius", "A = \u03c0r\u00b2 evaluated at a few radii")
chart = BarChart(["1", "2", "3", "4", "5"], [Series("Area", [3.14, 12.57, 28.27, 50.27, 78.54])], "grouped", "Radius", "Area")`;

export const stemCellDiagram: DiagramProps = {
  title: "How a stem cell differentiates",
  nodes: [
    { id: "stem", label: "Stem cell", description: "Unspecialized, self-renewing" },
    { id: "signal", label: "Signal", description: "Chemical cue from nearby tissue" },
    { id: "neuron", label: "Neuron", description: "Specialized for signaling" },
    { id: "muscle", label: "Muscle cell", description: "Specialized for contraction" },
    { id: "blood", label: "Blood cell", description: "Specialized for oxygen transport" },
  ],
  edges: [
    { from: "stem", to: "signal", label: "receives" },
    { from: "signal", to: "neuron", label: "differentiates into" },
    { from: "signal", to: "muscle", label: "differentiates into" },
    { from: "signal", to: "blood", label: "differentiates into" },
  ],
};

export const blockchainStepThrough: StepThroughProps = {
  title: "How a block gets added to the chain",
  steps: [
    {
      heading: "1. A transaction is broadcast",
      body: "A signed transaction is sent to the network and picked up by nodes.",
    },
    {
      heading: "2. It waits in the mempool",
      body: "Pending transactions sit in each node's mempool until a validator picks them up.",
    },
    {
      heading: "3. Validators build a block",
      body: "A validator bundles pending transactions into a candidate block and proposes it.",
      highlight: "Only one proposed block per round is accepted by the network.",
    },
    {
      heading: "4. The block is appended",
      body: "Once enough nodes agree it's valid, the block is appended to the chain and the transaction is final.",
    },
  ],
};

export const sampleFormulaStepper: FormulaStepperProps = {
  title: "Deriving the circle area formula",
  terms: [
    {
      expression: "A = ?",
      note: "We want the area of a circle with radius r.",
    },
    {
      expression: "A ≈ sum of thin rings from 0 to r",
      note: "Each ring at radius x has circumference 2πx and thickness dx.",
    },
    {
      expression: "A = ∫₀ʳ 2πx dx",
      note: "Integrate the ring areas from the center out to r.",
    },
    {
      expression: "A = πr²",
      note: "Evaluating the integral gives the familiar formula.",
    },
  ],
};
