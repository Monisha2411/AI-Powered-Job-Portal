import './SeekerJobs.css'
import { useEffect, useState, useCallback } from 'react'
import { jobsApi } from '../../api/jobs'
import { resumesApi } from '../../api/resumes'
import { applicationsApi } from '../../api/applications'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import {
  SearchIcon, BriefcaseIcon, SendIcon, EyeIcon, UploadIcon,
} from '../../components/Icons'
import {
  formatDate, formatSalary, jobTypeLabel, experienceLevelLabel, getApiError,
  statusBadgeColor,
} from '../../utils/helpers'

function matchesExternalJobType(job, selectedType) {
  if (!selectedType) return true

  const contractTime = String(job.contract_time || '').toLowerCase()
  const contractType = String(job.contract_type || '').toLowerCase()
  const title = String(job.title || '').toLowerCase()
  const description = String(job.description || '').toLowerCase()
  const text = `${title} ${description}`

  if (selectedType === 'full_time') {
    return contractTime === 'full_time' ||
      (!contractTime && /\bfull[ -]?time\b/.test(text))
  }

  if (selectedType === 'part_time') {
    return contractTime === 'part_time' ||
      (!contractTime && /\bpart[ -]?time\b/.test(text))
  }

  if (selectedType === 'contract') {
    return contractType === 'contract' ||
      /\b(contract|contractor|freelance|temporary)\b/.test(text)
  }

  if (selectedType === 'internship') {
    return /\b(intern(ship)?|interns|trainee|industrial training)\b/.test(text)
  }

  return true
}


function matchesExperienceLevel(job, selectedLevel) {
  if (!selectedLevel) return true

  const rawValue = String(job.experience_level || '').trim().toLowerCase()
  const displayValue = String(
    experienceLevelLabel[job.experience_level] || rawValue || 'Experience not specified'
  ).trim().toLowerCase()

  const normalizedRaw = rawValue.replace(/[_-]+/g, ' ')
  const normalizedDisplay = displayValue.replace(/[_-]+/g, ' ')
  const selected = selectedLevel.toLowerCase()

  if (selected === 'fresher') {
    return [
      'fresher', 'freshers', 'entry', 'entry level', 'junior',
      'intern', 'internship', 'trainee', 'graduate',
    ].some((value) => normalizedRaw === value || normalizedDisplay === value)
  }

  if (selected === 'experienced') {
    return [
      'experienced', 'experience', 'mid', 'mid level',
      'senior', 'expert', 'lead',
    ].some((value) => normalizedRaw === value || normalizedDisplay === value)
  }

  if (selected === 'experience not specified') {
    return !rawValue ||
      ['not specified', 'experience not specified', 'unspecified'].includes(normalizedRaw) ||
      ['not specified', 'experience not specified', 'unspecified'].includes(normalizedDisplay)
  }

  return normalizedDisplay === selected
}

export default function SeekerJobs() {
  const [jobs, setJobs] = useState([])
  const [externalJobs, setExternalJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [externalLoading, setExternalLoading] = useState(false)
  const [externalError, setExternalError] = useState('')
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [jobType, setJobType] = useState('')
  const [experienceFilter, setExperienceFilter] = useState('')
  const [viewTarget, setViewTarget] = useState(null)
  const [applyTarget, setApplyTarget] = useState(null)
  const [resumes, setResumes] = useState([])
  const [selectedResume, setSelectedResume] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [applying, setApplying] = useState(false)
  const [uploadingResume, setUploadingResume] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const fetchResumes = useCallback(() => {
    return resumesApi.list().then((res) => {
      const data = res.data.results || res.data
      setResumes(data)
      return data
    }).catch(() => [])
  }, [])

  const fetchJobs = useCallback(() => {
    setError('')
    setExternalError('')
    setLoading(true)
    setExternalLoading(true)

    const params = {}
    if (search.trim()) params.search = search.trim()
    if (jobType) params.job_type = jobType

    jobsApi.list(params)
      .then((res) => setJobs(res.data.results || res.data))
      .catch(() => setError('Failed to load portal jobs. Please try again.'))
      .finally(() => setLoading(false))

    jobsApi.external({
      query: search.trim() || 'Python Developer',
      location: 'Bengaluru',
    })
      .then((res) => setExternalJobs(res.data.results || []))
      .catch(() => {
        setExternalJobs([])
        setExternalError('External jobs are temporarily unavailable. Check your connection and try again.')
      })
      .finally(() => setExternalLoading(false))
  }, [search, jobType])

  useEffect(() => {
    const timer = setTimeout(fetchJobs, 350)
    return () => clearTimeout(timer)
  }, [fetchJobs])

  const openApply = (job) => {
    setApplyTarget(job)
    setSelectedResume('')
    setCoverLetter('')
    setUploadError('')
    fetchResumes()
  }

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadingResume(true)
    setUploadError('')
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await resumesApi.upload(formData)
      const data = await fetchResumes()
      if (res.data.id) {
        setSelectedResume(String(res.data.id))
      } else if (data.length) {
        setSelectedResume(String(data[0].id))
      }
    } catch (err) {
      setUploadError(getApiError(err, 'Failed to upload resume. Check the file type and size.'))
    } finally {
      setUploadingResume(false)
      e.target.value = ''
    }
  }

  const handleApply = async () => {
    if (!selectedResume || !applyTarget) {
      alert('Please select a resume to apply with.')
      return
    }

    const isExternalJob = Boolean(applyTarget.redirect_url)
    const externalTab = isExternalJob
      ? window.open('about:blank', '_blank')
      : null

    setApplying(true)
    try {
      const applicationData = isExternalJob
        ? {
            external_job_id: String(applyTarget.id || applyTarget.redirect_url),
            external_job_url: applyTarget.redirect_url,
            external_job_title: applyTarget.title || 'External Job',
            external_company: typeof applyTarget.company === 'string' ? applyTarget.company : (applyTarget.company?.display_name || ''),
            external_location: typeof applyTarget.location === 'string' ? applyTarget.location : (applyTarget.location?.display_name || ''),
            resume: selectedResume,
            cover_letter: coverLetter,
          }
        : {
            job: applyTarget.id,
            resume: selectedResume,
            cover_letter: coverLetter,
          }

      await applicationsApi.create(applicationData)
      setApplyTarget(null)

      if (isExternalJob) {
        if (externalTab) {
          externalTab.location.href = applyTarget.redirect_url
        } else {
          alert('Your application has been saved in My Applications. Allow pop-ups to continue to the external application page.')
        }
      } else {
        alert('Application submitted successfully.')
      }
    } catch (err) {
      if (externalTab) externalTab.close()
      alert(getApiError(err, 'Failed to submit application.'))
    } finally {
      setApplying(false)
    }
  }

  const filteredExternalJobs = externalJobs.filter((job) => {
    const matchesType = matchesExternalJobType(job, jobType)
    const level = job.experience_level || 'Experience not specified'
    const matchesExperience = !experienceFilter || level === experienceFilter
    return matchesType && matchesExperience
  })
  const filteredPortalJobs = jobs.filter((job) =>
    matchesExperienceLevel(job, experienceFilter)
  )
  const externalCount = filteredExternalJobs.length
  const portalCount = filteredPortalJobs.length

  if (loading && jobs.length === 0 && externalJobs.length === 0) {
    return <LoadingState message="Finding jobs for you..." />
  }

  if (error && jobs.length === 0 && externalJobs.length === 0) {
    return <ErrorState message={error} onRetry={fetchJobs} />
  }

  return (
    <div className="seeker-jobs-page">
      <style>{`
        .seeker-jobs-page { width: 100%; min-width: 0; }
        .jobs-intro { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:22px; }
        .jobs-intro h1 { margin-bottom:5px; }
        .jobs-search-panel { display:flex; gap:12px; align-items:center; flex-wrap:wrap; padding:16px; margin-bottom:26px; border:1px solid var(--border-color, #334155); border-radius:14px; background:var(--card-bg, #1e293b); }
        .jobs-search-panel .jobs-search-input-wrap {
          position:relative; display:flex; align-items:center; flex:1 1 320px;
          min-width:260px; width:100%;
        }
        .jobs-search-input-wrap > svg {
          position:absolute; left:13px; top:50%; transform:translateY(-50%);
          z-index:1; pointer-events:none;
        }
        .jobs-search-input-wrap input {
          width:100%; min-width:0; padding-left:42px; padding-right:76px;
          box-sizing:border-box;
        }
        .jobs-search-input-wrap .jobs-clear-search {
          position:absolute; right:7px; top:50%; transform:translateY(-50%);
          z-index:2; white-space:nowrap;
        }
        .jobs-search-panel select { min-width:155px; }
        .jobs-section-heading { display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; margin:24px 0 14px; }
        .jobs-section-heading h2 { margin:0 0 4px; }
        .jobs-section-heading p { margin:0; }
        .jobs-section-count { font-size:12px; color:var(--text-muted, #94a3b8); white-space:nowrap; }
        .jobs-card-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr)); gap:16px; }
        .jobs-card { display:flex; flex-direction:column; min-width:0; height:100%; border:1px solid var(--border-color, #334155); border-radius:14px; transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease; }
        .jobs-card:hover { transform:translateY(-2px); border-color:#6558ee; box-shadow:0 10px 26px rgba(0,0,0,.12); }
        .jobs-card .job-card-top { align-items:flex-start; gap:12px; }
        .jobs-card .job-title { line-height:1.35; overflow-wrap:anywhere; }
        .jobs-card-description { line-height:1.65; margin:14px 0; overflow-wrap:anywhere; }
        .jobs-card-footer { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-top:auto; padding-top:12px; border-top:1px solid var(--border-color, #334155); }
        .jobs-card-actions { display:flex; align-items:center; justify-content:flex-end; gap:8px; flex-wrap:wrap; }
        .jobs-refresh-note { font-size:12px; color:var(--text-muted, #94a3b8); }
        .jobs-error-panel { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; padding:14px; border:1px solid rgba(239,68,68,.35); border-radius:10px; margin-bottom:16px; }
        @media(max-width:600px) {
          .jobs-search-panel { padding:12px; }
          .jobs-search-panel .jobs-search-input-wrap, .jobs-search-panel select { width:100% !important; flex-basis:100%; }
          .jobs-card-footer { align-items:flex-start; }
          .jobs-card-actions { width:100%; }
          .jobs-card-actions .btn { flex:1; justify-content:center; }
        }

        .seeker-jobs-page {
          animation: pageReveal .45s ease both;
        }
        .seeker-jobs-page .jobs-intro {
          padding: 8px 0 22px;
          border-bottom: 1px solid var(--border);
        }
        .seeker-jobs-page .jobs-intro h1 {
          font-size: clamp(26px, 3vw, 34px);
          letter-spacing: -1.1px;
          margin-bottom: 8px;
        }
        .seeker-jobs-page .jobs-intro .page-subtitle {
          max-width: 560px;
          line-height: 1.65;
        }
        .seeker-jobs-page .jobs-refresh-note {
          padding: 8px 12px;
          border: 1px solid var(--border);
          border-radius: 999px;
          background: var(--surface-2);
        }
        .seeker-jobs-page .jobs-search-panel {
          position: relative;
          padding: 18px;
          gap: 12px;
          border: 1px solid var(--border);
          border-radius: 18px;
          background: linear-gradient(135deg, var(--surface), var(--surface-2));
          box-shadow: 0 12px 34px rgba(15, 23, 42, .08);
        }
        .seeker-jobs-page .jobs-search-panel input,
        .seeker-jobs-page .jobs-search-panel select {
          min-height: 46px;
          border-radius: 11px;
          background: var(--surface);
          border-color: var(--border);
        }
        .seeker-jobs-page .jobs-section-heading {
          margin: 30px 0 16px;
        }
        .seeker-jobs-page .jobs-section-heading h2 {
          font-size: 19px;
          letter-spacing: -.35px;
        }
        .seeker-jobs-page .jobs-section-count {
          padding: 7px 11px;
          border: 1px solid var(--border);
          border-radius: 999px;
          background: var(--surface-2);
        }
        .seeker-jobs-page .jobs-card-grid {
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 330px), 1fr));
          gap: 18px;
        }
        .seeker-jobs-page .jobs-card {
          position: relative;
          overflow: hidden;
          border: 1px solid var(--border);
          border-radius: 17px;
          background: var(--surface);
          box-shadow: 0 8px 26px rgba(15, 23, 42, .055);
          transition: transform .22s ease, border-color .22s ease, box-shadow .22s ease;
        }
        .seeker-jobs-page .jobs-card::before {
          content: "";
          position: absolute;
          inset: 0 0 auto;
          height: 3px;
          background: linear-gradient(90deg, var(--primary), var(--secondary));
          opacity: .8;
        }
        .seeker-jobs-page .jobs-card:hover {
          transform: translateY(-4px);
          border-color: var(--primary);
          box-shadow: 0 16px 36px rgba(79, 70, 229, .13);
        }
        .seeker-jobs-page .jobs-card .job-title {
          font-size: 16px;
          font-weight: 700;
          letter-spacing: -.25px;
          margin: 0 0 6px;
        }
        .seeker-jobs-page .jobs-card .job-company {
          color: var(--text-muted);
          font-size: 13px;
        }
        .seeker-jobs-page .jobs-card .job-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 14px;
        }
        .seeker-jobs-page .jobs-card-description {
          color: var(--text-muted);
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 4.8em;
        }
        .seeker-jobs-page .jobs-card-footer {
          border-color: var(--border);
          margin-top: auto;
          padding-top: 14px;
        }
        .seeker-jobs-page .jobs-error-panel {
          background: rgba(239, 68, 68, .06);
          border-color: rgba(239, 68, 68, .25);
        }
        .seeker-jobs-page .divider {
          border-color: var(--border);
        }
        @keyframes pageReveal {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .seeker-jobs-page, .seeker-jobs-page * {
            animation-duration: .01ms !important;
            transition-duration: .01ms !important;
            scroll-behavior: auto !important;
          }
        }

        /* Responsive overflow fixes */
        .seeker-jobs-page,
        .seeker-jobs-page section {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }

        .seeker-jobs-page {
          overflow-x: clip;
        }

        .seeker-jobs-page .jobs-search-panel {
          display: flex;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          flex-wrap: wrap;
          box-sizing: border-box;
        }

        .seeker-jobs-page .jobs-search-panel .jobs-search-input-wrap {
          flex: 1 1 320px;
          min-width: 0;
          max-width: 100%;
        }

        .seeker-jobs-page .jobs-search-panel select {
          flex: 0 1 190px;
          width: auto;
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
        }

        .seeker-jobs-page .jobs-section-heading {
          width: 100%;
          min-width: 0;
        }

        .seeker-jobs-page .jobs-section-count {
          max-width: 100%;
          white-space: normal;
          overflow-wrap: anywhere;
        }

        .seeker-jobs-page .jobs-card-grid {
          display: grid;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          box-sizing: border-box;
        }

        .seeker-jobs-page .jobs-card {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }

        .seeker-jobs-page .jobs-card-top,
        .seeker-jobs-page .jobs-card-footer,
        .seeker-jobs-page .jobs-card-actions {
          min-width: 0;
          flex-wrap: wrap;
        }

        .seeker-jobs-page .jobs-card-description {
          overflow-wrap: anywhere;
        }

        @media (max-width: 900px) {
          .seeker-jobs-page .jobs-card-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }

        @media (max-width: 600px) {
          .seeker-jobs-page .jobs-search-panel select {
            flex: 1 1 100%;
            width: 100% !important;
          }

          .seeker-jobs-page .jobs-card-footer {
            align-items: flex-start;
          }

          .seeker-jobs-page .jobs-card-actions {
            width: 100%;
          }
        }
      `}</style>

      <div className="jobs-intro">
        <div>
          <h1 className="page-title">Browse Jobs</h1>
          <p className="page-subtitle">Find your next opportunity</p>
        </div>
        <span className="jobs-refresh-note">Updated job results from your search</span>
      </div>

      <div className="jobs-search-panel">
        <div className="jobs-search-input-wrap">
          <SearchIcon size={17} />
          <input
            type="text"
            className="form-control"
            placeholder="Search Python, Java, React..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search jobs"
          />
          {search && (
            <button
              type="button"
              className="btn btn-sm btn-outline jobs-clear-search"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              Clear
            </button>
          )}
        </div>

        <select
          className="form-control"
          style={{ width: 'auto' }}
          value={jobType}
          onChange={(e) => setJobType(e.target.value)}
          aria-label="Filter by job type"
        >
          <option value="">All job types</option>
          <option value="full_time">Full Time</option>
          <option value="part_time">Part Time</option>
          <option value="contract">Contract</option>
          <option value="internship">Internship</option>
        </select>

        <select
          className="form-control"
          style={{ width: 'auto' }}
          value={experienceFilter}
          onChange={(e) => setExperienceFilter(e.target.value)}
          aria-label="Filter by experience level"
        >
          <option value="">All experience levels</option>
          <option value="Fresher">Fresher</option>
          <option value="Experienced">Experienced</option>
          <option value="Experience not specified">Experience not specified</option>
        </select>
      </div>

      <section>
        <div className="jobs-section-heading">
          <div>
            <h2>External Job Opportunities</h2>
            <p className="text-sm muted">Live job listings provided by Adzuna.</p>
          </div>
          <span className="jobs-section-count">
            {externalLoading ? 'Searching...' : `${externalCount} jobs found`}
          </span>
        </div>

        {externalError && (
          <div className="jobs-error-panel">
            <span className="form-error">{externalError}</span>
            <button className="btn btn-sm btn-outline" onClick={fetchJobs}>Retry</button>
          </div>
        )}

        {externalLoading && (
          <div className="card card-padded">
            <LoadingState message="Searching external job listings..." />
          </div>
        )}

        {!externalLoading && !externalError && externalJobs.length === 0 && (
          <div className="card card-padded">
            <EmptyState
              icon={BriefcaseIcon}
              title="No external jobs found"
              description="Try a different job title or skill."
            />
          </div>
        )}

        {!externalLoading && !externalError && externalJobs.length > 0 && filteredExternalJobs.length === 0 && (
          <div className="card card-padded">
            <EmptyState
              icon={BriefcaseIcon}
              title="No jobs match your filters"
              description="Try another job type or experience level, or select All experience levels."
            />
          </div>
        )}

        {filteredExternalJobs.length > 0 && (
          <div className="jobs-card-grid">
            {filteredExternalJobs.map((job) => (
              <article key={job.id} className="card card-padded job-card jobs-card">
                <div className="job-card-top">
                  <div>
                    <h3 className="job-title">{job.title}</h3>
                    <div className="job-company">
                      {job.company?.display_name || 'Company not specified'}
                    </div>
                  </div>
                  <Badge color="success">External Job</Badge>
                </div>

                <div className="job-meta">
                  <Badge
                    color={
                      job.experience_level === 'Fresher'
                        ? 'success'
                        : job.experience_level === 'Experienced'
                          ? 'warning'
                          : 'secondary'
                    }
                  >
                    {job.experience_level || 'Experience not specified'}
                  </Badge>
                  {job.location?.display_name && (
                    <Badge color="secondary">{job.location.display_name}</Badge>
                  )}
                  {job.contract_time && (
                    <Badge color="secondary">{job.contract_time.replace('_', ' ')}</Badge>
                  )}
                  {job.contract_type && (
                    <Badge color="secondary">{job.contract_type.replace('_', ' ')}</Badge>
                  )}
                </div>

                <p className="text-sm muted jobs-card-description">
                  {job.description || 'No description available.'}
                </p>

                {(job.salary_min || job.salary_max) && (
                  <div className="text-sm muted mb-2">
                    <strong>Salary:</strong>{' '}
                    {job.salary_min ? `₹${Math.round(job.salary_min).toLocaleString('en-IN')}` : 'Not specified'}
                    {' to '}
                    {job.salary_max ? `₹${Math.round(job.salary_max).toLocaleString('en-IN')}` : 'Not specified'}
                  </div>
                )}

                <div className="jobs-card-footer">
                  <span className="text-xs muted">
                    {job.created ? `Posted ${formatDate(job.created)}` : 'External listing'}
                  </span>
                  <div className="jobs-card-actions">
                    {job.redirect_url ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => openApply(job)}
                      >
                        <SendIcon size={14} /> Apply Now
                      </button>
                    ) : (
                      <span className="text-xs muted">Application link unavailable</span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="divider" style={{ margin: '30px 0 22px' }} />

      <section>
        <div className="jobs-section-heading">
          <div>
            <h2>Jobs Posted on This Portal</h2>
            <p className="text-sm muted">Opportunities posted by recruiters on AI-JobPortal.</p>
          </div>
          <span className="jobs-section-count">
            {loading ? 'Loading...' : `${portalCount} jobs found`}
          </span>
        </div>

        {error && (
          <div className="jobs-error-panel">
            <span className="form-error">{error}</span>
            <button className="btn btn-sm btn-outline" onClick={fetchJobs}>Retry</button>
          </div>
        )}

        {jobs.length === 0 ? (
          <div className="card card-padded">
            <EmptyState
              icon={BriefcaseIcon}
              title="No portal jobs found"
              description="Try another search. External job listings are shown above."
            />
          </div>
        ) : filteredPortalJobs.length === 0 ? (
          <div className="card card-padded">
            <EmptyState
              icon={BriefcaseIcon}
              title="No portal jobs match this experience level"
              description="Choose another experience level or select All experience levels."
            />
          </div>
        ) : (
          <div className="jobs-card-grid">
            {filteredPortalJobs.map((job) => (
              <article key={job.id} className="card card-padded job-card jobs-card">
                <div className="job-card-top">
                  <div>
                    <h3 className="job-title">{job.title}</h3>
                    <div className="job-company">{job.company}</div>
                  </div>
                  <div className="flex gap-1 flex-wrap" style={{ justifyContent: 'flex-end' }}>
                    {job.skills_required?.slice(0, 3).map((skill, index) => (
                      <span key={index} className="skill-chip neutral">{skill}</span>
                    ))}
                    {job.skills_required?.length > 3 && (
                      <span className="skill-chip neutral">+{job.skills_required.length - 3}</span>
                    )}
                  </div>
                </div>

                <div className="job-meta">
                  <Badge color="secondary">{jobTypeLabel[job.job_type] || job.job_type}</Badge>
                  <Badge color="secondary">{experienceLevelLabel[job.experience_level] || job.experience_level}</Badge>
                  {job.location && <Badge color="secondary">{job.location}</Badge>}
                  <Badge color={statusBadgeColor[job.status]}>{job.status}</Badge>
                </div>

                <p className="text-sm muted jobs-card-description">
                  {job.description || 'No description provided.'}
                </p>
                <div className="text-sm muted mb-2">
                  {formatSalary(job.salary_min, job.salary_max)}
                </div>

                <div className="jobs-card-footer">
                  <span className="text-xs muted">Posted {formatDate(job.created_at)}</span>
                  <div className="jobs-card-actions">
                    <button className="btn btn-sm btn-outline" onClick={() => setViewTarget(job)}>
                      <EyeIcon size={14} /> View
                    </button>
                    <button className="btn btn-sm btn-primary" onClick={() => openApply(job)}>
                      <SendIcon size={14} /> Apply Now
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Modal
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title={viewTarget?.title}
        size="lg"
      >
        {viewTarget && (
          <div>
            <div className="flex-between mb-2 flex-wrap gap-2">
              <div>
                <div className="job-company text-lg bold">{viewTarget.company}</div>
                {viewTarget.location && <div className="text-sm muted">{viewTarget.location}</div>}
              </div>
              <Badge color={statusBadgeColor[viewTarget.status]}>{viewTarget.status}</Badge>
            </div>

            <div className="job-meta mb-3">
              <Badge color="secondary">{jobTypeLabel[viewTarget.job_type] || viewTarget.job_type}</Badge>
              <Badge color="secondary">{experienceLevelLabel[viewTarget.experience_level] || viewTarget.experience_level}</Badge>
              <Badge color="primary">{formatSalary(viewTarget.salary_min, viewTarget.salary_max)}</Badge>
            </div>

            <div className="mb-3">
              <div className="text-sm bold mb-1">Description</div>
              <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>
                {viewTarget.description || 'No description provided.'}
              </p>
            </div>

            {viewTarget.requirements?.length > 0 && (
              <div className="mb-3">
                <div className="text-sm bold mb-1">Requirements</div>
                <ul className="text-sm" style={{ marginLeft: 18 }}>
                  {viewTarget.requirements.map((requirement, index) => (
                    <li key={index}>{requirement}</li>
                  ))}
                </ul>
              </div>
            )}

            {viewTarget.responsibilities?.length > 0 && (
              <div className="mb-3">
                <div className="text-sm bold mb-1">Responsibilities</div>
                <ul className="text-sm" style={{ marginLeft: 18 }}>
                  {viewTarget.responsibilities.map((responsibility, index) => (
                    <li key={index}>{responsibility}</li>
                  ))}
                </ul>
              </div>
            )}

            {viewTarget.skills_required?.length > 0 && (
              <div className="mb-3">
                <div className="text-sm bold mb-1">Skills Required</div>
                <div className="skills-list">
                  {viewTarget.skills_required.map((skill, index) => (
                    <span key={index} className="skill-chip neutral">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs muted">Posted {formatDate(viewTarget.created_at)}</p>

            <div className="flex gap-2 mt-3" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setViewTarget(null)}>Close</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  openApply(viewTarget)
                  setViewTarget(null)
                }}
              >
                <SendIcon size={15} /> Apply Now
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!applyTarget}
        onClose={() => setApplyTarget(null)}
        title={`Apply for ${applyTarget?.title}`}
      >
        <p className="text-sm muted mb-3">
          {typeof applyTarget?.company === 'string'
            ? applyTarget.company
            : applyTarget?.company?.display_name || 'Company not specified'}
          {' • '}
          {typeof applyTarget?.location === 'string'
            ? applyTarget.location
            : applyTarget?.location?.display_name || 'Remote'}
        </p>

        <div className="form-group">
          <label className="form-label">Select a Resume</label>
          {resumes.length === 0 ? (
            <p className="text-sm muted mb-2">
              You do not have a resume yet. Upload one below or from your resume page.
            </p>
          ) : (
            <select
              className="form-control"
              value={selectedResume}
              onChange={(e) => setSelectedResume(e.target.value)}
            >
              <option value="">Select a resume...</option>
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.file_name} {resume.is_analyzed ? '(analyzed)' : '(not analyzed)'} {resume.is_primary ? '(primary)' : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="divider" style={{ margin: '4px 0 16px' }} />

        <div className="form-group">
          <label className="form-label">Or Upload a New Resume</label>
          <label className="btn btn-secondary btn-sm" style={{ display: 'inline-flex' }}>
            {uploadingResume ? <span className="spinner" /> : <UploadIcon size={15} />}
            {uploadingResume ? 'Uploading...' : 'Upload from system'}
            <input
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              hidden
              onChange={handleResumeUpload}
              disabled={uploadingResume}
            />
          </label>
          <div className="form-hint">Supported formats: PDF, DOCX, TXT (max 10MB).</div>
          {uploadError && <div className="form-error">{uploadError}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">Cover Letter (optional)</label>
          <textarea
            className="form-control"
            placeholder="Briefly tell the recruiter why you are a good fit..."
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            rows={5}
          />
        </div>

        <div className="flex gap-2 mt-3" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setApplyTarget(null)}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleApply}
            disabled={applying || !selectedResume || uploadingResume}
          >
            {applying && <span className="spinner" />}
            {applying ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </Modal>
    </div>
  )
}