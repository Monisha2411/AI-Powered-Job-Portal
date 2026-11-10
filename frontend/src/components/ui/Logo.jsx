import { useTheme } from '../../context/ThemeContext'

export default function Logo({ size = 32, textSize = '18px', showText = true }) {
  const { dark } = useTheme()

  return (
    <div className={`brand brand-polished ${dark ? 'brand-dark' : 'brand-light'}`} style={{ gap: 10 }}>
      <span className="brand-logo brand-logo-polished">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 64 64"
          width={size}
          height={size}
          role="img"
          aria-label="AI JobPortal logo"
        >
          <defs>
            <linearGradient id="ai-jobportal-logo-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#6366f1" />
              <stop offset="1" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" rx="16" fill="url(#ai-jobportal-logo-gradient)" />
          <path
            d="M22 46 V26 Q22 20 28 20 H36 Q42 20 42 26 V46"
            fill="none"
            stroke="#fff"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="26" cy="30" r="2.5" fill="#fff" />
          <circle cx="32" cy="30" r="2.5" fill="#fff" />
          <circle cx="38" cy="30" r="2.5" fill="#fff" />
          <path d="M26 36 h12 M26 40 h9" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </span>

      {showText && (
        <span className="brand-text brand-text-polished" style={{ fontSize: textSize }}>
          AI-<span className="ai">JobPortal</span>
        </span>
      )}

      <style>{`
        .brand-polished {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          min-width: 0;
          text-decoration: none;
        }
        .brand-logo-polished {
          display: inline-flex;
          flex: 0 0 auto;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: 16px;
          filter: drop-shadow(0 5px 12px rgba(99, 102, 241, .2));
          transition: transform .2s ease, filter .2s ease;
        }
        .brand-polished:hover .brand-logo-polished {
          transform: translateY(-1px);
          filter: drop-shadow(0 7px 15px rgba(139, 92, 246, .3));
        }
        .brand-text-polished {
          display: inline-block;
          color: var(--text-primary, #f4f0ff);
          font-weight: 800;
          letter-spacing: -.045em;
          line-height: 1;
          white-space: nowrap;
        }
        .brand-text-polished .ai {
          color: #a78bfa;
        }
        .brand-light .brand-text-polished {
          color: var(--text-primary, #211b35);
        }
        @media (prefers-reduced-motion: reduce) {
          .brand-logo-polished { transition: none; }
        }
      `}</style>
    </div>
  )
}
