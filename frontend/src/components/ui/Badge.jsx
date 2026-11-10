const badgeMap = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
  primary: 'badge-primary',
  secondary: 'badge-secondary',
}

export default function Badge({ color = 'secondary', children, className = '' }) {
  const badgeClass = badgeMap[color] || 'badge-secondary'

  return (
    <span className={`badge badge-polished ${badgeClass} ${className}`.trim()}>
      {children}
      <style>{`
        .badge-polished {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: fit-content;
          min-height: 23px;
          padding: 4px 9px;
          border: 1px solid currentColor;
          border-radius: 7px;
          font-size: 9px;
          font-weight: 750;
          line-height: 1.25;
          letter-spacing: .025em;
          white-space: nowrap;
          transition: filter .16s ease, transform .16s ease;
        }
        .badge-polished:hover {
          filter: brightness(1.08);
        }
        @media (prefers-reduced-motion: reduce) {
          .badge-polished { transition: none; }
        }
      `}</style>
    </span>
  )
}
