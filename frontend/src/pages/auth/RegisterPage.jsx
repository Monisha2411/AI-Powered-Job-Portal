import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Logo from '../../components/ui/Logo'
import {
  AlertIcon, LockIcon, UserIcon, MailIcon, BriefcaseIcon, UserIcon as SeekIcon,
} from '../../components/Icons'
import { getApiError } from '../../utils/helpers'

function getDashboardPath(role) {
  if (role === 'recruiter') return '/recruiter'
  if (role === 'admin') return '/admin'
  return '/seeker'
}

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    company: '',
    role: 'jobseeker',
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const validate = () => {
    const errors = {}
    if (!form.username) errors.username = 'Username is required'
    else if (form.username.length < 3) errors.username = 'Username must be at least 3 characters'
    if (!form.email) errors.email = 'Email is required'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email address'
    if (!form.first_name) errors.first_name = 'First name is required'
    if (!form.last_name) errors.last_name = 'Last name is required'
    if (!form.password) errors.password = 'Password is required'
    else if (form.password.length < 8) errors.password = 'Password must be at least 8 characters'
    if (form.password !== form.confirm_password) errors.confirm_password = 'Passwords do not match'
    if (form.role === 'recruiter' && !form.company) errors.company = 'Company name is required for recruiters'
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setLoading(true)
    try {
      const user = await register(form)
      navigate(getDashboardPath(user.role))
    } catch (err) {
      const data = err?.response?.data || {}
      const fieldErr = {}
      Object.entries(data).forEach(([k, v]) => {
        if (k !== 'detail' && k !== 'non_field_errors') {
          fieldErr[k] = Array.isArray(v) ? v.join(', ') : v
        }
      })
      if (Object.keys(fieldErr).length > 0) setFieldErrors(fieldErr)
      setError(getApiError(err, 'Registration failed. Please check your details.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container register-page">
      <style>{`
        .register-page { position: relative; min-height: 100vh; display: grid; place-items: center; overflow: hidden; padding: 34px 18px; background: radial-gradient(ellipse at 12% 10%,rgba(124,92,246,.15),transparent 42%),radial-gradient(ellipse at 90% 90%,rgba(79,70,229,.12),transparent 44%); }
        .register-page::before,.register-page::after { content: ''; position: absolute; border: 1px solid rgba(167,139,250,.1); border-radius: 50%; pointer-events: none; }
        .register-page::before { width: 430px; height: 430px; top: -260px; right: -120px; }
        .register-page::after { width: 540px; height: 540px; bottom: -360px; left: -190px; }
        .register-page .auth-card { position: relative; z-index: 1; width: min(100%,560px); padding: 30px; border: 1px solid var(--border-color,rgba(151,130,220,.2)); border-radius: 21px; background: var(--card-bg,rgba(255,255,255,.04)); box-shadow: 0 24px 75px rgba(10,7,30,.22); animation: registerEnter .45s ease both; }
        @keyframes registerEnter { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .register-page .auth-logo { display: flex; justify-content: center; margin-bottom: 17px; }
        .register-page .auth-title { margin: 0; text-align: center; font-size: 24px; font-weight: 800; letter-spacing: -.045em; }
        .register-page .auth-subtitle { margin: 7px 0 22px; color: var(--text-muted,#9692a8); text-align: center; font-size: 11px; line-height: 1.6; }
        .register-page .form-group { margin-bottom: 13px; min-width: 0; }
        .register-page .form-label { display: block; margin-bottom: 6px; font-size: 10px; font-weight: 700; }
        .register-page .input-icon-wrap { position: relative; }
        .register-page .input-icon-wrap > svg { position: absolute; z-index: 1; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted,#9692a8); pointer-events: none; }
        .register-page .input-icon-wrap .form-control { min-height: 42px; padding-left: 38px; border-radius: 10px; }
        .register-page .role-select { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 10px; }
        .register-page .role-option { display: flex; align-items: center; gap: 11px; min-width: 0; padding: 13px; border: 1px solid var(--border-color,rgba(151,130,220,.2)); border-radius: 12px; color: inherit; background: rgba(139,92,246,.025); text-align: left; cursor: pointer; transition: border-color .18s ease,background .18s ease,transform .18s ease; }
        .register-page .role-option:hover { transform: translateY(-1px); border-color: rgba(167,139,250,.45); }
        .register-page .role-option.selected { border-color: rgba(167,139,250,.72); background: rgba(139,92,246,.13); box-shadow: inset 0 0 0 1px rgba(167,139,250,.12); }
        .register-page .role-option > svg { flex: 0 0 auto; color: #bda8ff; }
        .register-page .role-name { font-size: 11px; font-weight: 750; }
        .register-page .role-description { margin-top: 4px; color: var(--text-muted,#9692a8); font-size: 9px; line-height: 1.4; }
        .register-page .register-submit { min-height: 44px; margin-top: 4px; border-radius: 10px; }
        .register-page .register-footer { margin-top: 18px; padding-top: 15px; border-top: 1px solid var(--border-color,rgba(151,130,220,.14)); text-align: center; color: var(--text-muted,#9692a8); font-size: 10px; }
        .register-page .register-footer a { color: #bda8ff; font-weight: 700; text-decoration: none; }
        .register-page .register-footer a:hover { text-decoration: underline; }
        .register-page .register-alert { display: flex; align-items: flex-start; gap: 9px; margin-bottom: 15px; padding: 10px 12px; border-radius: 10px; font-size: 11px; line-height: 1.5; }
        .register-page .register-alert svg { flex: 0 0 auto; margin-top: 1px; }
        @media (max-width: 540px) { .register-page .auth-card { padding: 24px 18px; } .register-page .role-select { grid-template-columns: 1fr; } }
        @media (prefers-reduced-motion: reduce) { .register-page .auth-card,.register-page .role-option { animation: none; transition: none; } }
      `}</style>

      <div className="auth-card">
        <div className="auth-logo"><Logo size={40} /></div>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Join AI-JobPortal and access AI-powered recruitment tools.</p>

        {error && (
          <div className="alert alert-error register-alert">
            <AlertIcon size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Account Type</label>
            <div className="role-select">
              <button
                type="button"
                aria-pressed={form.role === 'jobseeker'}
                className={`role-option ${form.role === 'jobseeker' ? 'selected' : ''}`}
                onClick={() => setForm({ ...form, role: 'jobseeker' })}
              >
                <SeekIcon size={21} />
                <div>
                  <div className="role-name">Job Seeker</div>
                  <div className="role-description">Find jobs and AI recommendations</div>
                </div>
              </button>
              <button
                type="button"
                aria-pressed={form.role === 'recruiter'}
                className={`role-option ${form.role === 'recruiter' ? 'selected' : ''}`}
                onClick={() => setForm({ ...form, role: 'recruiter' })}
              >
                <BriefcaseIcon size={21} />
                <div>
                  <div className="role-name">Recruiter</div>
                  <div className="role-description">Post jobs and screen candidates</div>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="register-first-name">First Name</label>
              <div className="input-icon-wrap">
                <UserIcon size={16} />
                <input id="register-first-name" type="text" name="first_name" className="form-control" placeholder="First name" value={form.first_name} onChange={handleChange} />
              </div>
              {fieldErrors.first_name && <div className="form-error">{fieldErrors.first_name}</div>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="register-last-name">Last Name</label>
              <input id="register-last-name" type="text" name="last_name" className="form-control" placeholder="Last name" value={form.last_name} onChange={handleChange} />
              {fieldErrors.last_name && <div className="form-error">{fieldErrors.last_name}</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-username">Username</label>
            <div className="input-icon-wrap">
              <UserIcon size={16} />
              <input id="register-username" type="text" name="username" className="form-control" placeholder="Choose a username" value={form.username} onChange={handleChange} autoComplete="username" />
            </div>
            {fieldErrors.username && <div className="form-error">{fieldErrors.username}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-email">Email</label>
            <div className="input-icon-wrap">
              <MailIcon size={16} />
              <input id="register-email" type="email" name="email" className="form-control" placeholder="you@example.com" value={form.email} onChange={handleChange} autoComplete="email" />
            </div>
            {fieldErrors.email && <div className="form-error">{fieldErrors.email}</div>}
          </div>

          {form.role === 'recruiter' && (
            <div className="form-group">
              <label className="form-label" htmlFor="register-company">Company</label>
              <div className="input-icon-wrap">
                <BriefcaseIcon size={16} />
                <input id="register-company" type="text" name="company" className="form-control" placeholder="Company name" value={form.company} onChange={handleChange} />
              </div>
              {fieldErrors.company && <div className="form-error">{fieldErrors.company}</div>}
            </div>
          )}

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="register-password">Password</label>
              <div className="input-icon-wrap">
                <LockIcon size={16} />
                <input id="register-password" type="password" name="password" className="form-control" placeholder="Min 8 characters" value={form.password} onChange={handleChange} autoComplete="new-password" />
              </div>
              {fieldErrors.password && <div className="form-error">{fieldErrors.password}</div>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="register-confirm-password">Confirm Password</label>
              <div className="input-icon-wrap">
                <LockIcon size={16} />
                <input id="register-confirm-password" type="password" name="confirm_password" className="form-control" placeholder="Re-enter password" value={form.confirm_password} onChange={handleChange} autoComplete="new-password" />
              </div>
              {fieldErrors.confirm_password && <div className="form-error">{fieldErrors.confirm_password}</div>}
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-block register-submit" disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="register-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
