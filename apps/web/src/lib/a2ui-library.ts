import { createLibrary, defineComponent } from "@openuidev/react-lang";
import { a2uiRegistry } from "@gloomy/a2ui-spec";
import { Chart } from "@/components/a2ui/Chart";
import { Diagram } from "@/components/a2ui/Diagram";
import { FormulaStepper } from "@/components/a2ui/FormulaStepper";
import { Quiz } from "@/components/a2ui/Quiz";
import { Simulation } from "@/components/a2ui/Simulation";
import { StepThrough } from "@/components/a2ui/StepThrough";

const DiagramComponent = defineComponent({
  name: "Diagram",
  description: a2uiRegistry.Diagram.description,
  props: a2uiRegistry.Diagram.schema,
  component: ({ props }) => Diagram(props),
});

const StepThroughComponent = defineComponent({
  name: "StepThrough",
  description: a2uiRegistry.StepThrough.description,
  props: a2uiRegistry.StepThrough.schema,
  component: ({ props }) => StepThrough(props),
});

const QuizComponent = defineComponent({
  name: "Quiz",
  description: a2uiRegistry.Quiz.description,
  props: a2uiRegistry.Quiz.schema,
  component: ({ props }) => Quiz(props),
});

const SimulationComponent = defineComponent({
  name: "Simulation",
  description: a2uiRegistry.Simulation.description,
  props: a2uiRegistry.Simulation.schema,
  component: ({ props }) => Simulation(props),
});

const ChartComponent = defineComponent({
  name: "Chart",
  description: a2uiRegistry.Chart.description,
  props: a2uiRegistry.Chart.schema,
  component: ({ props }) => Chart(props),
});

const FormulaStepperComponent = defineComponent({
  name: "FormulaStepper",
  description: a2uiRegistry.FormulaStepper.description,
  props: a2uiRegistry.FormulaStepper.schema,
  component: ({ props }) => FormulaStepper(props),
});

export const a2uiLibrary = createLibrary({
  components: [
    DiagramComponent,
    StepThroughComponent,
    QuizComponent,
    SimulationComponent,
    ChartComponent,
    FormulaStepperComponent,
  ],
});

/**
 * Direct render path: takes a { component, props } payload (e.g. from
 * apps/api's Claude tool-use response) and renders the matching React
 * component straight from a2uiRegistry, bypassing OpenUI's Lang parser.
 * See docs/architecture.md for why — no live model to validate hand-written
 * OpenUI Lang generation against yet.
 */
export const a2uiComponents = {
  Diagram,
  StepThrough,
  Quiz,
  Simulation,
  Chart,
  FormulaStepper,
} as const;
