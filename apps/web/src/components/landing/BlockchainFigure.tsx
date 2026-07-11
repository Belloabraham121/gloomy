interface BlockProps {
  x: number;
  label: string;
  candidate?: boolean;
}

function Block({ x, label, candidate }: BlockProps) {
  return (
    <g transform={`translate(${x}, 96)`} className={candidate ? "lv3-fig-candidate" : ""}>
      <rect
        className={`lv3-fig-block ${candidate ? "candidate" : ""}`}
        x="0"
        y="0"
        width="96"
        height="104"
        rx="10"
      />
      <text className="lv3-fig-block-title" x="48" y="20" textAnchor="middle">
        {label}
      </text>
      <text className="lv3-fig-block-row" x="10" y="42">
        prev hash
      </text>
      <rect className="lv3-fig-block-bar" x="10" y="48" width="76" height="6" rx="3" />
      <text className="lv3-fig-block-row" x="10" y="70">
        hash
      </text>
      <rect className="lv3-fig-block-bar hot" x="10" y="76" width="76" height="6" rx="3" />
      <text className="lv3-fig-block-row" x="10" y="94">
        transactions
      </text>
    </g>
  );
}

/**
 * Hand-illustrated "how a block joins the chain" figure for the landing
 * scenario theater. Three linked blocks + a candidate sliding in from the
 * mempool; callout lines carry `lv3-fig-callout` for the draw-in.
 */
export function BlockchainFigure() {
  return (
    <svg
      className="lv3-fig"
      viewBox="0 0 460 260"
      role="img"
      aria-label="Three linked blockchain blocks with a new candidate block appended from the mempool"
    >
      {/* chain links */}
      <path className="lv3-fig-arrow" d="M104,148 L120,148" />
      <path className="lv3-fig-arrow" d="M224,148 L240,148" />
      <path className="lv3-fig-arrow lv3-fig-arrow-new" d="M344,148 L360,148" />

      <Block x={8} label="Block 1" />
      <Block x={128} label="Block 2" />
      <Block x={248} label="Block 3" />
      <Block x={368} label="New" candidate />

      {/* mempool tray */}
      <g>
        <rect className="lv3-fig-mempool" x="368" y="12" width="84" height="46" rx="8" />
        <text className="lv3-fig-mempool-label" x="410" y="30" textAnchor="middle">
          mempool
        </text>
        <rect className="lv3-fig-tx" x="378" y="38" width="18" height="10" rx="2" />
        <rect className="lv3-fig-tx" x="401" y="38" width="18" height="10" rx="2" />
        <rect className="lv3-fig-tx" x="424" y="38" width="18" height="10" rx="2" />
      </g>

      {/* callouts */}
      <path className="lv3-fig-callout" d="M96,120 L150,74" />
      <text className="lv3-fig-callout-label" x="150" y="70">
        prev hash links the chain
      </text>
      <path className="lv3-fig-callout" d="M416,110 L416,64" />
      <text className="lv3-fig-callout-label" x="416" y="234" textAnchor="middle">
        appended once validated
      </text>
    </svg>
  );
}
