import { createLibrary, defineComponent } from "@openuidev/react-lang";
import {
  openuiComponentGroups,
  openuiLibrary,
} from "@openuidev/react-ui/genui-lib";
import {
  a2uiRegistry,
  customComponentSpecs,
  diagramSchema,
  formulaStepperSchema,
  mathSchema,
  quizSchema,
  simulationSchema,
  stepThroughSchema,
} from "@gloomy/a2ui-spec";
import { Chart } from "@/components/a2ui/Chart";
import { Diagram } from "@/components/a2ui/Diagram";
import { FormulaStepper } from "@/components/a2ui/FormulaStepper";
import { Math as MathComponent } from "@/components/a2ui/Math";
import { Quiz } from "@/components/a2ui/Quiz";
import { Simulation } from "@/components/a2ui/Simulation";
import { StepThrough } from "@/components/a2ui/StepThrough";

/**
 * name -> description, pulled from `@gloomy/a2ui-spec`'s
 * `customComponentSpecs` (the single source of truth shared with apps/api's
 * generated prompt - see docs/openui-migration.md) so the two never drift.
 */
const descriptions = Object.fromEntries(
  customComponentSpecs.map((spec) => [spec.name, spec.description]),
);

const DiagramComponent = defineComponent({
  name: "Diagram",
  description: descriptions.Diagram,
  props: diagramSchema,
  component: ({ props }) => <Diagram {...props} />,
});

const StepThroughComponent = defineComponent({
  name: "StepThrough",
  description: descriptions.StepThrough,
  props: stepThroughSchema,
  component: ({ props }) => <StepThrough {...props} />,
});

const QuizComponent = defineComponent({
  name: "Quiz",
  description: descriptions.Quiz,
  props: quizSchema,
  component: ({ props }) => <Quiz {...props} />,
});

const SimulationComponent = defineComponent({
  name: "Simulation",
  description: descriptions.Simulation,
  props: simulationSchema,
  component: ({ props }) => <Simulation {...props} />,
});

const FormulaStepperComponent = defineComponent({
  name: "FormulaStepper",
  description: descriptions.FormulaStepper,
  props: formulaStepperSchema,
  component: ({ props }) => <FormulaStepper {...props} />,
});

const MathDefinedComponent = defineComponent({
  name: "Math",
  description: descriptions.Math,
  props: mathSchema,
  component: ({ props }) => <MathComponent {...props} />,
});

const customDefinedComponents = [
  DiagramComponent,
  StepThroughComponent,
  QuizComponent,
  SimulationComponent,
  FormulaStepperComponent,
  MathDefinedComponent,
];

/**
 * The extended OpenUI Lang library: OpenUI's own built-in components
 * (Stack, Tabs, Accordion, Charts, Table, MarkDownRenderer, forms, ...)
 * plus gloomy's custom teaching components and Math, all renderable
 * through one `<Renderer library={a2uiLibrary} .../>` - see
 * docs/openui-migration.md for the migration from the old direct-render
 * single-component path.
 */
export const a2uiLibrary = createLibrary({
  components: [...Object.values(openuiLibrary.components), ...customDefinedComponents],
  componentGroups: [
    ...(openuiComponentGroups ?? []),
    {
      name: "Teaching (gloomy custom)",
      components: customComponentSpecs.map((c) => c.name),
      notes: [
        "- Not part of Card/Tabs/Accordion/Carousel/Modal's fixed child-type unions - always nest inside a Stack.",
        "- Prefer OpenUI's own Charts for quantitative data; use these for diagrams, quizzes, simulations, step-by-step processes, and real LaTeX.",
      ],
    },
  ],
  root: openuiLibrary.root,
});

/**
 * Legacy direct-render path: takes a pre-migration `{ component, props }`
 * payload (e.g. an old cached response, or an old `/d?p=...` deliverable
 * link minted before this migration) and renders the matching React
 * component straight from a2uiRegistry, bypassing the OpenUI Renderer/
 * parser entirely. Kept only for backward compatibility - see
 * `A2uiRenderer.tsx` and docs/openui-migration.md.
 */
export const a2uiComponents = {
  Diagram,
  StepThrough,
  Quiz,
  Simulation,
  Chart,
  FormulaStepper,
} as const;

export { a2uiRegistry };
