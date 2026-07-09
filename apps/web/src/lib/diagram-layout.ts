export interface NodePosition {
  id: string;
  x: number;
  y: number;
}

// Wide cells with a narrow box inside them: the gap between adjacent node
// boxes is where edge labels render, so it needs real room (~120px) or
// labels collide with the neighboring node. See Diagram.tsx for the
// matching box width and label truncation.
export const DIAGRAM_CELL_WIDTH = 260;
export const DIAGRAM_CELL_HEIGHT = 110;
const DIAGRAM_PADDING = 20;

export function layoutGrid(nodeIds: string[]): {
  positions: NodePosition[];
  width: number;
  height: number;
} {
  // Prefer a single wide row (up to 4 nodes) over a square grid: most
  // hand-authored diagrams describe a roughly linear flow, and a single row
  // keeps sequential edges horizontal instead of introducing diagonal
  // crossings a square grid would create.
  const columns = Math.max(1, Math.min(nodeIds.length, 4));
  const rows = Math.max(1, Math.ceil(nodeIds.length / columns));

  const positions = nodeIds.map((id, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    return {
      id,
      x: DIAGRAM_PADDING + col * DIAGRAM_CELL_WIDTH + DIAGRAM_CELL_WIDTH / 2,
      y: DIAGRAM_PADDING + row * DIAGRAM_CELL_HEIGHT + DIAGRAM_CELL_HEIGHT / 2,
    };
  });

  return {
    positions,
    width: columns * DIAGRAM_CELL_WIDTH + DIAGRAM_PADDING * 2,
    height: rows * DIAGRAM_CELL_HEIGHT + DIAGRAM_PADDING * 2,
  };
}
