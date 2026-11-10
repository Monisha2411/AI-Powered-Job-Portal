function AlertContent({ type, children, inline = false }) {
  const tone = ['success', 'warning', 'danger', 'info'].includes(type) ? type : 'info'

  return (
    <div className={`alert alert-${tone} alert-polished${inline ? ' alert-polished-inline' : ''}`} role={tone === 'danger' ? 'alert' : 'status'}>
      <span className={`alert-polished-indicator alert-polished-${tone}`} aria-hidden="true" />
      <div className="alert-polished-content">{children}</div>

      <style>{`
        .alert-polished {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          border: 1px solid currentColor;
          border-radius: 11px;
          font-size: 12px;
          line-height: 1.55;
          background: rgba(139, 92, 246, .045);
        }
        .alert-polished-indicator {
          width: 7px;
          height: 7px;
          flex: 0 0 auto;
          margin-top: 5px;
          border-radius: 50%;
          background: currentColor;
          box-shadow: 0 0 9px currentColor;
        }
        .alert-polished-content {
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .alert-polished-inline {
          padding: 8px 10px;
          border-radius: 8px;
          font-size: 11px;
        }
        .alert-polished-inline .alert-polished-indicator {
          width: 6px;
          height: 6px;
          margin-top: 4px;
        }
      `}</style>
    </div>
  )
}

export default function Alert({ type = 'info', children }) {
  return <AlertContent type={type}>{children}</AlertContent>
}

export function AlertInline({ type = 'info', children }) {
  return <AlertContent type={type} inline>{children}</AlertContent>
}
