import { useEffect, useState, useCallback } from 'react'
import { jobsApi } from '../../api/jobs'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import {
  BriefcaseIcon, TrashIcon, EditIcon, SearchIcon, LocationIcon,
} from '../../components/Icons'
import { formatDate, formatSalary, jobTypeLabel, statusBadgeColor, getApiError } from '../../utils/helpers'
import JobForm from '../../components/JobForm'

export default function AdminJobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [editing, setEditing] = useState(null)
  const [viewing, setViewing] = useState(null)

  const fetchJobs = useCallback(() => {
    setLoading(true)
    setError('')
    const params = {}
    if (search) params.search = search
    if (statusFilter) params.status = statusFilter
    jobsApi
      .list(params)
      .then((res) => setJobs(res.data.results || res.data))
      .catch(() => setError('Failed to load jobs.'))
      .finally(() => setLoading(false))
  }, [search, statusFilter])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  const handleDelete = async (job) => {
    if (!window.confirm(`Delete job "${job.title}"?`)) return
    try {
      await jobsApi.delete(job.id)
      fetchJobs()
    } catch (err) {
      alert(getApiError(err, 'Failed to delete job.'))
    }
  }

  if (loading) return <LoadingState message="Loading jobs..." />
  if (error) return <ErrorState message={error} onRetry={fetchJobs} />

  const openJobs = jobs.filter((job) => job.status === 'open').length
  const closedJobs = jobs.filter((job) => job.status === 'closed').length
  const filledJobs = jobs.filter((job) => job.status === 'filled').length

  return (
    <div className="admin-jobs-page">
      <style>{`
        .admin-jobs-page { animation: adminJobsIn .4s ease both; }
        @keyframes adminJobsIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .admin-jobs-page .topbar { margin-bottom: 20px; }
        .admin-jobs-page .page-title { letter-spacing: -.035em; }
        .admin-jobs-page .page-subtitle { margin-top: 6px; }
        .admin-jobs-page .job-summary { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 11px; margin-bottom: 18px; }
        .admin-jobs-page .summary-tile { padding: 14px 15px; border: 1px solid var(--border-color,rgba(151,130,220,.17)); border-radius: 14px; background: var(--card-bg,rgba(255,255,255,.025)); }
        .admin-jobs-page .summary-label { color: var(--text-muted,#9692a8); font-size: 10px; margin-bottom: 7px; }
        .admin-jobs-page .summary-value { font-size: 21px; font-weight: 750; line-height: 1.1; }
        .admin-jobs-page .summary-total { color: #c4b5fd; }
        .admin-jobs-page .jobs-toolbar { display: flex; gap: 11px; align-items: center; padding: 13px; margin-bottom: 15px; border: 1px solid var(--border-color,rgba(151,130,220,.17)); border-radius: 15px; background: var(--card-bg,rgba(255,255,255,.025)); }
        .admin-jobs-page .search-field { position: relative; flex: 1; min-width: 180px; }
        .admin-jobs-page .search-field > svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted,#9692a8); pointer-events: none; }
        .admin-jobs-page .search-field .form-control { padding-left: 38px; }
        .admin-jobs-page .status-filter { width: 175px; flex: 0 0 175px; }
        .admin-jobs-page .results-line { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin: 0 2px 11px; color: var(--text-muted,#9692a8); font-size: 11px; }
        .admin-jobs-page .jobs-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 14px; }
        .admin-jobs-page .job-card { position: relative; padding: 18px; border: 1px solid var(--border-color,rgba(151,130,220,.17)); border-radius: 16px; background: var(--card-bg,rgba(255,255,255,.025)); transition: transform .2s ease,border-color .2s ease,box-shadow .2s ease; }
        .admin-jobs-page .job-card:hover { transform: translateY(-3px); border-color: rgba(167,139,250,.4); box-shadow: 0 12px 28px rgba(20,12,45,.12); }
        .admin-jobs-page .job-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .admin-jobs-page .job-title { margin: 0; font-size: 15px; line-height: 1.4; font-weight: 750; }
        .admin-jobs-page .job-company { margin-top: 5px; color: var(--text-secondary,#b5b0c5); font-size: 11px; line-height: 1.5; }
        .admin-jobs-page .job-meta { display: flex; flex-wrap: wrap; gap: 7px; margin: 15px 0 12px; }
        .admin-jobs-page .job-info { display: flex; flex-wrap: wrap; gap: 12px; color: var(--text-muted,#9692a8); font-size: 11px; }
        .admin-jobs-page .job-info span { display: inline-flex; align-items: center; gap: 5px; }
        .admin-jobs-page .job-divider { height: 1px; margin: 15px 0 12px; background: var(--border-color,rgba(151,130,220,.14)); }
        .admin-jobs-page .job-actions { display: flex; flex-wrap: wrap; gap: 7px; }
        .admin-jobs-page .modal-section { margin-bottom: 18px; }
        .admin-jobs-page .modal-section:last-child { margin-bottom: 0; }
        .admin-jobs-page .modal-section-title { margin-bottom: 7px; font-size: 12px; font-weight: 750; }
        .admin-jobs-page .job-description { color: var(--text-secondary,#b5b0c5); font-size: 12px; line-height: 1.75; white-space: pre-wrap; }
        .admin-jobs-page .job-requirements { margin: 0; padding-left: 19px; color: var(--text-secondary,#b5b0c5); font-size: 12px; line-height: 1.8; }
        .admin-jobs-page .skills-list { display: flex; flex-wrap: wrap; gap: 7px; }
        @media (max-width: 900px) { .admin-jobs-page .jobs-grid { grid-template-columns: 1fr; } }
        @media (max-width: 650px) {
          .admin-jobs-page .job-summary { grid-template-columns: repeat(2,minmax(0,1fr)); }
          .admin-jobs-page .jobs-toolbar { flex-direction: column; align-items: stretch; }
          .admin-jobs-page .search-field { width: 100%; }
          .admin-jobs-page .status-filter { width: 100%; flex-basis: auto; }
          .admin-jobs-page .job-card-top { flex-direction: column; }
        }
        @media (prefers-reduced-motion: reduce) { .admin-jobs-page,.admin-jobs-page * { animation: none !important; transition: none !important; } }
      `}</style>

      <div className="topbar">
        <div>
          <h1 className="page-title">All Jobs</h1>
          <p className="page-subtitle">Review and manage job postings across the platform.</p>
        </div>
      </div>

      <div className="job-summary">
        <div className="summary-tile"><div className="summary-label">Total jobs</div><div className="summary-value summary-total">{jobs.length}</div></div>
        <div className="summary-tile"><div className="summary-label">Open</div><div className="summary-value">{openJobs}</div></div>
        <div className="summary-tile"><div className="summary-label">Closed</div><div className="summary-value">{closedJobs}</div></div>
        <div className="summary-tile"><div className="summary-label">Filled</div><div className="summary-value">{filledJobs}</div></div>
      </div>

      <div className="jobs-toolbar">
        <div className="search-field">
          <SearchIcon size={16} />
          <input type="text" className="form-control" placeholder="Search jobs..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select aria-label="Filter jobs by status" className="form-control status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="filled">Filled</option>
        </select>
      </div>

      <div className="results-line">
        <span>Showing {jobs.length} jobs</span>
        {(search || statusFilter) && <button type="button" className="btn btn-sm btn-outline" onClick={() => { setSearch(''); setStatusFilter('') }}>Clear filters</button>}
      </div>

      {jobs.length === 0 ? (
        <div className="card">
          <EmptyState icon={BriefcaseIcon} title="No jobs found" description="No jobs match your current filters." />
        </div>
      ) : (
        <div className="jobs-grid">
          {jobs.map((job) => (
            <div key={job.id} className="job-card">
              <div className="job-card-top">
                <div>
                  <h3 className="job-title">{job.title}</h3>
                  <div className="job-company">{job.company} <span className="muted">· {job.recruiter_name}</span></div>
                </div>
                <Badge color={statusBadgeColor[job.status]}>{job.status}</Badge>
              </div>
              <div className="job-meta">
                <Badge color="secondary">{jobTypeLabel[job.job_type] || job.job_type}</Badge>
                {job.location && <Badge color="secondary">{job.location}</Badge>}
                <Badge color="info">{job.application_count || 0} applications</Badge>
              </div>
              <div className="job-info">
                <span><BriefcaseIcon size={13} /> {formatSalary(job.salary_min, job.salary_max)}</span>
                <span>Posted {formatDate(job.created_at)}</span>
              </div>
              <div className="job-divider" />
              <div className="job-actions">
                <button type="button" className="btn btn-sm btn-outline" onClick={() => setViewing(job)}><EditIcon size={14} /> View</button>
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setEditing(job)}><EditIcon size={14} /> Edit</button>
                <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDelete(job)}><TrashIcon size={14} /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Job" size="lg">
        {editing && <JobForm initial={editing} onSuccess={() => { setEditing(null); fetchJobs() }} submitLabel="Save Changes" />}
      </Modal>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing?.title} size="lg">
        {viewing && (
          <div>
            <div className="flex gap-2 mb-3 flex-wrap">
              <Badge color="secondary">{jobTypeLabel[viewing.job_type] || viewing.job_type}</Badge>
              <Badge color="secondary">{viewing.experience_level}</Badge>
              <Badge color={statusBadgeColor[viewing.status]}>{viewing.status}</Badge>
            </div>
            <div className="text-sm muted mb-3">{viewing.company} · {viewing.location || 'Remote'} · {formatSalary(viewing.salary_min, viewing.salary_max)}</div>
            <div className="modal-section">
              <div className="modal-section-title">Description</div>
              <p className="job-description">{viewing.description}</p>
            </div>
            {viewing.requirements?.length > 0 && (
              <div className="modal-section">
                <div className="modal-section-title">Requirements</div>
                <ul className="job-requirements">
                  {viewing.requirements.map((requirement, index) => <li key={index}>{requirement}</li>)}
                </ul>
              </div>
            )}
            {viewing.skills?.length > 0 && (
              <div className="modal-section">
                <div className="modal-section-title">Skills</div>
                <div className="skills-list">
                  {viewing.skills.map((skill, index) => <span key={index} className="skill-chip neutral">{skill.name}</span>)}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
