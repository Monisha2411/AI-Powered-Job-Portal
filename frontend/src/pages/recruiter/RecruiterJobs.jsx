import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { jobsApi } from '../../api/jobs'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import JobForm from '../../components/JobForm'
import {
  PlusIcon, BriefcaseIcon, EditIcon, TrashIcon, SendIcon, SparklesIcon, EyeIcon,
} from '../../components/Icons'
import {
  formatSalary, jobTypeLabel, experienceLevelLabel, statusBadgeColor,
} from '../../utils/helpers'

export default function RecruiterJobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingJob, setEditingJob] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchJobs = useCallback(() => {
    setLoading(true)
    setError('')
    jobsApi
      .list()
      .then((res) => setJobs(res.data.results || res.data))
      .catch(() => setError('Failed to load your jobs.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await jobsApi.delete(deleteTarget.id)
      setJobs((prev) => prev.filter((j) => j.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch {
      setError('Failed to delete the job.')
    } finally {
      setDeleting(false)
    }
  }

  const handleSave = (updated) => {
    setJobs((prev) => {
      const exists = prev.some((j) => j.id === updated.id)
      return exists ? prev.map((j) => (j.id === updated.id ? updated : j)) : [updated, ...prev]
    })
    setEditingJob(null)
  }

  if (loading) return <LoadingState message="Loading your jobs..." />
  if (error) return <ErrorState message={error} onRetry={fetchJobs} />

  const openJobs = jobs.filter((job) => job.status === 'open').length
  const totalApplications = jobs.reduce((sum, job) => sum + (Number(job.application_count) || 0), 0)

  return (
    <div className="recruiter-jobs-page">
      <style>{`
        .recruiter-jobs-page { animation: recruiterJobsIn .4s ease both; }
        @keyframes recruiterJobsIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .recruiter-jobs-page .topbar { align-items: center; gap: 18px; margin-bottom: 24px; }
        .recruiter-jobs-page .page-title { letter-spacing: -.035em; }
        .recruiter-jobs-page .page-subtitle { margin-top: 6px; }
        .recruiter-jobs-page .jobs-summary { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 13px; margin-bottom: 22px; }
        .recruiter-jobs-page .summary-card { padding: 16px 18px; border-radius: 16px; border: 1px solid var(--border-color,rgba(151,130,220,.18)); background: var(--card-bg,rgba(255,255,255,.025)); display: flex; align-items: center; gap: 13px; }
        .recruiter-jobs-page .summary-icon { width: 39px; height: 39px; flex: 0 0 39px; display: grid; place-items: center; border-radius: 12px; color: #bda8ff; background: rgba(139,92,246,.14); }
        .recruiter-jobs-page .summary-value { font-size: 21px; font-weight: 750; line-height: 1.1; letter-spacing: -.04em; }
        .recruiter-jobs-page .summary-label { color: var(--text-muted,#9692a8); font-size: 11px; margin-top: 5px; }
        .recruiter-jobs-page .jobs-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 17px; }
        .recruiter-jobs-page .recruiter-job-card { min-width: 0; padding: 21px; border: 1px solid var(--border-color,rgba(151,130,220,.18)); border-radius: 18px; background: var(--card-bg,rgba(255,255,255,.025)); transition: transform .22s ease,border-color .22s ease,box-shadow .22s ease; }
        .recruiter-jobs-page .recruiter-job-card:hover { transform: translateY(-3px); border-color: rgba(167,139,250,.42); box-shadow: 0 12px 32px rgba(15,10,35,.12); }
        .recruiter-jobs-page .job-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; }
        .recruiter-jobs-page .job-card-heading { min-width: 0; }
        .recruiter-jobs-page .job-title { margin: 0; font-size: 16px; line-height: 1.4; font-weight: 720; letter-spacing: -.02em; overflow-wrap: anywhere; }
        .recruiter-jobs-page .job-company { color: var(--text-muted,#9692a8); font-size: 12px; margin-top: 5px; }
        .recruiter-jobs-page .job-badges { display: flex; justify-content: flex-end; gap: 6px; flex-wrap: wrap; }
        .recruiter-jobs-page .job-meta { display: flex; flex-wrap: wrap; gap: 7px; margin: 17px 0 12px; }
        .recruiter-jobs-page .salary-line { color: var(--text-secondary,#c2bdd2); font-size: 12px; margin-bottom: 13px; }
        .recruiter-jobs-page .application-pill { display: inline-flex; align-items: center; gap: 7px; padding: 7px 10px; border-radius: 9px; color: var(--text-secondary,#c2bdd2); background: rgba(99,102,241,.10); border: 1px solid rgba(129,140,248,.16); font-size: 11px; font-weight: 650; }
        .recruiter-jobs-page .job-skills { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 14px; }
        .recruiter-jobs-page .job-card-divider { height: 1px; background: var(--border-color,rgba(151,130,220,.14)); margin: 17px 0 14px; }
        .recruiter-jobs-page .job-actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .recruiter-jobs-page .job-actions .btn { gap: 6px; }
        .recruiter-jobs-page .jobs-empty { padding: 8px 0; }
        .recruiter-jobs-page .delete-copy { color: var(--text-secondary,#c2bdd2); font-size: 13px; line-height: 1.65; }
        @media (max-width: 900px) { .recruiter-jobs-page .jobs-grid { grid-template-columns: 1fr; } }
        @media (max-width: 640px) {
          .recruiter-jobs-page .topbar { align-items: flex-start; flex-direction: column; }
          .recruiter-jobs-page .jobs-summary { grid-template-columns: 1fr; gap: 9px; }
          .recruiter-jobs-page .summary-card { padding: 13px 15px; }
          .recruiter-jobs-page .recruiter-job-card { padding: 17px; }
          .recruiter-jobs-page .job-card-top { flex-direction: column; }
          .recruiter-jobs-page .job-badges { justify-content: flex-start; }
        }
        @media (prefers-reduced-motion: reduce) { .recruiter-jobs-page,.recruiter-jobs-page * { animation: none !important; transition: none !important; } }
      `}</style>

      <div className="topbar">
        <div>
          <h1 className="page-title">My Job Postings</h1>
          <p className="page-subtitle">Create, manage and track your job openings.</p>
        </div>
        <Link to="/recruiter/new-job" className="btn btn-primary"><PlusIcon size={16} /> Post a Job</Link>
      </div>

      <div className="jobs-summary">
        <div className="summary-card">
          <div className="summary-icon"><BriefcaseIcon size={18} /></div>
          <div><div className="summary-value">{jobs.length}</div><div className="summary-label">Total job postings</div></div>
        </div>
        <div className="summary-card">
          <div className="summary-icon"><SparklesIcon size={18} /></div>
          <div><div className="summary-value">{openJobs}</div><div className="summary-label">Open positions</div></div>
        </div>
        <div className="summary-card">
          <div className="summary-icon"><SendIcon size={18} /></div>
          <div><div className="summary-value">{totalApplications}</div><div className="summary-label">Applications received</div></div>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="card jobs-empty">
          <EmptyState icon={BriefcaseIcon} title="No job postings yet"
            description="Post your first job and let AI analyze the requirements to find suitable candidates."
            action={<Link to="/recruiter/new-job" className="btn btn-primary"><PlusIcon size={14} /> Post a Job</Link>} />
        </div>
      ) : (
        <div className="jobs-grid">
          {jobs.map((job) => (
            <article key={job.id} className="recruiter-job-card">
              <div className="job-card-top">
                <div className="job-card-heading">
                  <h3 className="job-title">{job.title}</h3>
                  <div className="job-company">{job.company}</div>
                </div>
                <div className="job-badges">
                  {job.ai_analyzed && <Badge color="primary"><SparklesIcon size={12} style={{ marginRight: 4 }} /> AI Analyzed</Badge>}
                  <Badge color={statusBadgeColor[job.status]}>{job.status}</Badge>
                </div>
              </div>
              <div className="job-meta">
                <Badge color="secondary">{jobTypeLabel[job.job_type] || job.job_type}</Badge>
                <Badge color="secondary">{experienceLevelLabel[job.experience_level] || job.experience_level}</Badge>
                {job.location && <Badge color="secondary">{job.location}</Badge>}
              </div>
              <div className="salary-line">{formatSalary(job.salary_min, job.salary_max)}</div>
              <div><span className="application-pill"><SendIcon size={12} /> {job.application_count || 0} applications</span></div>
              {job.ai_analyzed && job.ai_analysis?.required_skills?.length > 0 && (
                <div className="job-skills">
                  {job.ai_analysis.required_skills.slice(0, 3).map((skill, index) => (
                    <span key={`${job.id}-skill-${index}`} className="skill-chip neutral">{skill}</span>
                  ))}
                  {job.ai_analysis.required_skills.length > 3 && <span className="skill-chip neutral">+{job.ai_analysis.required_skills.length - 3}</span>}
                </div>
              )}
              <div className="job-card-divider" />
              <div className="job-actions">
                <Link to={`/recruiter/jobs/${job.id}`} className="btn btn-sm btn-outline"><EyeIcon size={14} /> View Details</Link>
                <Link to={`/recruiter/applicants?job=${job.id}`} className="btn btn-sm btn-secondary"><SendIcon size={14} /> Applicants</Link>
                <button type="button" className="btn btn-sm btn-outline" onClick={() => setEditingJob(job)}><EditIcon size={14} /> Edit</button>
                <button type="button" className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(job)}><TrashIcon size={14} /> Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={!!editingJob} onClose={() => setEditingJob(null)} title="Edit Job" size="lg">
        {editingJob && <JobForm initial={editingJob} onSuccess={handleSave} submitLabel="Save Changes" />}
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Job" size="sm">
        <p className="delete-copy">Are you sure you want to delete "{deleteTarget?.title}"? This action cannot be undone.</p>
        <div className="flex gap-2 mt-3" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete Job'}</button>
        </div>
      </Modal>
    </div>
  )
}
