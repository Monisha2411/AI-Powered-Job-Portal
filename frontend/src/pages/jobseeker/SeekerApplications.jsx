import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { applicationsApi } from '../../api/applications'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'
import MatchScore from '../../components/ui/MatchScore'
import {
  SendIcon, EyeIcon, XIcon, TrashIcon,
} from '../../components/Icons'
import { formatDateTime, applicationStatusLabel, getApiError } from '../../utils/helpers'

const statusBadgeMap = {
  submitted: 'info',
  under_review: 'warning',
  interview: 'primary',
  offer: 'success',
  hired: 'success',
  rejected: 'danger',
  withdrawn: 'secondary',
}

export default function SeekerApplications() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancellingId, setCancellingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const fetchApplications = useCallback(() => {
    setLoading(true)
    setError('')
    applicationsApi
      .myApplications()
      .then((res) => setApplications(res.data))
      .catch(() => setError('Failed to load your applications.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchApplications() }, [fetchApplications])

  const handleCancel = async (app) => {
    if (!window.confirm(`Cancel your application for "${app.job_title}"? Your application will be withdrawn.`)) return
    setCancellingId(app.id)
    try {
      await applicationsApi.withdraw(app.id)
      setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, status: 'withdrawn' } : a)))
      alert('Application cancelled.')
    } catch (err) {
      alert(getApiError(err, 'Failed to cancel application.'))
    } finally {
      setCancellingId(null)
    }
  }

  const handleDelete = async (app) => {
    if (!window.confirm(`Delete your application for "${app.job_title}"? This action cannot be undone.`)) return
    setDeletingId(app.id)
    try {
      await applicationsApi.delete(app.id)
      setApplications((prev) => prev.filter((a) => a.id !== app.id))
      alert('Application deleted.')
    } catch (err) {
      alert(getApiError(err, 'Failed to delete application.'))
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return <LoadingState message="Loading your applications..." />
  if (error) return <ErrorState message={error} onRetry={fetchApplications} />

  const activeCount = applications.filter((a) => !['withdrawn', 'rejected', 'hired'].includes(a.status)).length
  const interviewCount = applications.filter((a) => a.status === 'interview').length
  const offerCount = applications.filter((a) => ['offer', 'hired'].includes(a.status)).length

  return (
    <div className="applications-page">
      <style>{`
        .applications-page { width: 100%; animation: appPageIn .45s ease both; }
        @keyframes appPageIn { from { opacity: 0; transform: translateY(9px); } to { opacity: 1; transform: translateY(0); } }
        .applications-page .applications-heading { display:flex; justify-content:space-between; align-items:flex-end; gap:20px; margin-bottom:24px; }
        .applications-page .applications-heading h1 { margin:0; }
        .applications-page .applications-heading p { margin:7px 0 0; }
        .applications-page .application-summary { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; margin-bottom:22px; }
        .applications-page .summary-tile { position:relative; overflow:hidden; padding:18px 20px; border:1px solid var(--border); border-radius:16px; background:var(--card-bg); box-shadow:var(--shadow-sm, 0 5px 18px rgba(10,8,30,.05)); transition:transform .22s ease,border-color .22s ease,box-shadow .22s ease; }
        .applications-page .summary-tile:hover { transform:translateY(-3px); border-color:var(--primary); box-shadow:var(--shadow-md, 0 10px 28px rgba(10,8,30,.09)); }
        .applications-page .summary-tile:after { content:""; position:absolute; width:90px; height:90px; right:-35px; top:-42px; border-radius:50%; background:var(--primary); opacity:.07; }
        .applications-page .summary-label { color:var(--text-muted); font-size:12px; font-weight:600; letter-spacing:.04em; text-transform:uppercase; }
        .applications-page .summary-value { display:block; margin-top:8px; color:var(--text-primary); font-size:27px; line-height:1; font-weight:750; font-variant-numeric:tabular-nums; }
        .applications-page .applications-card { overflow:hidden; border:1px solid var(--border); border-radius:17px; background:var(--card-bg); box-shadow:var(--shadow-sm, 0 5px 18px rgba(10,8,30,.05)); }
        .applications-page .applications-card-head { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:19px 22px; border-bottom:1px solid var(--border); }
        .applications-page .applications-card-head h2 { margin:0; color:var(--text-primary); font-size:15px; font-weight:700; }
        .applications-page .applications-card-head span { color:var(--text-muted); font-size:12px; }
        .applications-page .applications-table-wrap { width:100%; overflow-x:auto; }
        .applications-page .applications-table { width:100%; min-width:780px; border-collapse:separate; border-spacing:0; }
        .applications-page .applications-table thead th { padding:13px 17px; background:var(--surface, rgba(125,105,190,.055)); color:var(--text-muted); font-size:10px; font-weight:700; letter-spacing:.075em; text-align:left; text-transform:uppercase; white-space:nowrap; }
        .applications-page .applications-table tbody td { padding:16px 17px; border-top:1px solid var(--border); color:var(--text-secondary); font-size:13px; vertical-align:middle; }
        .applications-page .applications-table tbody tr { transition:background .18s ease; }
        .applications-page .applications-table tbody tr:hover { background:var(--surface, rgba(125,105,190,.045)); }
        .applications-page .application-job-title { display:block; max-width:230px; overflow:hidden; color:var(--text-primary); font-size:13px; font-weight:700; text-overflow:ellipsis; white-space:nowrap; }
        .applications-page .application-company { color:var(--text-secondary); font-weight:550; }
        .applications-page .application-closed { display:inline-block; margin-top:5px; color:var(--text-muted); font-size:10px; }
        .applications-page .application-date { color:var(--text-muted) !important; white-space:nowrap; }
        .applications-page .application-pending { color:var(--text-muted); font-size:11px; }
        .applications-page .application-actions { display:flex; align-items:center; gap:7px; white-space:nowrap; }
        .applications-page .application-actions .btn { display:inline-flex; align-items:center; justify-content:center; gap:5px; min-height:30px; border-radius:8px; font-size:11px; transition:transform .18s ease,box-shadow .18s ease; }
        .applications-page .application-actions .btn:hover { transform:translateY(-1px); }
        .applications-page .application-delete { width:30px; min-width:30px; height:30px; padding:0 !important; color:var(--danger) !important; }
        .applications-page .application-count { display:inline-flex; align-items:center; justify-content:center; min-width:25px; height:23px; padding:0 7px; border-radius:20px; background:var(--primary-soft, rgba(124,92,220,.12)); color:var(--primary); font-size:11px; font-weight:700; }
        @media(max-width:760px) {
          .applications-page .application-summary { gap:9px; }
          .applications-page .summary-tile { padding:15px 13px; }
          .applications-page .summary-value { font-size:23px; }
          .applications-page .applications-heading { align-items:flex-start; flex-direction:column; }
        }
        @media(max-width:430px) {
          .applications-page .application-summary { grid-template-columns:1fr; }
          .applications-page .summary-tile { display:flex; align-items:center; justify-content:space-between; }
          .applications-page .summary-value { margin:0; }
          .applications-page .applications-card-head { padding:16px; }
        }
        @media(prefers-reduced-motion:reduce) {
          .applications-page, .applications-page * { animation:none !important; transition:none !important; }
        }
      `}</style>

      <div className="topbar applications-heading">
        <div>
          <h1 className="page-title">My Applications</h1>
          <p className="page-subtitle">Track the status of your job applications</p>
        </div>
        <span className="application-count">{applications.length} total</span>
      </div>

      <div className="application-summary">
        <div className="summary-tile">
          <span className="summary-label">Active applications</span>
          <span className="summary-value">{activeCount}</span>
        </div>
        <div className="summary-tile">
          <span className="summary-label">Interviews</span>
          <span className="summary-value">{interviewCount}</span>
        </div>
        <div className="summary-tile">
          <span className="summary-label">Offers and hires</span>
          <span className="summary-value">{offerCount}</span>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={SendIcon}
            title="No applications yet"
            description="Browse jobs and apply to start tracking your applications here."
            action={<a href="/seeker/jobs" className="btn btn-primary">Browse Jobs</a>}
          />
        </div>
      ) : (
        <section className="applications-card">
          <div className="applications-card-head">
            <h2>Application history</h2>
            <span>Most recent applications first</span>
          </div>
          <div className="applications-table-wrap">
            <table className="table applications-table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Company</th>
                  <th>Applied</th>
                  <th>Status</th>
                  <th>AI Match</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => {
                  const isWithdrawn = a.status === 'withdrawn'
                  return (
                    <tr
                      key={a.id}
                      className="clickable-row"
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/seeker/applications/${a.id}`)}
                      title="View application details"
                    >
                      <td>
                        <span className="application-job-title">{a.job_title}</span>
                        {a.job_status === 'closed' && <span className="application-closed">Closed position</span>}
                      </td>
                      <td className="application-company">{a.job_company}</td>
                      <td className="application-date">{formatDateTime(a.created_at)}</td>
                      <td>
                        <Badge color={statusBadgeMap[a.status] || 'secondary'}>
                          {applicationStatusLabel[a.status] || a.status}
                        </Badge>
                      </td>
                      <td>
                        {a.match_score != null ? (
                          <MatchScore score={a.match_score} showLabel={false} />
                        ) : (
                          <span className="application-pending">Pending recruiter review</span>
                        )}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="application-actions">
                          <button className="btn btn-sm btn-outline" onClick={() => navigate(`/seeker/applications/${a.id}`)}>
                            <EyeIcon size={14} /> View
                          </button>
                          {!isWithdrawn && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleCancel(a)}
                              disabled={cancellingId === a.id}
                              title="Cancel application"
                            >
                              {cancellingId === a.id ? <span className="spinner" /> : <XIcon size={14} />}
                              {cancellingId === a.id ? '...' : 'Cancel'}
                            </button>
                          )}
                          {isWithdrawn && (
                            <button
                              className="btn btn-sm btn-outline application-delete"
                              onClick={() => handleDelete(a)}
                              disabled={deletingId === a.id}
                              title="Delete application"
                              aria-label="Delete application"
                            >
                              {deletingId === a.id ? <span className="spinner" /> : <TrashIcon size={14} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
