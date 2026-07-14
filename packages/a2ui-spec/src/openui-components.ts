import type { z } from "zod/v4";
import { diagramSchema } from "./diagram.js";
import { formulaStepperSchema } from "./formula-stepper.js";
import { mathDescription, mathSchema } from "./math.js";
import { quizSchema } from "./quiz.js";
import { simulationSchema } from "./simulation.js";
import { stepThroughSchema } from "./step-through.js";

/**
 * The single source of truth for gloomy's custom OpenUI Lang components -
 * name, prop schema, and description. Both apps/web (binds each name to a
 * real React renderer via @openuidev/react-lang's `defineComponent`) and
 * apps/api (binds each name to a no-op renderer via @openuidev/lang-core's
 * `defineComponent`, only to generate/validate the prompt) build their
 * OpenUI library from this exact list, so the model's system prompt can
 * never drift from what the frontend Renderer can actually render.
 *
 * `Chart` (the pre-OpenUI custom line/bar chart, see chart.ts) is
 * deliberately NOT in this list - it has been retired in favor of OpenUI's
 * richer built-in Charts (BarChart/LineChart/AreaChart/PieChart/...), see
 * docs/openui-migration.md. Its schema stays exported/registered in
 * a2uiRegistry purely so old cached/deliverable `{component: "Chart", ...}`
 * links (from before this migration) still decode and render.
 */
export interface CustomComponentSpec<T extends z.ZodType = z.ZodType> {
  name: string;
  schema: T;
  description: string;
}

export const customComponentSpecs: CustomComponentSpec[] = [
  {
    name: "Diagram",
    schema: diagramSchema,
    description:
      "Labeled nodes and edges for explaining structure or relationships between things. Not part of Card/Tabs/Accordion's fixed child-type union - always nest inside a Stack.",
  },
  {
    name: "StepThrough",
    schema: stepThroughSchema,
    description:
      "An ordered sequence of steps or states, revealed one at a time, for explaining a process. Not part of Card/Tabs/Accordion's fixed child-type union - always nest inside a Stack.",
  },
  {
    name: "Quiz",
    schema: quizSchema,
    description:
      "A single multiple-choice question with immediate right/wrong feedback and an explanation. Not part of Card/Tabs/Accordion's fixed child-type union - always nest inside a Stack.",
  },
  {
    name: "Simulation",
    schema: simulationSchema,
    description:
      "A parameterized interactive model the user can adjust with sliders to see how an output changes. Not part of Card/Tabs/Accordion's fixed child-type union - always nest inside a Stack.",
  },
  {
    name: "FormulaStepper",
    schema: formulaStepperSchema,
    description:
      "A formula or derivation revealed term by term. For a single static formula, prefer Math. Not part of Card/Tabs/Accordion's fixed child-type union - always nest inside a Stack.",
  },
  {
    name: "Math",
    schema: mathSchema,
    description: `${mathDescription} Not part of Card/Tabs/Accordion's fixed child-type union - always nest inside a Stack.`,
  },
];

export const customComponentNames = customComponentSpecs.map((c) => c.name);
