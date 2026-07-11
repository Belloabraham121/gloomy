interface CatalogItem {
  key: string;
  icon: string;
  name: string;
  body: string;
}

const CATALOG: CatalogItem[] = [
  {
    key: "diagram",
    icon: "◇",
    name: "Diagram",
    body: "Nodes and edges instead of a paragraph about how things connect.",
  },
  {
    key: "steps",
    icon: "≡",
    name: "StepThrough",
    body: "One step at a time, not a numbered list you have to hold in your head.",
  },
  {
    key: "quiz",
    icon: "?",
    name: "Quiz",
    body: "Check your understanding immediately, not three screens later.",
  },
  {
    key: "sim",
    icon: "∿",
    name: "Simulation",
    body: "Drag a slider and watch the model, instead of reading about it.",
  },
  {
    key: "chart",
    icon: "▁▃▆",
    name: "Chart",
    body: "Numbers plotted on an axis, not narrated in a sentence.",
  },
  {
    key: "formula",
    icon: "∑",
    name: "FormulaStepper",
    body: "A derivation revealed term by term, not dumped in one block.",
  },
];

export function ComponentShowcase() {
  return (
    <section className="lv3-showcase">
      <div className="lv3-showcase-head">
        <p className="lv3-eyebrow lv3-reveal">The catalog</p>
        <h2 className="lv3-h2 lv3-reveal">
          One question, <em>six possible shapes</em>
        </h2>
      </div>

      <div className="lv3-showcase-viewport">
        <div className="lv3-showcase-track">
          {CATALOG.map((item, i) => (
            <div
              className="lv3-showcase-card"
              key={item.key}
              data-index={i}
            >
              <span className="lv3-showcase-icon">{item.icon}</span>
              <h3>{item.name}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
