export function matchScoreColor(score) {
  if (score === null || score === undefined) return 'low'
  if (score >= 70) return 'high'
  if (score >= 40) return 'mid'
  return 'low'
}

export default function MatchScore({ score, showLabel = true }) {
  const value = score ?? 0
  const safeValue = Math.min(100, Math.max(0, Number(value) || 0))
  const barClass = matchScoreColor(value)
  const color =
    safeValue >= 70 ? 'var(--success)' : safeValue >= 40 ? 'var(--warning)' : 'var(--danger)'
  const percentage = `${Math.max(safeValue, 3)}%`

  return (
    <div className="match-score-widget">
      {showLabel && (
        <div className="match-score-heading">
          <span className="match-score-label">AI Match</span>
          <span className="match-score-value" style={{ color }}>
            {Math.round(safeValue)}%
          </span>
        </div>
      )}

      <div
        className="match-score-track"
        role="progressbar"
        aria-label="AI match score"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(safeValue)}
      >
        <div
          className={`match-score-fill ${barClass}`}
          style={{ width: percentage }}
        />
      </div>

      {!showLabel && (
        <span className="match-score-value match-score-value-standalone" style={{ color }}>
          {Math.round(safeValue)}%
        </span>
      )}

      <style>{`
        .match-score-widget {
          display: block;
          min-width: 120px;
          width: 100%;
        }
        .match-score-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 7px;
        }
        .match-score-label {
          color: var(--text-muted, #9692a8);
          font-size: 10px;
          font-weight: 600;
        }
        .match-score-value {
          font-size: 12px;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
        }
        .match-score-track {
          width: 100%;
          height: 7px;
          overflow: hidden;
          border: 1px solid rgba(167, 139, 250, .12);
          border-radius: 20px;
          background: rgba(139, 92, 246, .1);
        }
        .match-score-fill {
          height: 100%;
          border-radius: inherit;
          transition: width .55s cubic-bezier(.2,.75,.25,1);
        }
        .match-score-fill.high {
          background: linear-gradient(90deg, #16a878, #55d6a5);
        }
        .match-score-fill.mid {
          background: linear-gradient(90deg, #c58a24, #f4c15e);
        }
        .match-score-fill.low {
          background: linear-gradient(90deg, #d65368, #fb8291);
        }
        .match-score-value-standalone {
          display: inline-block;
          margin-top: 5px;
        }
        @media (prefers-reduced-motion: reduce) {
          .match-score-fill { transition: none; }
        }
      `}</style>
    </div>
  )
}
