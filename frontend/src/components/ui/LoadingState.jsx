export default function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="loading-state loading-state-enhanced" role="status" aria-live="polite">
      <div className="loading-orbit" aria-hidden="true">
        <span className="loading-orbit-ring" />
        <span className="loading-orbit-core" />
      </div>
      <p className="loading-message">{message}</p>

      <style>{`
        .loading-state-enhanced {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 13px;
          min-height: 150px;
          padding: 28px 16px;
          color: var(--text-muted, #9692a8);
          text-align: center;
        }
        .loading-orbit {
          position: relative;
          display: grid;
          width: 38px;
          height: 38px;
          place-items: center;
        }
        .loading-orbit-ring {
          position: absolute;
          inset: 1px;
          border: 2px solid rgba(167, 139, 250, .2);
          border-top-color: #a78bfa;
          border-right-color: #8b5cf6;
          border-radius: 50%;
          animation: loadingOrbitSpin .8s linear infinite;
        }
        .loading-orbit-core {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #a78bfa;
          box-shadow: 0 0 13px rgba(167, 139, 250, .55);
          animation: loadingOrbitPulse 1.2s ease-in-out infinite;
        }
        .loading-message {
          margin: 0;
          font-size: 12px;
          line-height: 1.5;
        }
        @keyframes loadingOrbitSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes loadingOrbitPulse {
          50% { opacity: .55; transform: scale(.78); }
        }
        @media (prefers-reduced-motion: reduce) {
          .loading-orbit-ring, .loading-orbit-core { animation: none; }
        }
      `}</style>
    </div>
  )
}
