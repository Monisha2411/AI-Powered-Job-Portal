import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { matchingApi } from '../../api/matching'
import { applicationsApi } from '../../api/applications'
import { jobsApi } from '../../api/jobs'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'
import MatchScore from '../../components/ui/MatchScore'
import Modal from '../../components/ui/Modal'
import {
  UsersIcon, SparklesIcon, FilterIcon, CheckIcon, XIcon, DownloadIcon, TrashIcon,
} from '../../components/Icons'
import { formatDateTime, applicationStatusLabel, getApiError } from '../../utils/helpers'

const getApplicationId = (applicant) =>
  applicant?.application_id ??
  applicant?.id ??
  applicant?.pk ??
  applicant?.application?.id ??
  null

const statusOptions = ['submitted', 'under_review', 'interview', 'offer', 'hired', 'rejected', 'withdrawn']
const statusEditableOptions = ['submitted', 'under_review', 'interview', 'offer', 'hired', 'rejected']
const statusBadgeMap = {
  submitted: 'info',
  under_review: 'warning',
  interview: 'primary',
  offer: 'success',
  hired: 'success',
  rejected: 'danger',
  withdrawn: 'secondary',
}

export default function RecruiterApplicants() {
  const [searchParams] = useSearchParams()
  const [applicants, setApplicants] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [filters, setFilters] = useState({
    job: searchParams.get('job') || '',
    status: '',
    minScore: '',
  })
  const [order, setOrder] = useState('-match_score')

  const fetchJobs = useCallback(() => {
    jobsApi.list().then((res) => setJobs(res.data.results || res.data)).catch(() => {})
  }, [])

  const fetchApplicants = useCallback(() => {
    setLoading(true)
    setError('')
    const params = { ordering: order }
    if (filters.job) params.job = filters.job
    if (filters.status) params.status = filters.status
    if (filters.minScore) params.min_score = filters.minScore
    matchingApi
      .applicants(params)
      .then((res) => {
        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.results || res.data?.applications || []
        setApplicants(data.map((applicant) => ({
          ...applicant,
          application_id: getApplicationId(applicant),
        })))
      })
      .catch((err) => setError(getApiError(err, 'Failed to load applicants.')))
      .finally(() => setLoading(false))
  }, [filters, order])

  useEffect(() => { fetchJobs() }, [fetchJobs])
  useEffect(() => { fetchApplicants() }, [fetchApplicants])

  const handleAnalyze = async (id) => {
    if (!id) {
      alert('Application ID is missing. Please refresh the Applicants page.')
      return
    }
    id = String(id)
    setAnalyzing(true)
    try {
      const res = await applicationsApi.analyzeWithAi(id)
      setApplicants((prev) => prev.map((a) => a.application_id === id ? {
        ...a,
        match_score: res.data.match_score,
        matched_skills: res.data.matched_skills,
        missing_skills: res.data.missing_skills,
        is_ai_analyzed: true,
      } : a))
      setSelected((prev) => prev && String(getApplicationId(prev)) === id
        ? { ...prev, ...res.data, application_id: id }
        : prev)
    } catch (err) {
      alert(getApiError(err, 'AI analysis failed.'))
    } finally {
      setAnalyzing(false)
    }
  }

  const handleBulkAnalyze = async () => {
    const pendingApplicants = applicants.filter(
      (applicant) => !applicant.is_ai_analyzed && applicant.status !== 'withdrawn'
    )
    if (pendingApplicants.length === 0) {
      alert('All applicants in the current list have already been analyzed.')
      return
    }
    setAnalyzing(true)
    let successCount = 0
    let failedCount = 0
    for (const applicant of pendingApplicants) {
      try {
        const res = await applicationsApi.analyzeWithAi(applicant.application_id)
        const updatedApplicant = {
          ...applicant,
          ...res.data,
          application_id: applicant.application_id,
          is_ai_analyzed: true,
        }
        setApplicants((prev) => prev.map((item) =>
          item.application_id === applicant.application_id ? { ...item, ...updatedApplicant } : item
        ))
        setSelected((prev) => prev && prev.application_id === applicant.application_id
          ? { ...prev, ...updatedApplicant }
          : prev)
        successCount += 1
      } catch (err) {
        failedCount += 1
        console.error(`AI screening failed for application ${applicant.application_id}:`, err)
      }
    }
    setAnalyzing(false)
    await fetchApplicants()
    alert(`AI screening completed. Successful: ${successCount}. Failed: ${failedCount}.`)
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await applicationsApi.updateStatus(id, { status: newStatus })
      setApplicants((prev) => prev.map((a) => a.application_id === id ? { ...a, status: newStatus } : a))
      if (selected && selected.application_id === id) setSelected({ ...selected, status: newStatus })
    } catch (err) {
      alert(getApiError(err, 'Failed to update status.'))
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await applicationsApi.delete(deleteTarget.application_id)
      setApplicants((prev) => prev.filter((a) => a.application_id !== deleteTarget.application_id))
      if (selected && selected.application_id === deleteTarget.application_id) setSelected(null)
      setDeleteTarget(null)
    } catch (err) {
      alert(getApiError(err, 'Failed to delete the application.'))
    } finally {
      setDeleting(false)
    }
  }

  if (loading && applicants.length === 0) return <LoadingState message="Loading applicants..." />
  if (error && applicants.length === 0) return <ErrorState message={error} onRetry={fetchApplicants} />

  const analyzedCount = applicants.filter((a) => a.match_score != null).length
  const avgScore = analyzedCount
    ? Math.round(applicants.filter((a) => a.match_score != null).reduce((s, a) => s + a.match_score, 0) / analyzedCount)
    : 0
  const pendingCount = applicants.filter((a) => !a.is_ai_analyzed && a.status !== 'withdrawn').length

  return (
    <div className="recruiter-applicants-page">
      <style>{`
        .recruiter-applicants-page { width:100%; animation:recruiterApplicantsIn .42s ease both; }
        @keyframes recruiterApplicantsIn { from { opacity:0; transform:translateY(9px); } to { opacity:1; transform:translateY(0); } }
        .recruiter-applicants-page .applicants-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:18px; margin-bottom:22px; }
        .recruiter-applicants-page .applicants-heading h1 { margin:0; }
        .recruiter-applicants-page .applicants-heading p { margin:7px 0 0; }
        .recruiter-applicants-page .screening-button { display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:42px; border-radius:10px; box-shadow:0 7px 18px rgba(111,75,210,.2); }
        .recruiter-applicants-page .applicant-stats { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:13px; margin-bottom:20px; }
        .recruiter-applicants-page .applicant-stat { padding:17px 19px; border:1px solid var(--border); border-radius:15px; background:var(--card-bg); box-shadow:var(--shadow-sm,0 5px 18px rgba(10,8,30,.05)); }
        .recruiter-applicants-page .applicant-stat-label { color:var(--text-muted); font-size:11px; font-weight:650; letter-spacing:.06em; text-transform:uppercase; }
        .recruiter-applicants-page .applicant-stat-value { display:block; margin-top:7px; color:var(--text-primary); font-size:26px; font-weight:750; line-height:1.1; font-variant-numeric:tabular-nums; }
        .recruiter-applicants-page .applicants-filter-panel { display:flex; flex-wrap:wrap; align-items:center; gap:10px; margin-bottom:17px; padding:14px; border:1px solid var(--border); border-radius:14px; background:var(--card-bg); }
        .recruiter-applicants-page .applicants-filter-panel .form-control { min-width:145px; width:auto; min-height:38px; border-radius:9px; font-size:12px; }
        .recruiter-applicants-page .applicants-filter-panel input[type=number] { width:125px; }
        .recruiter-applicants-page .applicants-table-card { overflow:hidden; border:1px solid var(--border); border-radius:16px; background:var(--card-bg); box-shadow:var(--shadow-sm,0 5px 18px rgba(10,8,30,.05)); }
        .recruiter-applicants-page .applicants-table-head { display:flex; justify-content:space-between; align-items:center; gap:12px; padding:17px 20px; border-bottom:1px solid var(--border); }
        .recruiter-applicants-page .applicants-table-head h2 { margin:0; color:var(--text-primary); font-size:14px; font-weight:700; }
        .recruiter-applicants-page .applicants-table-head span { color:var(--text-muted); font-size:11px; }
        .recruiter-applicants-page .applicants-table-wrap { overflow-x:auto; }
        .recruiter-applicants-page .applicants-table { width:100%; min-width:800px; border-collapse:separate; border-spacing:0; }
        .recruiter-applicants-page .applicants-table thead th { padding:13px 16px; background:var(--surface,rgba(125,105,190,.055)); color:var(--text-muted); font-size:10px; font-weight:700; letter-spacing:.07em; text-align:left; text-transform:uppercase; white-space:nowrap; }
        .recruiter-applicants-page .applicants-table tbody td { padding:14px 16px; border-top:1px solid var(--border); color:var(--text-secondary); font-size:12px; vertical-align:middle; }
        .recruiter-applicants-page .applicants-table tbody tr { transition:background .18s ease; }
        .recruiter-applicants-page .applicants-table tbody tr:hover { background:var(--surface,rgba(125,105,190,.045)); }
        .recruiter-applicants-page .applicant-person { display:flex; align-items:center; gap:10px; min-width:190px; }
        .recruiter-applicants-page .applicant-person .avatar { flex:0 0 auto; width:35px; height:35px; border:1px solid var(--border); background:var(--primary-soft,rgba(124,92,220,.12)); color:var(--primary); font-size:12px; font-weight:750; }
        .recruiter-applicants-page .applicant-name { color:var(--text-primary); font-size:12px; font-weight:700; }
        .recruiter-applicants-page .applicant-email { margin-top:3px; color:var(--text-muted); font-size:10px; }
        .recruiter-applicants-page .applicant-status-select { min-height:31px !important; border-radius:8px; font-size:11px !important; }
        .recruiter-applicants-page .applicant-actions { display:flex; align-items:center; gap:6px; white-space:nowrap; }
        .recruiter-applicants-page .applicant-actions .btn { display:inline-flex; align-items:center; justify-content:center; gap:5px; min-height:29px; border-radius:8px; font-size:11px; }
        .recruiter-applicants-page .applicant-actions .btn:hover { transform:translateY(-1px); }
        .recruiter-applicants-page .applicant-delete { width:29px; min-width:29px; height:29px; padding:0 !important; color:var(--danger) !important; }
        .recruiter-applicants-page .dimmed-row { opacity:.58; }
        .recruiter-applicants-page .review-modal-stats { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin-bottom:18px; }
        .recruiter-applicants-page .review-stat { padding:15px 12px; border:1px solid var(--border); border-radius:12px; background:var(--surface,rgba(125,105,190,.045)); text-align:center; }
        .recruiter-applicants-page .review-stat-label { color:var(--text-muted); font-size:10px; font-weight:650; }
        .recruiter-applicants-page .review-stat-value { margin-top:7px; color:var(--text-primary); font-size:23px; font-weight:750; }
        .recruiter-applicants-page .review-section { margin-top:18px; }
        .recruiter-applicants-page .review-section-title { margin-bottom:9px; color:var(--text-primary); font-size:12px; font-weight:750; }
        .recruiter-applicants-page .review-modal-actions { display:flex; flex-wrap:wrap; gap:9px; margin-top:20px; padding-top:16px; border-top:1px solid var(--border); }
        .recruiter-applicants-page .review-modal-actions .btn { display:inline-flex; align-items:center; gap:7px; }
        @media(max-width:760px) {
          .recruiter-applicants-page .applicants-heading { align-items:flex-start; flex-direction:column; }
          .recruiter-applicants-page .applicants-filter-panel { align-items:stretch; }
          .recruiter-applicants-page .applicants-filter-panel .form-control,
          .recruiter-applicants-page .applicants-filter-panel input[type=number] { flex:1 1 145px; width:100% !important; }
        }
        @media(max-width:480px) {
          .recruiter-applicants-page .applicant-stats { grid-template-columns:1fr; gap:8px; }
          .recruiter-applicants-page .applicant-stat { display:flex; justify-content:space-between; align-items:center; padding:13px 15px; }
          .recruiter-applicants-page .applicant-stat-value { margin:0; font-size:22px; }
          .recruiter-applicants-page .review-modal-stats { gap:6px; }
          .recruiter-applicants-page .review-stat { padding:12px 6px; }
          .recruiter-applicants-page .review-stat-value { font-size:20px; }
        }
        @media(prefers-reduced-motion:reduce) {
          .recruiter-applicants-page, .recruiter-applicants-page * { animation:none !important; transition:none !important; }
        }
      `}</style>

      <div className="topbar applicants-heading">
        <div>
          <h1 className="page-title">AI Applicant Screening</h1>
          <p className="page-subtitle">
            Review candidates with AI match scores. {analyzedCount} analyzed
            {applicants.length > 0 && ` | Avg score ${avgScore}%`}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary screening-button"
          onClick={handleBulkAnalyze}
          disabled={analyzing || applicants.length === 0}
          title="Analyze all applicants who have not been screened yet"
        >
          {analyzing ? <span className="spinner" /> : <SparklesIcon size={15} />}
          {analyzing ? 'Screening Applicants...' : 'AI Assisted Screening'}
        </button>
      </div>

      <div className="applicant-stats">
        <div className="applicant-stat">
          <span className="applicant-stat-label">Total applicants</span>
          <span className="applicant-stat-value">{applicants.length}</span>
        </div>
        <div className="applicant-stat">
          <span className="applicant-stat-label">AI screened</span>
          <span className="applicant-stat-value">{analyzedCount}</span>
        </div>
        <div className="applicant-stat">
          <span className="applicant-stat-label">Awaiting screening</span>
          <span className="applicant-stat-value">{pendingCount}</span>
        </div>
      </div>

      <div className="filter-bar applicants-filter-panel">
        <FilterIcon size={18} color="var(--muted, var(--text-muted))" />
        <select className="form-control" value={filters.job}
          onChange={(e) => setFilters({ ...filters, job: e.target.value })}>
          <option value="">All jobs</option>
          {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
        <select className="form-control" value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All statuses</option>
          {statusOptions.map((s) => <option key={s} value={s}>{applicationStatusLabel[s]}</option>)}
        </select>
        <input type="number" className="form-control" placeholder="Min match %"
          value={filters.minScore} onChange={(e) => setFilters({ ...filters, minScore: e.target.value })} />
        <select className="form-control" value={order} onChange={(e) => setOrder(e.target.value)}>
          <option value="-match_score">Sort: Highest match</option>
          <option value="match_score">Sort: Lowest match</option>
          <option value="-created_at">Sort: Newest</option>
        </select>
      </div>

      {applicants.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={UsersIcon}
            title="No applicants found"
            description="No applications match your current filters. Adjust the filters or wait for new applications."
          />
        </div>
      ) : (
        <section className="applicants-table-card">
          <div className="applicants-table-head">
            <h2>Candidate list</h2>
            <span>{applicants.length} candidates</span>
          </div>
          <div className="applicants-table-wrap">
            <table className="table applicants-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job</th>
                  <th>Match Score</th>
                  <th>Status</th>
                  <th>Applied</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {applicants.map((a) => {
                  const isWithdrawn = a.status === 'withdrawn'
                  return (
                    <tr
                      key={a.application_id}
                      className={isWithdrawn ? 'clickable-row dimmed-row' : 'clickable-row'}
                      onClick={() => { if (!isWithdrawn) setSelected(a) }}
                      style={{ cursor: isWithdrawn ? 'not-allowed' : 'pointer' }}
                      title={isWithdrawn ? 'This application was withdrawn' : ''}
                    >
                      <td>
                        <div className="applicant-person">
                          <span className="avatar">{(a.applicant_name || a.applicant_email || '?').charAt(0).toUpperCase()}</span>
                          <div>
                            <div className="applicant-name">{a.applicant_name}</div>
                            <div className="applicant-email">{a.applicant_email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{a.job_title}</td>
                      <td>
                        {a.match_score != null
                          ? <MatchScore score={a.match_score} showLabel={false} />
                          : <span className="badge badge-secondary">Not analyzed</span>}
                      </td>
                      <td>
                        {isWithdrawn ? (
                          <Badge color={statusBadgeMap[a.status] || 'secondary'}>
                            {applicationStatusLabel[a.status] || a.status}
                          </Badge>
                        ) : (
                          <select
                            className="form-control applicant-status-select"
                            style={{ width: 'auto', padding: '4px 8px' }}
                            value={a.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleStatusChange(a.application_id, e.target.value)}
                          >
                            {statusEditableOptions.map((s) => (
                              <option key={s} value={s}>{applicationStatusLabel[s]}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td>{formatDateTime(a.applied_at)}</td>
                      <td>
                        <div className="applicant-actions">
                          {!isWithdrawn && (
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelected({ ...a, application_id: getApplicationId(a) })
                              }}
                            >
                              <SparklesIcon size={13} /> Review
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-outline applicant-delete"
                            title="Delete application"
                            aria-label="Delete application"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteTarget(a)
                            }}
                          >
                            <TrashIcon size={14} />
                          </button>
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

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Candidate Review" size="lg">
        {selected && (
          <div>
            <div className="review-modal-stats">
              <div className="review-stat">
                <div className="review-stat-label">AI Match Score</div>
                <div className="review-stat-value" style={{ color: selected.match_score >= 70 ? 'var(--success)' : selected.match_score >= 40 ? 'var(--warning)' : 'var(--danger)' }}>
                  {selected.match_score != null ? `${Math.round(selected.match_score)}%` : 'N/A'}
                </div>
              </div>
              <div className="review-stat">
                <div className="review-stat-label">Matched skills</div>
                <div className="review-stat-value" style={{ color: 'var(--success)' }}>
                  {selected.matched_skills?.length || 0}
                </div>
              </div>
              <div className="review-stat">
                <div className="review-stat-label">Missing skills</div>
                <div className="review-stat-value" style={{ color: 'var(--danger)' }}>
                  {selected.missing_skills?.length || 0}
                </div>
              </div>
            </div>

            {selected.match_score == null && (
              <div className="alert alert-info mb-3">
                No match data is available for this candidate yet. Run analysis to see their match score.
              </div>
            )}

            <div className="review-section">
              <div className="review-section-title">Matched skills</div>
              {selected.matched_skills?.length ? (
                <div className="skills-list">
                  {selected.matched_skills.map((s, i) => (
                    <span key={i} className="skill-chip matched"><CheckIcon size={11} style={{ marginRight: 4 }} />{s}</span>
                  ))}
                </div>
              ) : <span className="text-xs muted">No matches yet. Run AI analysis.</span>}
            </div>

            <div className="review-section">
              <div className="review-section-title">Missing / Skill Gap</div>
              {selected.missing_skills?.length ? (
                <div className="skills-list">
                  {selected.missing_skills.map((s, i) => (
                    <span key={i} className="skill-chip missing"><XIcon size={11} style={{ marginRight: 4 }} />{s}</span>
                  ))}
                </div>
              ) : <span className="text-xs muted">No gaps identified yet.</span>}
            </div>

            <div className="review-section">
              <div className="review-section-title">Cover Letter</div>
              {selected.cover_letter
                ? <p className="text-sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75 }}>{selected.cover_letter}</p>
                : <span className="text-xs muted">No cover letter provided.</span>}
            </div>

            <div className="review-modal-actions">
              <button
                className="btn btn-primary"
                onClick={() => handleAnalyze(getApplicationId(selected))}
                disabled={analyzing}
              >
                {analyzing ? <span className="spinner" /> : <SparklesIcon size={15} />}
                {analyzing ? 'Analyzing...' : selected.is_ai_analyzed ? 'Re-analyze with AI' : 'Analyze with AI'}
              </button>
              <button
                className="btn btn-secondary"
                disabled={!selected.resume_file}
                onClick={() => { if (selected.resume_file) window.open(selected.resume_file, '_blank') }}
                title={selected.resume_file ? 'Open resume' : 'Applicant has no resume'}
              >
                <DownloadIcon size={15} /> Resume
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Application" size="sm">
        <p>
          Are you sure you want to delete the application of "{deleteTarget?.applicant_name}" for "
          {deleteTarget?.job_title}"? This action cannot be undone.
        </p>
        <div className="flex gap-2 mt-3" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete Application'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
