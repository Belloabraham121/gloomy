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

function GalleryItem({
  kind,
  children,
}: {
  kind: string;
  children: React.ReactNode;
}) {
  return (
    <div className="a2ui-gallery-item">
      <span className="a2ui-kind">{kind}</span>
      {children}
    </div>
  );
}

export default function GalleryPage() {
  return (
    <main className="a2ui-gallery">
      <p className="hero-eyebrow">Component catalog</p>
      <h1 className="hero-title">
        The A2UI <em>gallery</em>
      </h1>
      <p className="hero-sub">
        Every component the model is allowed to answer with, rendered here
        from hardcoded fixture data — no backend or LLM involved.
      </p>
      <div className="a2ui-gallery-grid">
        <GalleryItem kind="Diagram">
          <Diagram {...sampleDiagram} />
        </GalleryItem>
        <GalleryItem kind="StepThrough">
          <StepThrough {...sampleStepThrough} />
        </GalleryItem>
        <GalleryItem kind="Quiz">
          <Quiz {...sampleQuiz} />
        </GalleryItem>
        <GalleryItem kind="Simulation">
          <Simulation {...sampleSimulation} />
        </GalleryItem>
        <GalleryItem kind="Chart">
          <Chart {...sampleChart} />
        </GalleryItem>
        <GalleryItem kind="FormulaStepper">
          <FormulaStepper {...sampleFormulaStepper} />
        </GalleryItem>
      </div>
    </main>
  );
}
