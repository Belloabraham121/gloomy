const CHUNK_POSITIONS = [
  { left: "10%", top: "14%" },
  { left: "58%", top: "8%" },
  { left: "16%", top: "56%" },
  { left: "56%", top: "52%" },
  { left: "36%", top: "31%" },
];

/**
 * The grounding pipeline told as a visual story: a real-looking paper that
 * splits into chunks, gets stored, and answers a question. All layers are
 * absolutely stacked; page.tsx's pinned+scrubbed timeline walks through
 * them. Default CSS shows the FINAL stage so reduced-motion (and no-JS)
 * users see a complete composition - the timeline's init resets to stage 1.
 */
export function PaperStory() {
  return (
    <section className="lv3-paper-section">
      <div className="lv3-showcase-head">
        <p className="lv3-eyebrow lv3-reveal">Now grounded</p>
        <h2 className="lv3-h2 lv3-reveal">
          Upload a paper, <em>ask about it</em>
        </h2>
      </div>

      <div className="lv3-ps-stage">
        {/* stage 1: the paper itself */}
        <div className="lv3-ps-paper">
          <span className="lv3-ps-badge">PDF</span>
          <span className="lv3-ps-doc-title" />
          {Array.from({ length: 8 }, (_, i) => (
            <span
              className="lv3-ps-doc-line"
              key={i}
              style={{ width: `${[92, 100, 96, 84, 100, 90, 97, 62][i]}%` }}
            />
          ))}
        </div>

        {/* stage 2: split into chunks */}
        <div className="lv3-ps-chunks">
          {CHUNK_POSITIONS.map((pos, i) => (
            <div className="lv3-ps-chunk" key={i} style={pos}>
              <span style={{ width: "94%" }} />
              <span style={{ width: "78%" }} />
              <span style={{ width: `${52 + (i % 3) * 14}%` }} />
            </div>
          ))}
        </div>

        {/* stage 3: embedded + stored */}
        <div className="lv3-ps-store">
          <span className="lv3-ps-store-label">vector store</span>
          <div className="lv3-ps-dots">
            {Array.from({ length: 20 }, (_, i) => (
              <i
                key={i}
                className={`lv3-ps-dot ${i === 6 || i === 13 ? "hot" : ""}`}
              />
            ))}
          </div>
        </div>

        {/* stage 4: ask, and the grounded answer assembles */}
        <div className="lv3-ps-question">What does this paper claim?</div>
        <div className="lv3-ps-answer">
          <span className="lv3-ps-answer-title" />
          <span className="lv3-ps-answer-line" style={{ width: "96%" }} />
          <span className="lv3-ps-answer-line" style={{ width: "88%" }} />
          <span className="lv3-ps-answer-line" style={{ width: "64%" }} />
          <svg viewBox="0 0 120 34" className="lv3-ps-spark" aria-hidden>
            <path
              className="lv3-ps-spark-path"
              d="M4,28 L28,20 L52,24 L76,10 L100,14 L116,5"
            />
          </svg>
        </div>
      </div>

      <div className="lv3-ps-captions" aria-hidden>
        <span className="lv3-ps-caption c1">Your paper</span>
        <span className="lv3-ps-caption c2">Split into chunks</span>
        <span className="lv3-ps-caption c3">Embedded and stored</span>
        <span className="lv3-ps-caption c4">Ask — answered from your paper</span>
      </div>
    </section>
  );
}
