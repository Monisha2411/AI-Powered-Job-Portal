import { AlertIcon } from '../Icons'

export default function ErrorState({
  message = 'Something went wrong. Please try again.',
  onRetry,
}) {
  return (
    <div className="error-state error-state-enhanced" role="alert">
      <div className="error-state-icon">
        <AlertIcon size={25} />
      </div>

      <div className="error-state-copy">
        <p className="error-state-title">Unable to load this content</p>
        <p className="error-state-message">{message}</p>
      </div>

      {onRetry && (
        <button className="btn btn-outline error-state-retry" type="button" onClick={onRetry}>
          Retry
        </button>
      )}

      <style>{`
        .error-state-enhanced {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          min-height: 190px;
          padding: 30px 18px;
          border: 1px solid rgba(248, 113, 113, .16);
          border-radius: 16px;
          background: linear-gradient(145deg, rgba(248, 113, 113, .055), rgba(139, 92, 246, .025));
          text-align: center;
        }
        .error-state-icon {
          display: grid;
          width: 48px;
          height: 48px;
          place-items: center;
          border: 1px solid rgba(248, 113, 113, .2);
          border-radius: 15px;
          color: var(--danger, #f87171);
          background: rgba(248, 113, 113, .09);
        }
        .error-state-copy { max-width: 440px; }
        .error-state-title {
          margin: 0 0 5px;
          color: var(--text-primary, inherit);
          font-size: 13px;
          font-weight: 750;
        }
        .error-state-message {
          margin: 0;
          color: var(--text-muted, #9692a8);
          font-size: 11px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }
        .error-state-retry {
          min-height: 34px;
          margin-top: 3px;
          padding: 7px 15px;
          border-radius: 9px;
        }
      `}</style>
    </div>
  )
}
