interface PipeNode {
  key: string;
  label: string;
  desc: string;
  cx: number;
}

const CENTER_Y = 85;
const NODE_W = 176;
const NODE_H = 80;

const NODES: PipeNode[] = [
  { key: "pdf", label: "PDF", desc: "Drop in a paper", cx: 110 },
  { key: "chunks", label: "Chunk + embed", desc: "Split, embedded, stored", cx: 390 },
  { key: "retrieve", label: "Retrieve", desc: "Top-k excerpts pulled", cx: 670 },
  { key: "ground", label: "Ground it", desc: "Answered from your paper", cx: 950 },
];

export function PipelineDiagram() {
  return (
    <section className="lv3-pipe-section">
      <div className="lv3-showcase-head">
        <p className="lv3-eyebrow lv3-reveal">Now grounded</p>
        <h2 className="lv3-h2 lv3-reveal">
          Upload a paper, <em>ask about it</em>
        </h2>
        <p className="lv3-pipe-sub lv3-reveal">
          The same request loop, fed by your own source instead of the
          model&apos;s memory.
        </p>
      </div>

      <div className="lv3-pipe-scroll">
        <svg
          className="lv3-pipe-svg"
          viewBox="0 0 1060 170"
          role="img"
          aria-label="PDF is chunked and embedded, retrieved by relevance, then used to ground the answer"
        >
          <defs>
            <marker
              id="lv3-pipe-arrow"
              markerWidth="9"
              markerHeight="9"
              refX="7.5"
              refY="4.5"
              orient="auto"
            >
              <path className="lv3-pipe-arrowhead" d="M0,0 L9,4.5 L0,9 Z" />
            </marker>
          </defs>

          {NODES.slice(0, -1).map((node, i) => {
            const next = NODES[i + 1];
            const x1 = node.cx + NODE_W / 2;
            const x2 = next.cx - NODE_W / 2;
            return (
              <path
                key={`edge-${node.key}`}
                className="lv3-pipe-edge"
                d={`M${x1},${CENTER_Y} L${x2},${CENTER_Y}`}
                markerEnd="url(#lv3-pipe-arrow)"
              />
            );
          })}

          {NODES.map((node) => (
            <g className="lv3-pipe-node" key={node.key}>
              <rect
                x={node.cx - NODE_W / 2}
                y={CENTER_Y - NODE_H / 2}
                width={NODE_W}
                height={NODE_H}
                rx={14}
              />
              <text
                className="lv3-pipe-label"
                x={node.cx}
                y={CENTER_Y - 4}
                textAnchor="middle"
              >
                {node.label}
              </text>
              <text
                className="lv3-pipe-desc"
                x={node.cx}
                y={CENTER_Y + 16}
                textAnchor="middle"
              >
                {node.desc}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}
