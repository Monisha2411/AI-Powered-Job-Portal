import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { jobsApi } from '../../api/jobs'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import JobForm from '../../components/JobForm'
import {
  EditIcon, LocationIcon, SendIcon, SparklesIcon,
} from '../../components/Icons'
import {
  formatDate, formatSalary, jobTypeLabel, experienceLevelLabel, statusBadgeColor, getApiError,
} from '../../utils/helpers'

export default function RecruiterJobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [editingJob, setEditingJob] = useState(false)

  const fetchJob = useCallback(() => {
    setLoading(true)
    setError('')
    jobsApi
      .get(id)
      .then((res) => setJob(res.data))
      .catch(() => setError('Failed to load job details.'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { fetchJob() }, [fetchJob])

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setError('')
    try {
      await jobsApi.analyze(id)
      const fresh = await jobsApi.get(id)
      setJob(fresh.data)
      alert('AI analysis completed. Skills and requirements extracted.')
    } catch (err) {
      setError(getApiError(err, 'Failed to analyze job.'))
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSave = (updated) => {
    setJob(updated)
    setEditingJob(false)
  }

  if (loading) return <LoadingState message="Loading job details..." />
  if (error && !job) return <ErrorState message={error} onRetry={fetchJob} />
  if (!job) return <ErrorState message="Job not found." onRetry={fetchJob} />

  const analysis = job.ai_analysis || {}
  const requiredSkills = analysis.required_skills || []
  const preferredSkills = analysis.preferred_skills || []
  const keyRequirements = analysis.key_requirements || []
  const qualifications = analysis.qualifications || []

  return (
    <div className="recruiter-job-detail-page">
      <style>{`
        .recruiter-job-detail-page { animation: jobDetailIn .4s ease both; }
        @keyframes jobDetailIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .recruiter-job-detail-page .topbar { align-items: flex-end; gap: 18px; margin-bottom: 22px; }
        .recruiter-job-detail-page .page-title { letter-spacing: -.035em; overflow-wrap: anywhere; }
        .recruiter-job-detail-page .page-subtitle { margin-top: 5px; }
        .recruiter-job-detail-page .back-link { margin-bottom: 12px; }
        .recruiter-job-detail-page .detail-shell { display: grid; grid-template-columns: minmax(0,1fr); gap: 18px; }
        .recruiter-job-detail-page .detail-card { padding: clamp(18px,3vw,28px); border: 1px solid var(--border-color,rgba(151,130,220,.18)); border-radius: 19px; }
        .recruiter-job-detail-page .detail-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 18px; }
        .recruiter-job-detail-page .detail-job-title { margin: 0; font-size: clamp(19px,2.4vw,25px); line-height: 1.3; letter-spacing: -.035em; font-weight: 760; overflow-wrap: anywhere; }
        .recruiter-job-detail-page .detail-company { color: var(--text-muted,#9692a8); font-size: 13px; margin-top: 6px; }
        .recruiter-job-detail-page .detail-location { display: flex; align-items: center; gap: 6px; color: var(--text-muted,#9692a8); font-size: 12px; margin-top: 10px; }
        .recruiter-job-detail-page .detail-badges { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 7px; }
        .recruiter-job-detail-page .detail-meta { display: flex; flex-wrap: wrap; gap: 8px; margin: 21px 0; }
        .recruiter-job-detail-page .application-count { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border: 1px solid rgba(129,140,248,.18); border-radius: 9px; color: var(--text-secondary,#c2bdd2); background: rgba(99,102,241,.1); font-size: 11px; font-weight: 650; }
        .recruiter-job-detail-page .analysis-panel { padding: 20px; border: 1px solid rgba(167,139,250,.24); border-radius: 16px; background: linear-gradient(135deg,rgba(112,78,190,.13),rgba(91,72,154,.055)); margin: 20px 0 24px; }
        .recruiter-job-detail-page .analysis-heading { display: flex; align-items: center; gap: 9px; margin: 0 0 17px; font-size: 15px; font-weight: 750; }
        .recruiter-job-detail-page .analysis-heading-icon { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 11px; color: #c4b5fd; background: rgba(139,92,246,.18); }
        .recruiter-job-detail-page .detail-section { margin: 22px 0; }
        .recruiter-job-detail-page .detail-section-title { margin: 0 0 9px; font-size: 13px; font-weight: 750; color: var(--text-primary,inherit); }
        .recruiter-job-detail-page .detail-copy { color: var(--text-secondary,#c2bdd2); font-size: 13px; line-height: 1.75; white-space: pre-wrap; }
        .recruiter-job-detail-page .detail-list { margin: 0 0 0 18px; padding: 0; color: var(--text-secondary,#c2bdd2); font-size: 13px; line-height: 1.8; }
        .recruiter-job-detail-page .detail-skills { display: flex; flex-wrap: wrap; gap: 7px; }
        .recruiter-job-detail-page .analysis-block { margin-top: 17px; }
        .recruiter-job-detail-page .analysis-block:first-of-type { margin-top: 0; }
        .recruiter-job-detail-page .analysis-label { margin-bottom: 9px; font-size: 12px; font-weight: 700; }
        .recruiter-job-detail-page .analysis-level { display: inline-flex; padding: 7px 11px; border-radius: 9px; background: rgba(139,92,246,.12); color: var(--text-secondary,#c2bdd2); font-size: 12px; }
        .recruiter-job-detail-page .detail-footer { display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap; padding-top: 17px; margin-top: 22px; border-top: 1px solid var(--border-color,rgba(151,130,220,.15)); }
        .recruiter-job-detail-page .detail-actions { display: flex; gap: 9px; flex-wrap: wrap; }
        .recruiter-job-detail-page .inline-error { padding: 10px 12px; border-radius: 10px; background: rgba(239,68,68,.09); color: #f87171; font-size: 12px; margin-top: 11px; }
        .recruiter-job-detail-page .analyze-box { padding: 15px 17px; border: 1px solid rgba(167,139,250,.2); border-radius: 14px; background: rgba(139,92,246,.07); margin: 18px 0 22px; }
        .recruiter-job-detail-page .analyze-copy { color: var(--text-muted,#9692a8); font-size: 12px; margin: 0 0 11px; line-height: 1.6; }
        @media (max-width: 700px) {
          .recruiter-job-detail-page .topbar { align-items: flex-start; flex-direction: column; }
          .recruiter-job-detail-page .detail-heading { flex-direction: column; }
          .recruiter-job-detail-page .detail-badges { justify-content: flex-start; }
          .recruiter-job-detail-page .analysis-panel { padding: 16px; }
          .recruiter-job-detail-page .detail-footer { align-items: flex-start; flex-direction: column; }
          .recruiter-job-detail-page .detail-actions { width: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .recruiter-job-detail-page,.recruiter-job-detail-page * { animation: none !important; transition: none !important; }
        }
      `}</style>

      <div className="topbar">
        <div>
          <button type="button" className="btn btn-outline btn-sm back-link" onClick={() => navigate('/recruiter/jobs')}>
            &larr; Back to Jobs
          </button>
          <h1 className="page-title">{job.title}</h1>
          <p className="page-subtitle">{job.company}</p>
        </div>
        <Link to={`/recruiter/applicants?job=${job.id}`} className="btn btn-secondary">
          <SendIcon size={16} /> View Applicants
        </Link>
      </div>

      <div className="detail-shell">
        <section className="card detail-card">
          <div className="detail-heading">
            <div>
              <h2 className="detail-job-title">{job.title}</h2>
              <div className="detail-company">{job.company}</div>
              {job.location && <div className="detail-location"><LocationIcon size={14} /> {job.location}</div>}
            </div>
            <div className="detail-badges">
              {job.ai_analyzed && <Badge color="primary"><SparklesIcon size={12} style={{ marginRight: 4 }} /> AI Analyzed</Badge>}
              <Badge color={statusBadgeColor[job.status]}>{job.status}</Badge>
            </div>
          </div>

          <div className="detail-meta">
            <Badge color="secondary">{jobTypeLabel[job.job_type] || job.job_type}</Badge>
            <Badge color="secondary">{experienceLevelLabel[job.experience_level] || job.experience_level}</Badge>
            <Badge color="primary">{formatSalary(job.salary_min, job.salary_max)}</Badge>
            <span className="application-count"><SendIcon size={12} /> {job.application_count || 0} applications</span>
          </div>

          {!job.ai_analyzed && (
            <div className="analyze-box">
              <p className="analyze-copy">Run AI analysis to extract required skills, preferred skills and key candidate qualifications from this job posting.</p>
              <button type="button" className="btn btn-secondary" onClick={handleAnalyze} disabled={analyzing}>
                {analyzing ? <span className="spinner" /> : <SparklesIcon size={16} />}
                {analyzing ? 'Analyzing...' : 'Analyze with AI'}
              </button>
              {error && <div className="inline-error">{error}</div>}
            </div>
          )}

          {job.ai_analyzed && (
            <section className="analysis-panel">
              <h3 className="analysis-heading">
                <span className="analysis-heading-icon"><SparklesIcon size={17} /></span>
                AI Analysis
              </h3>

              {requiredSkills.length > 0 && (
                <div className="analysis-block">
                  <div className="analysis-label">Required Skills</div>
                  <div className="detail-skills">{requiredSkills.map((skill, index) => <span key={`required-${index}`} className="skill-chip neutral">{skill}</span>)}</div>
                </div>
              )}

              {preferredSkills.length > 0 && (
                <div className="analysis-block">
                  <div className="analysis-label">Preferred Skills</div>
                  <div className="detail-skills">{preferredSkills.map((skill, index) => <span key={`preferred-${index}`} className="skill-chip neutral">{skill}</span>)}</div>
                </div>
              )}

              {keyRequirements.length > 0 && (
                <div className="analysis-block">
                  <div className="analysis-label">Key Requirements</div>
                  <ul className="detail-list">{keyRequirements.map((item, index) => <li key={`requirement-${index}`}>{item}</li>)}</ul>
                </div>
              )}

              {analysis.experience_level && (
                <div className="analysis-block">
                  <div className="analysis-label">Experience Level</div>
                  <span className="analysis-level">{analysis.experience_level}</span>
                </div>
              )}

              {qualifications.length > 0 && (
                <div className="analysis-block">
                  <div className="analysis-label">Qualifications</div>
                  <ul className="detail-list">{qualifications.map((item, index) => <li key={`qualification-${index}`}>{item}</li>)}</ul>
                </div>
              )}
            </section>
          )}

          <section className="detail-section">
            <h3 className="detail-section-title">Description</h3>
            <p className="detail-copy">{job.description || 'No description provided.'}</p>
          </section>

          {job.requirements?.length > 0 && (
            <section className="detail-section">
              <h3 className="detail-section-title">Requirements</h3>
              <ul className="detail-list">{job.requirements.map((item, index) => <li key={`job-requirement-${index}`}>{item}</li>)}</ul>
            </section>
          )}

          {job.responsibilities?.length > 0 && (
            <section className="detail-section">
              <h3 className="detail-section-title">Responsibilities</h3>
              <ul className="detail-list">{job.responsibilities.map((item, index) => <li key={`responsibility-${index}`}>{item}</li>)}</ul>
            </section>
          )}

          {job.skills_required?.length > 0 && (
            <section className="detail-section">
              <h3 className="detail-section-title">Skills Required</h3>
              <div className="detail-skills">{job.skills_required.map((skill, index) => <span key={`job-skill-${index}`} className="skill-chip neutral">{skill}</span>)}</div>
            </section>
          )}

          <div className="detail-footer">
            <p className="text-xs muted">Posted {formatDate(job.created_at)}</p>
            <div className="detail-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/recruiter/jobs')}>Back</button>
              <button type="button" className="btn btn-primary" onClick={() => setEditingJob(true)}><EditIcon size={15} /> Edit Job</button>
            </div>
          </div>
        </section>
      </div>

      <Modal open={editingJob} onClose={() => setEditingJob(false)} title="Edit Job" size="lg">
        <JobForm initial={job} onSuccess={handleSave} submitLabel="Save Changes" />
      </Modal>
    </div>
  )
}
