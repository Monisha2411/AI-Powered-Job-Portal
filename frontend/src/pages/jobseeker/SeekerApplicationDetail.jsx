import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { applicationsApi } from '../../api/applications'
import { jobsApi } from '../../api/jobs'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import Badge from '../../components/ui/Badge'
import MatchScore from '../../components/ui/MatchScore'
import { XIcon, LocationIcon } from '../../components/Icons'
import {
  formatDate, formatSalary, jobTypeLabel, experienceLevelLabel, applicationStatusLabel, getApiError,
} from '../../utils/helpers'

const statusBadgeMap = {
  submitted: 'info',
  under_review: 'warning',
  interview: 'primary',
  offer: 'success',
  hired: 'success',
  rejected: 'danger',
  withdrawn: 'secondary',
}

export default function SeekerApplicationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [application, setApplication] = useState(null)
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(false)

  const fetchDetail = useCallback(() => {
    setLoading(true)
    setError('')
    applicationsApi
      .get(id)
      .then((res) => {
        setApplication(res.data)
        const jobId = res.data?.job
        if (jobId) {
          return jobsApi.get(jobId).then((jres) => setJob(jres.data))
        }
        setJob(null)
        return null
      })
      .catch(() => setError('Failed to load application details.'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { fetchDetail() }, [fetchDetail])

  const handleCancel = async () => {
    if (!window.confirm('Cancel this application? Your application will be withdrawn.')) return
    setCancelling(true)
    try {
      const res = await applicationsApi.withdraw(id)
      setApplication(res.data)
      alert('Application cancelled.')
    } catch (err) {
      alert(getApiError(err, 'Failed to cancel application.'))
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <LoadingState message="Loading application details..." />
  if (error) return <ErrorState message={error} onRetry={fetchDetail} />
  if (!application) return <ErrorState message="Application not found." onRetry={fetchDetail} />

  const jobTitle = job?.title || application.external_job_title || application.job_title || 'External job'
  const company = job?.company || application.external_company || application.job_company || 'Company not specified'
  const location = job?.location || application.external_location || ''
  const externalJobUrl = application.external_job_url
  const isExternalApplication = !application.job && Boolean(externalJobUrl)
  const isWithdrawn = application.status === 'withdrawn'

  return (
    <div className="application-detail-page">
      <style>{`
        .application-detail-page { width:100%; animation:detailEnter .42s ease both; }
        @keyframes detailEnter { from { opacity:0; transform:translateY(9px); } to { opacity:1; transform:translateY(0); } }
        .application-detail-page .detail-heading { margin-bottom:22px; }
        .application-detail-page .detail-back { margin-bottom:13px; border-radius:9px; }
        .application-detail-page .detail-back:hover { transform:translateX(-2px); }
        .application-detail-page .detail-heading .page-title { margin:0; }
        .application-detail-page .detail-heading .page-subtitle { margin:6px 0 0; }
        .application-detail-page .detail-shell { display:grid; grid-template-columns:minmax(0,1fr); gap:18px; }
        .application-detail-page .detail-main-card { min-width:0; padding:clamp(18px,3vw,30px); border:1px solid var(--border); border-radius:18px; background:var(--card-bg); box-shadow:var(--shadow-sm,0 5px 18px rgba(10,8,30,.05)); }
        .application-detail-page .detail-company-row { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; padding-bottom:20px; border-bottom:1px solid var(--border); }
        .application-detail-page .detail-job-title { margin:0; color:var(--text-primary); font-size:clamp(20px,3vw,27px); line-height:1.25; font-weight:750; letter-spacing:-.025em; }
        .application-detail-page .detail-company { margin:7px 0 0; color:var(--primary); font-size:15px; font-weight:650; }
        .application-detail-page .detail-location { display:flex; align-items:center; gap:6px; margin-top:9px; color:var(--text-muted); font-size:12px; }
        .application-detail-page .detail-meta { display:flex; flex-wrap:wrap; gap:8px; margin:18px 0 22px; }
        .application-detail-page .detail-match { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:22px; padding:15px 17px; border:1px solid var(--border); border-radius:13px; background:var(--surface,rgba(125,105,190,.055)); }
        .application-detail-page .detail-match-label { color:var(--text-primary); font-size:13px; font-weight:700; }
        .application-detail-page .detail-section { margin-top:22px; }
        .application-detail-page .detail-section h2 { margin:0 0 10px; color:var(--text-primary); font-size:14px; font-weight:750; }
        .application-detail-page .detail-copy { margin:0; color:var(--text-secondary); font-size:13px; line-height:1.8; white-space:pre-wrap; }
        .application-detail-page .detail-list { margin:0; padding-left:20px; color:var(--text-secondary); font-size:13px; line-height:1.9; }
        .application-detail-page .detail-skills { display:flex; flex-wrap:wrap; gap:8px; }
        .application-detail-page .detail-external { margin-top:22px; padding:17px; border:1px solid var(--border); border-radius:13px; background:var(--surface,rgba(125,105,190,.045)); }
        .application-detail-page .detail-external h2 { margin:0 0 7px; color:var(--text-primary); font-size:14px; }
        .application-detail-page .detail-external p { margin:0 0 13px; color:var(--text-muted); font-size:12px; line-height:1.7; }
        .application-detail-page .detail-cover { padding:16px 18px; border-left:3px solid var(--primary); border-radius:0 10px 10px 0; background:var(--surface,rgba(125,105,190,.045)); }
        .application-detail-page .detail-timestamp { margin:22px 0 0; color:var(--text-muted); font-size:11px; line-height:1.7; }
        .application-detail-page .detail-footer { display:flex; justify-content:flex-end; align-items:center; flex-wrap:wrap; gap:9px; margin-top:20px; padding-top:18px; border-top:1px solid var(--border); }
        .application-detail-page .detail-footer .btn { display:inline-flex; align-items:center; justify-content:center; gap:7px; border-radius:9px; }
        .application-detail-page .detail-withdrawn { margin-right:auto; color:var(--text-muted); font-size:12px; }
        @media(max-width:560px) {
          .application-detail-page .detail-main-card { padding:17px; border-radius:14px; }
          .application-detail-page .detail-footer { justify-content:stretch; }
          .application-detail-page .detail-footer .btn { flex:1; }
          .application-detail-page .detail-withdrawn { flex-basis:100%; }
        }
        @media(prefers-reduced-motion:reduce) {
          .application-detail-page, .application-detail-page * { animation:none !important; transition:none !important; }
        }
      `}</style>

      <div className="topbar detail-heading">
        <div>
          <button className="btn btn-outline btn-sm detail-back" onClick={() => navigate('/seeker/applications')}>
            &larr; Back to Applications
          </button>
          <h1 className="page-title">{jobTitle}</h1>
          <p className="page-subtitle">{company}</p>
        </div>
      </div>

      <div className="detail-shell">
        <section className="detail-main-card">
          <div className="detail-company-row">
            <div>
              <h2 className="detail-job-title">{jobTitle}</h2>
              <p className="detail-company">{company}</p>
              {location && (
                <div className="detail-location">
                  <LocationIcon size={14} />
                  <span>{location}</span>
                </div>
              )}
            </div>
          </div>

          <div className="detail-meta">
            {job && <Badge color="secondary">{jobTypeLabel[job.job_type] || job.job_type}</Badge>}
            {job && <Badge color="secondary">{experienceLevelLabel[job.experience_level] || job.experience_level}</Badge>}
            {job && <Badge color="primary">{formatSalary(job.salary_min, job.salary_max)}</Badge>}
            {isExternalApplication && <Badge color="secondary">Adzuna External Job</Badge>}
            <Badge color="info">Applied {formatDate(application.created_at)}</Badge>
            <Badge color={statusBadgeMap[application.status] || 'secondary'}>
              {applicationStatusLabel[application.status] || application.status}
            </Badge>
          </div>

          {application.match_score != null && (
            <div className="detail-match">
              <span className="detail-match-label">AI Match Score</span>
              <MatchScore score={application.match_score} showLabel={false} />
            </div>
          )}

          {job && (
            <>
              <section className="detail-section">
                <h2>Job description</h2>
                <p className="detail-copy">{job.description || 'No description provided.'}</p>
              </section>

              {job.requirements?.length > 0 && (
                <section className="detail-section">
                  <h2>Requirements</h2>
                  <ul className="detail-list">
                    {job.requirements.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </section>
              )}

              {job.responsibilities?.length > 0 && (
                <section className="detail-section">
                  <h2>Responsibilities</h2>
                  <ul className="detail-list">
                    {job.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </section>
              )}

              {job.skills_required?.length > 0 && (
                <section className="detail-section">
                  <h2>Skills required</h2>
                  <div className="detail-skills">
                    {job.skills_required.map((s, i) => (
                      <span key={i} className="skill-chip neutral">{s}</span>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {isExternalApplication && (
            <section className="detail-external">
              <h2>External job listing</h2>
              <p>
                This application record tracks your confirmation. The employer's application is managed on the external site.
              </p>
              <a href={externalJobUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                Open original Adzuna listing
              </a>
            </section>
          )}

          {application.cover_letter && (
            <section className="detail-section">
              <h2>Your cover letter</h2>
              <div className="detail-cover">
                <p className="detail-copy">{application.cover_letter}</p>
              </div>
            </section>
          )}

          <p className="detail-timestamp">
            {job ? `Posted ${formatDate(job.created_at)} · ` : ''}
            Applied {formatDate(application.created_at)}
          </p>

          <div className="detail-footer">
            {isWithdrawn ? (
              <>
                <span className="detail-withdrawn">This application has been withdrawn.</span>
                <Link to="/seeker/jobs" className="btn btn-primary">Browse Jobs</Link>
              </>
            ) : (
              <>
                <button className="btn btn-secondary" onClick={() => navigate('/seeker/applications')}>Back</button>
                <button className="btn btn-danger" onClick={handleCancel} disabled={cancelling}>
                  {cancelling ? <span className="spinner" /> : <XIcon size={15} />}
                  {cancelling ? 'Cancelling...' : 'Cancel Application'}
                </button>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}



