import { Chart } from "@/components/a2ui/Chart";
import { Diagram } from "@/components/a2ui/Diagram";
import { FormulaStepper } from "@/components/a2ui/FormulaStepper";
import { ImageUpload } from "@/components/a2ui/ImageUpload";
import { GalleryLangDemo } from "@/components/GalleryLangDemo";
import { Math } from "@/components/a2ui/Math";
import { Quiz } from "@/components/a2ui/Quiz";
import { Simulation } from "@/components/a2ui/Simulation";
import { StepThrough } from "@/components/a2ui/StepThrough";
import {
  sampleChart,
  sampleDiagram,
  sampleFormulaStepper,
  sampleImageUpload,
  sampleMath,
  sampleOpenUiLang,
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
    <main className="lv3-theme a2ui-gallery">
      <p className="hero-eyebrow">Component catalog</p>
      <h1 className="hero-title">
        The A2UI <em>gallery</em>
      </h1>
      <p className="hero-sub">
        gloomy&apos;s custom teaching components, rendered here directly from
        hardcoded fixture data — no backend or LLM involved.
      </p>
      <div className="a2ui-gallery-grid lv3-stage">
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
        <GalleryItem kind="Chart (legacy, kept for old cached/deliverable links)">
          <Chart {...sampleChart} />
        </GalleryItem>
        <GalleryItem kind="FormulaStepper">
          <FormulaStepper {...sampleFormulaStepper} />
        </GalleryItem>
        <GalleryItem kind="Math">
          <Math {...sampleMath} />
        </GalleryItem>
        <GalleryItem kind="ImageUpload">
          <ImageUpload {...sampleImageUpload} />
        </GalleryItem>
      </div>

      <p className="hero-eyebrow" style={{ marginTop: "3rem" }}>
        Full OpenUI Lang program
      </p>
      <h2 className="hero-title" style={{ fontSize: "1.5rem" }}>
        What the model actually generates
      </h2>
      <p className="hero-sub">
        The real generation turn returns a whole openui-lang program like
        this, rendered through the same <code>&lt;Renderer&gt;</code> as{" "}
        <code>/chat</code> and <code>/d</code> — layout, a built-in chart, and
        a custom component composed together in one response.
      </p>
      <div className="a2ui-gallery-grid lv3-stage">
        <GalleryItem kind="Stack([TextContent, Math, Card([CardHeader, BarChart])])">
          <GalleryLangDemo lang={sampleOpenUiLang} />
        </GalleryItem>
      </div>
    </main>
  );
}
