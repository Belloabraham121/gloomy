/**
 * Hand-illustrated stem-cell differentiation figure for the landing
 * scenario theater (not the generic A2UI Diagram). lv3 palette; callout
 * lines carry the `lv3-fig-callout` class so page.tsx can draw them in.
 */
export function StemCellFigure() {
  return (
    <svg
      className="lv3-fig"
      viewBox="0 0 460 260"
      role="img"
      aria-label="A stem cell differentiating into a neuron, muscle cell, and red blood cell"
    >
      {/* branch arrows */}
      <path className="lv3-fig-arrow" d="M120,130 C165,90 190,72 232,64" />
      <path className="lv3-fig-arrow" d="M122,132 C170,132 195,132 232,132" />
      <path className="lv3-fig-arrow" d="M120,150 C165,182 190,196 232,204" />

      {/* stem cell */}
      <g>
        <circle className="lv3-fig-membrane" cx="78" cy="132" r="46" />
        <circle className="lv3-fig-nucleus" cx="78" cy="132" r="20" />
        <circle className="lv3-fig-nucleolus" cx="84" cy="127" r="7" />
      </g>
      <text className="lv3-fig-title" x="78" y="200" textAnchor="middle">
        Stem cell
      </text>

      {/* neuron */}
      <g transform="translate(300, 64)">
        <path
          className="lv3-fig-neuron"
          d="M0,0 L-14,-14 M0,0 L-16,4 M0,0 L-10,16 M0,0 L18,-8"
        />
        <circle className="lv3-fig-cell-a" cx="0" cy="0" r="15" />
        <path className="lv3-fig-axon" d="M14,2 L70,10" />
      </g>
      <text className="lv3-fig-label" x="312" y="34" textAnchor="middle">
        Neuron
      </text>

      {/* muscle cell */}
      <g transform="translate(300, 132)">
        <ellipse className="lv3-fig-cell-b" cx="0" cy="0" rx="34" ry="12" />
        <line className="lv3-fig-striation" x1="-22" y1="-8" x2="-22" y2="8" />
        <line className="lv3-fig-striation" x1="-8" y1="-10" x2="-8" y2="10" />
        <line className="lv3-fig-striation" x1="8" y1="-10" x2="8" y2="10" />
        <line className="lv3-fig-striation" x1="22" y1="-8" x2="22" y2="8" />
      </g>
      <text className="lv3-fig-label" x="300" y="160" textAnchor="middle">
        Muscle cell
      </text>

      {/* red blood cell (biconcave) */}
      <g transform="translate(300, 204)">
        <circle className="lv3-fig-cell-c" cx="0" cy="0" r="17" />
        <circle className="lv3-fig-cell-c-dip" cx="0" cy="0" r="7" />
      </g>
      <text className="lv3-fig-label" x="300" y="240" textAnchor="middle">
        Red blood cell
      </text>

      {/* callouts on the stem cell */}
      <path className="lv3-fig-callout" d="M92,118 L150,96" />
      <text className="lv3-fig-callout-label" x="152" y="94">
        nucleus
      </text>
      <path className="lv3-fig-callout" d="M112,150 L150,168" />
      <text className="lv3-fig-callout-label" x="152" y="172">
        membrane
      </text>
    </svg>
  );
}
