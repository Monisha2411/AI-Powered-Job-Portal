import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Logo from '../../components/ui/Logo'
import { AlertIcon, LockIcon, UserIcon } from '../../components/Icons'
import { getApiError } from '../../utils/helpers'

function getDashboardPath(role, isSuperuser) {
  if (isSuperuser || role === 'admin') return '/admin'
  if (role === 'recruiter') return '/recruiter'
  return '/seeker'
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!username || !password) {
      setError('Please enter both username and password.')
      return
    }
    setLoading(true)
    try {
      const user = await login(username, password)
      if (from && from !== '/login') {
        navigate(from)
      } else {
        navigate(getDashboardPath(user.role, user.is_superuser))
      }
    } catch (err) {
      const msg = getApiError(err, 'Invalid username or password.')
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container login-page">
      <style>{`
        .login-page { position: relative; min-height: 100vh; display: grid; place-items: center; overflow: hidden; padding: 30px 18px; background: radial-gradient(ellipse at 15% 15%,rgba(124,92,246,.16),transparent 42%),radial-gradient(ellipse at 85% 85%,rgba(79,70,229,.12),transparent 42%); }
        .login-page::before,.login-page::after { content: ''; position: absolute; border: 1px solid rgba(167,139,250,.11); border-radius: 50%; pointer-events: none; }
        .login-page::before { width: 420px; height: 420px; top: -220px; right: -130px; }
        .login-page::after { width: 520px; height: 520px; bottom: -330px; left: -190px; }
        .login-page .auth-card { position: relative; z-index: 1; width: min(100%,440px); padding: 34px; border: 1px solid var(--border-color,rgba(151,130,220,.2)); border-radius: 21px; background: var(--card-bg,rgba(255,255,255,.04)); box-shadow: 0 24px 75px rgba(10,7,30,.22); animation: loginEnter .45s ease both; }
        @keyframes loginEnter { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .login-page .auth-logo { display: flex; justify-content: center; margin-bottom: 22px; }
        .login-page .auth-title { margin: 0; text-align: center; font-size: 25px; font-weight: 800; letter-spacing: -.045em; }
        .login-page .auth-subtitle { margin: 8px 0 25px; color: var(--text-muted,#9692a8); text-align: center; font-size: 12px; line-height: 1.6; }
        .login-page .form-group { margin-bottom: 17px; }
        .login-page .form-label { display: block; margin-bottom: 7px; font-size: 11px; font-weight: 650; }
        .login-page .input-icon-wrap { position: relative; }
        .login-page .input-icon-wrap > svg { position: absolute; z-index: 1; left: 13px; top: 50%; transform: translateY(-50%); color: var(--text-muted,#9692a8); pointer-events: none; }
        .login-page .input-icon-wrap .form-control { min-height: 46px; padding-left: 41px; border-radius: 11px; }
        .login-page .login-submit { min-height: 46px; margin-top: 5px; border-radius: 11px; }
        .login-page .login-footer { margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--border-color,rgba(151,130,220,.14)); text-align: center; color: var(--text-muted,#9692a8); font-size: 11px; }
        .login-page .login-footer a { color: #bda8ff; font-weight: 700; text-decoration: none; }
        .login-page .login-footer a:hover { text-decoration: underline; }
        .login-page .login-alert { display: flex; align-items: flex-start; gap: 9px; margin-bottom: 18px; padding: 11px 12px; border-radius: 10px; font-size: 11px; line-height: 1.5; }
        .login-page .login-alert svg { flex: 0 0 auto; margin-top: 1px; }
        @media (max-width: 480px) { .login-page .auth-card { padding: 27px 21px; } }
        @media (prefers-reduced-motion: reduce) { .login-page .auth-card { animation: none; } }
      `}</style>

      <div className="auth-card">
        <div className="auth-logo">
          <Logo size={40} />
        </div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account to continue.</p>

        {error && (
          <div className="alert alert-error login-alert">
            <AlertIcon size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-username">Username</label>
            <div className="input-icon-wrap">
              <UserIcon size={16} />
              <input
                id="login-username"
                type="text"
                className="form-control"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div className="input-icon-wrap">
              <LockIcon size={16} />
              <input
                id="login-password"
                type="password"
                className="form-control"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg btn-block login-submit" disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  )
}
