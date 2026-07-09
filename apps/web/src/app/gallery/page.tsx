import { Chart } from "@/components/a2ui/Chart";
import { Diagram } from "@/components/a2ui/Diagram";
import { FormulaStepper } from "@/components/a2ui/FormulaStepper";
import { Quiz } from "@/components/a2ui/Quiz";
import { Simulation } from "@/components/a2ui/Simulation";
import { StepThrough } from "@/components/a2ui/StepThrough";
import {
  sampleChart,
  sampleDiagram,
  sampleFormulaStepper,
  sampleQuiz,
  sampleSimulation,
  sampleStepThrough,
} from "@/fixtures/sample-a2ui";

export default function GalleryPage() {
  return (
    <main className="a2ui-gallery">
      <h1>A2UI component gallery</h1>
      <p>
        Build order step 2: all 6 components rendered from hardcoded fixture
        data, no backend or LLM involved.
      </p>
      <div className="a2ui-gallery-grid">
        <Diagram {...sampleDiagram} />
        <StepThrough {...sampleStepThrough} />
        <Quiz {...sampleQuiz} />
        <Simulation {...sampleSimulation} />
        <Chart {...sampleChart} />
        <FormulaStepper {...sampleFormulaStepper} />
      </div>
    </main>
  );
}
