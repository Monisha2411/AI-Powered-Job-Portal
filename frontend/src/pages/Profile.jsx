import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api/auth'
import LoadingState from '../components/ui/LoadingState'
import Badge from '../components/ui/Badge'
import {
  UserIcon, MailIcon, PhoneIcon, BriefcaseIcon, UploadIcon, AlertIcon,
} from '../components/Icons'
import { formatDate, getApiError } from '../utils/helpers'

const roleLabel = { admin: 'Admin', recruiter: 'Recruiter', jobseeker: 'Job Seeker' }

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    company: '',
  })
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [pwdForm, setPwdForm] = useState({
    old_password: '', new_password: '', confirm_password: '',
  })
  const [pwdErrors, setPwdErrors] = useState({})
  const [pwdSaving, setPwdSaving] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  useEffect(() => {
    if (!success) return
    const timer = setTimeout(() => setSuccess(''), 3000)
    return () => clearTimeout(timer)
  }, [success])

  useEffect(() => {
    authApi
      .getProfile()
      .then((res) => {
        setProfile(res.data)
        setForm({
          first_name: res.data.first_name || '',
          last_name: res.data.last_name || '',
          email: res.data.email || '',
          phone_number: res.data.phone_number || '',
          company: res.data.company || '',
        })
      })
      .catch((err) => setError(getApiError(err, 'Failed to load profile.')))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const removePhotoPreview = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhoto(null)
    setPhotoPreview('')
  }

  const validate = () => {
    const errors = {}
    if (!form.first_name.trim()) errors.first_name = 'First name is required'
    else if (!/^[A-Za-z\s'-]+$/.test(form.first_name)) errors.first_name = 'First name must contain only letters'
    if (!form.last_name.trim()) errors.last_name = 'Last name is required'
    else if (!/^[A-Za-z\s'-]+$/.test(form.last_name)) errors.last_name = 'Last name must contain only letters'
    if (!form.email.trim()) errors.email = 'Email is required'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email address'
    if (form.phone_number && !/^\d{10}$/.test(form.phone_number)) errors.phone_number = 'Phone number must be exactly 10 digits'
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setFieldErrors({})
    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    const data = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      if (value !== undefined) data.append(key, value)
    })
    if (photo) data.append('profile_photo', photo)

    setSaving(true)
    try {
      const res = await authApi.updateProfile(data)
      setProfile(res.data)
      setForm({
        first_name: res.data.first_name || '',
        last_name: res.data.last_name || '',
        email: res.data.email || '',
        phone_number: res.data.phone_number || '',
        company: res.data.company || '',
      })
      removePhotoPreview()
      updateUser(res.data)
      setSuccess('Profile updated successfully.')
    } catch (err) {
      const responseData = err?.response?.data || {}
      const fieldErr = {}
      Object.entries(responseData).forEach(([key, value]) => {
        if (key !== 'detail' && key !== 'non_field_errors') {
          fieldErr[key] = Array.isArray(value) ? value.join(', ') : value
        }
      })
      if (Object.keys(fieldErr).length > 0) setFieldErrors(fieldErr)
      setError(getApiError(err, 'Failed to update profile.'))
    } finally {
      setSaving(false)
    }
  }

  const handlePwdChange = (e) => {
    setPwdForm({ ...pwdForm, [e.target.name]: e.target.value })
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setError('')
    setPwdErrors({})
    setSuccess('')
    if (pwdForm.new_password !== pwdForm.confirm_password) {
      setPwdErrors({ confirm_password: 'Passwords do not match.' })
      return
    }
    setPwdSaving(true)
    try {
      await authApi.changePassword(pwdForm)
      setPwdForm({ old_password: '', new_password: '', confirm_password: '' })
      setShowPwd(false)
      setSuccess('Password changed successfully.')
    } catch (err) {
      const responseData = err?.response?.data || {}
      const fieldErr = {}
      Object.entries(responseData).forEach(([key, value]) => {
        if (key !== 'detail' && key !== 'non_field_errors') {
          fieldErr[key] = Array.isArray(value) ? value.join(', ') : value
        }
      })
      if (Object.keys(fieldErr).length > 0) setPwdErrors(fieldErr)
      setError(getApiError(err, 'Failed to change password.'))
    } finally {
      setPwdSaving(false)
    }
  }

  if (loading) return <LoadingState message="Loading your profile..." />

  const photoUrl = photoPreview || profile?.profile_photo
  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || profile?.username || user?.username || 'Your profile'

  return (
    <div className="profile-page">
      <style>{`
        .profile-page { max-width: 980px; margin: 0 auto; animation: profileEnter .4s ease both; }
        @keyframes profileEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .profile-page .topbar { margin-bottom: 20px; }
        .profile-page .page-title { letter-spacing: -.035em; }
        .profile-page .page-subtitle { margin-top: 6px; }
        .profile-page .profile-hero { display: flex; align-items: center; gap: 16px; padding: 20px; margin-bottom: 17px; border: 1px solid var(--border-color,rgba(151,130,220,.18)); border-radius: 17px; background: linear-gradient(115deg,rgba(139,92,246,.13),rgba(99,102,241,.035)); }
        .profile-page .profile-avatar { width: 66px; height: 66px; flex: 0 0 66px; border-radius: 18px; object-fit: cover; border: 2px solid rgba(167,139,250,.35); }
        .profile-page .profile-avatar-fallback { display: grid; place-items: center; color: #d6caff; background: rgba(139,92,246,.2); font-size: 23px; font-weight: 800; }
        .profile-page .profile-hero-name { font-size: 17px; font-weight: 750; }
        .profile-page .profile-hero-meta { margin-top: 5px; color: var(--text-muted,#9692a8); font-size: 11px; }
        .profile-page .profile-layout { display: grid; grid-template-columns: minmax(0,1fr) minmax(260px,.72fr); gap: 16px; align-items: start; }
        .profile-page .profile-main,.profile-page .profile-side { display: flex; flex-direction: column; gap: 15px; min-width: 0; }
        .profile-page .profile-card { padding: 19px; border: 1px solid var(--border-color,rgba(151,130,220,.17)); border-radius: 16px; background: var(--card-bg,rgba(255,255,255,.025)); }
        .profile-page .section-heading { display: flex; align-items: center; gap: 9px; margin-bottom: 16px; }
        .profile-page .section-icon { width: 31px; height: 31px; display: grid; place-items: center; border-radius: 9px; color: #c4b5fd; background: rgba(139,92,246,.14); }
        .profile-page .section-title { margin: 0; font-size: 13px; font-weight: 750; }
        .profile-page .section-subtitle { margin-top: 3px; color: var(--text-muted,#9692a8); font-size: 10px; }
        .profile-page .photo-row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .profile-page .photo-preview { width: 62px; height: 62px; border-radius: 16px; object-fit: cover; border: 1px solid var(--border-color,rgba(151,130,220,.2)); }
        .profile-page .photo-placeholder { display: grid; place-items: center; color: #d6caff; background: rgba(139,92,246,.16); font-size: 20px; font-weight: 750; }
        .profile-page .photo-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .profile-page .form-group { margin-bottom: 13px; }
        .profile-page .form-group:last-child { margin-bottom: 0; }
        .profile-page .input-icon-wrap { position: relative; }
        .profile-page .input-icon-wrap > svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted,#9692a8); pointer-events: none; }
        .profile-page .input-icon-wrap .form-control { padding-left: 38px; }
        .profile-page .account-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 10px; }
        .profile-page .account-item { min-width: 0; padding: 11px 12px; border-radius: 11px; background: rgba(139,92,246,.055); }
        .profile-page .account-label { color: var(--text-muted,#9692a8); font-size: 10px; margin-bottom: 5px; }
        .profile-page .account-value { overflow-wrap: anywhere; font-size: 11px; font-weight: 650; }
        .profile-page .form-actions { display: flex; justify-content: flex-end; gap: 9px; padding-top: 14px; }
        .profile-page .security-toggle { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 0; border: 0; background: transparent; color: inherit; text-align: left; cursor: pointer; }
        .profile-page .security-fields { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
        .profile-page .security-fields .form-group { margin: 0; }
        .profile-page .profile-alert { display: flex; align-items: flex-start; gap: 9px; padding: 12px 14px; border-radius: 11px; font-size: 12px; line-height: 1.5; margin-bottom: 14px; }
        .profile-page .profile-alert-error { color: var(--danger,#f87171); background: rgba(239,68,68,.09); border: 1px solid rgba(239,68,68,.18); }
        .profile-page .profile-alert-success { color: var(--success,#4ade80); background: rgba(34,197,94,.09); border: 1px solid rgba(34,197,94,.18); }
        .profile-page .role-chip { margin-top: 8px; }
        @media (max-width: 760px) { .profile-page .profile-layout { grid-template-columns: 1fr; } }
        @media (max-width: 520px) {
          .profile-page .profile-card { padding: 15px; }
          .profile-page .profile-hero { padding: 15px; }
          .profile-page .account-grid { grid-template-columns: 1fr; }
          .profile-page .form-actions { flex-direction: column-reverse; }
          .profile-page .form-actions .btn { width: 100%; justify-content: center; }
        }
        @media (prefers-reduced-motion: reduce) { .profile-page,.profile-page * { animation: none !important; transition: none !important; } }
      `}</style>

      <div className="topbar">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your personal information and account security.</p>
        </div>
      </div>

      {error && <div className="profile-alert profile-alert-error"><AlertIcon size={16} /> <span>{error}</span></div>}
      {success && <div className="profile-alert profile-alert-success">{success}</div>}

      <div className="profile-hero">
        {photoUrl ? (
          <img src={photoUrl} alt="Profile" className="profile-avatar" />
        ) : (
          <span className="profile-avatar profile-avatar-fallback">{displayName.charAt(0).toUpperCase()}</span>
        )}
        <div>
          <div className="profile-hero-name">{displayName}</div>
          <div className="profile-hero-meta">{profile?.email || user?.email || 'Account profile'}</div>
          <div className="role-chip"><Badge color="primary">{roleLabel[profile?.role] || profile?.role || 'Member'}</Badge></div>
        </div>
      </div>

      <div className="profile-layout">
        <form className="profile-main" onSubmit={handleSubmit}>
          <section className="profile-card">
            <div className="section-heading">
              <span className="section-icon"><UploadIcon size={16} /></span>
              <div><h3 className="section-title">Profile Photo</h3><div className="section-subtitle">Add a photo to identify your account.</div></div>
            </div>
            <div className="photo-row">
              {photoUrl ? (
                <img src={photoUrl} alt="Profile preview" className="photo-preview" />
              ) : (
                <span className="photo-preview photo-placeholder">{displayName.charAt(0).toUpperCase()}</span>
              )}
              <div>
                <div className="photo-actions">
                  <label className="btn btn-secondary btn-sm" style={{ display: 'inline-flex' }}>
                    <UploadIcon size={14} /> Choose Photo
                    <input type="file" accept="image/*" hidden onChange={handlePhoto} />
                  </label>
                  {photoPreview && <button type="button" className="btn btn-ghost btn-sm" onClick={removePhotoPreview}>Remove</button>}
                </div>
                <div className="form-hint">JPG, PNG or GIF. Optional.</div>
              </div>
            </div>
          </section>

          <section className="profile-card">
            <div className="section-heading">
              <span className="section-icon"><UserIcon size={16} /></span>
              <div><h3 className="section-title">Account Details</h3><div className="section-subtitle">Your account information.</div></div>
            </div>
            <div className="account-grid">
              <div className="account-item"><div className="account-label">Username</div><div className="account-value">{profile?.username || '-'}</div></div>
              <div className="account-item"><div className="account-label">Account type</div><div className="account-value">{roleLabel[profile?.role] || profile?.role || '-'}</div></div>
              <div className="account-item"><div className="account-label">Member since</div><div className="account-value">{formatDate(profile?.date_joined)}</div></div>
              <div className="account-item"><div className="account-label">Account status</div><div className="account-value">{profile?.is_active === false ? 'Inactive' : 'Active'}</div></div>
            </div>
          </section>

          <section className="profile-card">
            <div className="section-heading">
              <span className="section-icon"><UserIcon size={16} /></span>
              <div><h3 className="section-title">Personal Information</h3><div className="section-subtitle">Keep your contact details up to date.</div></div>
            </div>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="profile-first-name">First Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                <div className="input-icon-wrap"><UserIcon size={16} /><input id="profile-first-name" type="text" name="first_name" className="form-control" placeholder="First name" value={form.first_name} onChange={handleChange} /></div>
                {fieldErrors.first_name && <div className="form-error">{fieldErrors.first_name}</div>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="profile-last-name">Last Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input id="profile-last-name" type="text" name="last_name" className="form-control" placeholder="Last name" value={form.last_name} onChange={handleChange} />
                {fieldErrors.last_name && <div className="form-error">{fieldErrors.last_name}</div>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="profile-email">Email <span style={{ color: 'var(--danger)' }}>*</span></label>
              <div className="input-icon-wrap"><MailIcon size={16} /><input id="profile-email" type="email" name="email" className="form-control" placeholder="you@example.com" value={form.email} onChange={handleChange} autoComplete="email" /></div>
              {fieldErrors.email && <div className="form-error">{fieldErrors.email}</div>}
            </div>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="profile-phone">Phone Number</label>
                <div className="input-icon-wrap"><PhoneIcon size={16} /><input id="profile-phone" type="tel" name="phone_number" className="form-control" placeholder="10 digit phone number" value={form.phone_number} onChange={handleChange} /></div>
                {fieldErrors.phone_number && <div className="form-error">{fieldErrors.phone_number}</div>}
              </div>
              {(profile?.role === 'recruiter' || profile?.is_superuser) && (
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-company">Company</label>
                  <div className="input-icon-wrap"><BriefcaseIcon size={16} /><input id="profile-company" type="text" name="company" className="form-control" placeholder="Company name" value={form.company} onChange={handleChange} /></div>
                  {fieldErrors.company && <div className="form-error">{fieldErrors.company}</div>}
                </div>
              )}
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => window.history.back()}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving && <span className="spinner" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </section>
        </form>

        <aside className="profile-side">
          <section className="profile-card">
            <div className="section-heading">
              <span className="section-icon"><BriefcaseIcon size={16} /></span>
              <div><h3 className="section-title">Security</h3><div className="section-subtitle">Update your account password.</div></div>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setShowPwd(!showPwd); setPwdErrors({}) }}>
              {showPwd ? 'Cancel password change' : 'Change Password'}
            </button>
            {showPwd && (
              <form onSubmit={handleChangePassword} className="security-fields">
                <div className="form-group">
                  <label className="form-label" htmlFor="old-password">Current Password</label>
                  <input id="old-password" type="password" name="old_password" className="form-control" placeholder="Enter current password" value={pwdForm.old_password} onChange={handlePwdChange} autoComplete="current-password" />
                  {pwdErrors.old_password && <div className="form-error">{pwdErrors.old_password}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-password">New Password</label>
                  <input id="new-password" type="password" name="new_password" className="form-control" placeholder="At least 8 characters" value={pwdForm.new_password} onChange={handlePwdChange} autoComplete="new-password" />
                  {pwdErrors.new_password && <div className="form-error">{pwdErrors.new_password}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="confirm-password">Confirm New Password</label>
                  <input id="confirm-password" type="password" name="confirm_password" className="form-control" placeholder="Re-enter new password" value={pwdForm.confirm_password} onChange={handlePwdChange} autoComplete="new-password" />
                  {pwdErrors.confirm_password && <div className="form-error">{pwdErrors.confirm_password}</div>}
                </div>
                <button type="submit" className="btn btn-primary" disabled={pwdSaving}>
                  {pwdSaving && <span className="spinner" />}
                  {pwdSaving ? 'Changing...' : 'Update Password'}
                </button>
              </form>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
