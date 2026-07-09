"use client";

import type { DiagramProps } from "@gloomy/a2ui-spec";
import {
  DIAGRAM_CELL_HEIGHT,
  DIAGRAM_CELL_WIDTH,
  layoutGrid,
} from "@/lib/diagram-layout";

export function Diagram({ title, nodes, edges }: DiagramProps) {
  const { positions, width, height } = layoutGrid(nodes.map((n) => n.id));
  const positionById = new Map(positions.map((p) => [p.id, p]));

  return (
    <div className="a2ui-card">
      <h3 className="a2ui-title">{title}</h3>
      <div className="a2ui-diagram-scroll">
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={title}
          style={{ overflow: "visible" }}
        >
          <defs>
            <marker
              id="a2ui-arrow"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 Z" fill="#5f5f76" />
            </marker>
          </defs>

          {(() => {
            // Edges sharing the same unordered node pair (e.g. a request
            // edge and its reply edge) would otherwise stack their labels
            // on the exact same midpoint. Track how many we've seen per
            // pair and offset each subsequent one along the line normal.
            const pairSeen = new Map<string, number>();
            return edges.map((edge, i) => {
              const from = positionById.get(edge.from);
              const to = positionById.get(edge.to);
              if (!from || !to) return null;

              const pairKey = [edge.from, edge.to].sort().join("::");
              const occurrence = pairSeen.get(pairKey) ?? 0;
              pairSeen.set(pairKey, occurrence + 1);

              const midX = (from.x + to.x) / 2;
              const midY = (from.y + to.y) / 2;
              const dx = to.x - from.x;
              const dy = to.y - from.y;
              const length = Math.hypot(dx, dy) || 1;
              // Unit vector perpendicular to the edge, used to nudge stacked labels apart.
              const nx = -dy / length;
              const ny = dx / length;
              const offset = occurrence * 14;

              return (
                <g key={`${edge.from}-${edge.to}-${i}`}>
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke="#5f5f76"
                    strokeWidth={1.5}
                    markerEnd="url(#a2ui-arrow)"
                  />
                  {edge.label && (
                    <text
                      x={midX + nx * offset}
                      y={midY + ny * offset - 6}
                      fill="#a2a2b0"
                      fontSize={12}
                      textAnchor="middle"
                    >
                      {edge.label.length > 18
                        ? `${edge.label.slice(0, 16)}…`
                        : edge.label}
                    </text>
                  )}
                </g>
              );
            });
          })()}

          {nodes.map((node) => {
            const pos = positionById.get(node.id);
            if (!pos) return null;
            const boxWidth = DIAGRAM_CELL_WIDTH - 120;
            const boxHeight = DIAGRAM_CELL_HEIGHT - 40;
            return (
              <g key={node.id}>
                <rect
                  x={pos.x - boxWidth / 2}
                  y={pos.y - boxHeight / 2}
                  width={boxWidth}
                  height={boxHeight}
                  rx={10}
                  fill="#1b1b24"
                  stroke="#31313e"
                />
                <text
                  x={pos.x}
                  y={pos.y - (node.description ? 4 : -4)}
                  fill="#ececf1"
                  fontSize={13}
                  fontWeight={600}
                  textAnchor="middle"
                >
                  {node.label}
                </text>
                {node.description && (
                  <text
                    x={pos.x}
                    y={pos.y + 14}
                    fill="#8f8f9d"
                    fontSize={11}
                    textAnchor="middle"
                  >
                    {node.description.length > 26
                      ? `${node.description.slice(0, 24)}…`
                      : node.description}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
