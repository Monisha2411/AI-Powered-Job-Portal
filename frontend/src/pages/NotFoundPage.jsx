import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="auth-container not-found-page">
      <style>{`
        .not-found-page { position: relative; min-height: 100vh; display: grid; place-items: center; overflow: hidden; padding: 28px 18px; background: radial-gradient(ellipse at 50% 42%,rgba(124,92,246,.16),transparent 55%); }
        .not-found-page::before,.not-found-page::after { content: ''; position: absolute; width: 250px; height: 250px; border: 1px solid rgba(167,139,250,.12); border-radius: 50%; pointer-events: none; }
        .not-found-page::before { transform: scale(1.45); }
        .not-found-page::after { transform: scale(2); opacity: .55; }
        .not-found-content { position: relative; z-index: 1; width: min(100%,480px); padding: 42px 28px; text-align: center; border: 1px solid var(--border-color,rgba(151,130,220,.2)); border-radius: 22px; background: var(--card-bg,rgba(255,255,255,.035)); box-shadow: 0 22px 70px rgba(10,7,30,.2); animation: notFoundEnter .5s ease both; }
        @keyframes notFoundEnter { from { opacity: 0; transform: translateY(12px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .not-found-code { margin: 0; font-size: clamp(76px,18vw,112px); line-height: .95; font-weight: 850; letter-spacing: -.075em; color: #a78bfa; text-shadow: 0 8px 35px rgba(139,92,246,.22); }
        .not-found-label { display: inline-flex; margin: 18px 0 10px; padding: 6px 11px; border-radius: 999px; border: 1px solid rgba(167,139,250,.24); color: #c4b5fd; background: rgba(139,92,246,.1); font-size: 10px; font-weight: 750; letter-spacing: .12em; text-transform: uppercase; }
        .not-found-title { margin: 0; font-size: 23px; font-weight: 750; letter-spacing: -.035em; color: var(--text-primary,inherit); }
        .not-found-description { max-width: 330px; margin: 10px auto 23px; color: var(--text-muted,#9692a8); font-size: 13px; line-height: 1.7; }
        .not-found-link { display: inline-flex; align-items: center; justify-content: center; min-height: 42px; padding: 0 18px; border-radius: 11px; text-decoration: none; }
        @media (prefers-reduced-motion: reduce) { .not-found-content { animation: none; } }
      `}</style>
      <div className="not-found-content">
        <p className="not-found-code">404</p>
        <span className="not-found-label">Page unavailable</span>
        <h1 className="not-found-title">Page not found</h1>
        <p className="not-found-description">The page you are looking for does not exist or has been moved.</p>
        <Link to="/" className="btn btn-primary not-found-link">Back to Home</Link>
      </div>
    </div>
  )
}
