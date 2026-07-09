import type { z } from "zod/v4";
import { chartSchema } from "./chart";
import { diagramSchema } from "./diagram";
import { formulaStepperSchema } from "./formula-stepper";
import { quizSchema } from "./quiz";
import { simulationSchema } from "./simulation";
import { stepThroughSchema } from "./step-through";

export * from "./chart";
export * from "./diagram";
export * from "./formula-stepper";
export * from "./quiz";
export * from "./simulation";
export * from "./step-through";

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
