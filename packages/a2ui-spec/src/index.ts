import type { z } from "zod/v4";
import { chartSchema } from "./chart.js";
import { diagramSchema } from "./diagram.js";
import { formulaStepperSchema } from "./formula-stepper.js";
import { quizSchema } from "./quiz.js";
import { simulationSchema } from "./simulation.js";
import { stepThroughSchema } from "./step-through.js";

export * from "./chart.js";
export * from "./diagram.js";
export * from "./formula-stepper.js";
export * from "./image-upload.js";
export * from "./lang-summary.js";
export * from "./math.js";
export * from "./openui-components.js";
export * from "./payload-link.js";
export * from "./quiz.js";
export * from "./simulation.js";
export * from "./step-through.js";
export * from "./ui-styles.js";

export const a2uiRegistry = {
  Diagram: {
    schema: diagramSchema,
    description:
      "Labeled nodes and edges for explaining structure or relationships between things.",
  },
  StepThrough: {
    schema: stepThroughSchema,
    description:
      "An ordered sequence of steps or states, revealed one at a time, for explaining a process.",
  },
  Quiz: {
    schema: quizSchema,
    description:
      "A single multiple-choice question with immediate right/wrong feedback and an explanation.",
  },
  Simulation: {
    schema: simulationSchema,
    description:
      "A parameterized interactive model the user can adjust with sliders to see how an output changes.",
  },
  Chart: {
    schema: chartSchema,
    description: "Quantitative data plotted over a category or time axis.",
  },
  FormulaStepper: {
    schema: formulaStepperSchema,
    description: "A formula or derivation revealed term by term.",
  },
} as const;

export type A2uiComponentName = keyof typeof a2uiRegistry;

export type A2uiPropsFor<Name extends A2uiComponentName> = z.infer<
  (typeof a2uiRegistry)[Name]["schema"]
>;

export type A2uiPayload = {
  [Name in A2uiComponentName]: {
    component: Name;
    props: A2uiPropsFor<Name>;
  };
}[A2uiComponentName];
