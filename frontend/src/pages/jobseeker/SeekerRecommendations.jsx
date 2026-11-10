import { useEffect, useState, useCallback } from 'react'
import { matchingApi } from '../../api/matching'
import { resumesApi } from '../../api/resumes'
import { jobsApi } from '../../api/jobs'
import { applicationsApi } from '../../api/applications'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'
import MatchScore from '../../components/ui/MatchScore'
import Modal from '../../components/ui/Modal'
import SkillList from '../../components/ui/SkillList'
import {
  SparklesIcon, SendIcon, TargetIcon, CheckIcon, XIcon, BriefcaseIcon,
  EyeIcon, UploadIcon, LocationIcon, RefreshIcon,
} from '../../components/Icons'
import { formatDate, formatDateTime, formatSalary, jobTypeLabel, experienceLevelLabel, getApiError } from '../../utils/helpers'

export default function SeekerRecommendations() {
  const [recommendations, setRecommendations] = useState(null)
  const [externalRecommendations, setExternalRecommendations] = useState([])
  const [resumes, setResumes] = useState([])
  const [selectedResume, setSelectedResume] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [noResume, setNoResume] = useState(false)
  const [applyTarget, setApplyTarget] = useState(null)
  const [applyResume, setApplyResume] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [applying, setApplying] = useState(false)
  const [uploadingResume, setUploadingResume] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [viewTarget, setViewTarget] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [viewError, setViewError] = useState('')
  const [experienceFilter, setExperienceFilter] = useState('All')
  const [skillFilter, setSkillFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [minMatchScore, setMinMatchScore] = useState('0')
  const [savingExternalJobId, setSavingExternalJobId] = useState(null)
  const [appliedExternalJobIds, setAppliedExternalJobIds] = useState([])

  const loadResumes = useCallback(() => {
    return resumesApi.list().then((res) => {
      const data = res.data.results || res.data
      setResumes(data)
      const primary = data.find((r) => r.is_primary)
      if (primary && !selectedResume) setSelectedResume(primary.id)
      return data
    }).catch(() => [])
  }, [selectedResume])

  const fetchRecommendations = useCallback(async (useAi = false) => {
    if (useAi) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const payload = selectedResume ? { resume_id: selectedResume } : {}
      if (useAi) payload.use_ai = true
      const res = await matchingApi.recommendations(payload)
      setRecommendations(res.data)
      try {
  const externalRes = await matchingApi.externalRecommendations(payload)
  setExternalRecommendations(externalRes.data.results || [])
} catch (externalErr) {
  console.error('External recommendations failed:', externalErr)
  setExternalRecommendations([])
}
      setNoResume(false)
    } catch (err) {
      if (err?.response?.data?.code === 'no_resume') {
        setNoResume(true)
        setRecommendations([])

      } else {
        setError(getApiError(err, 'Failed to load recommendations.'))
      }
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }, [selectedResume])

  const openApply = (rec) => {
    setApplyTarget(rec)
    setApplyResume(selectedResume)
    setCoverLetter('')
    setUploadError('')
  }

  const openView = (rec) => {
    setViewTarget(rec)
    setViewLoading(true)
    setViewError('')
    jobsApi.get(rec.job_id)
      .then((res) => setViewTarget({ ...rec, ...res.data }))
      .catch((err) => setViewError(getApiError(err, 'Failed to load job details.')))
      .finally(() => setViewLoading(false))
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
      const data = await loadResumes()
      setApplyResume(res.data.id || (data.length ? data[0].id : ''))
    } catch (err) {
      setUploadError(getApiError(err, 'Failed to upload resume. Please check file type and size (max 10MB, PDF/DOCX/TXT).'))
    } finally {
      setUploadingResume(false)
      e.target.value = ''
    }
  }

  const handleApply = async () => {
    if (!applyResume) {
      alert('Please select a resume to apply with.')
      return
    }
    setApplying(true)
    try {
      await applicationsApi.create({ job: applyTarget.job_id, resume: applyResume, cover_letter: coverLetter })
      alert('Application submitted successfully.')
      setApplyTarget(null)
    } catch (err) {
      alert(getApiError(err, 'Failed to submit application.'))
    } finally {
      setApplying(false)
    }
  }

  const handleMarkAsApplied = async (job) => {
    const externalJobId = String(job.id || '')
    if (!externalJobId) {
      alert('This external job does not have a valid job ID.')
      return
    }

    setSavingExternalJobId(externalJobId)
    try {
      await applicationsApi.create({
        external_job_id: externalJobId,
        external_job_url: job.redirect_url,
        external_job_title: job.job_title || 'External job',
        external_company: job.job_company || '',
        external_location: job.job_location || '',
        resume: selectedResume || null,
      })

      setAppliedExternalJobIds((current) =>
        current.includes(externalJobId) ? current : [...current, externalJobId]
      )
      alert('External job saved in My Applications.')
    } catch (err) {
      alert(getApiError(err, 'Could not save this external job. It might already be in My Applications.'))
    } finally {
      setSavingExternalJobId(null)
    }
  }

  useEffect(() => {
    loadResumes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!noResume) fetchRecommendations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedResume, noResume])

  if (loading) return <LoadingState message="Loading recommendations..." />

  const lastAnalyzedAt = recommendations?.length
    ? recommendations.reduce((acc, r) => (r.analyzed_at > acc ? r.analyzed_at : acc), '')
    : null

  const filteredExternalRecommendations = externalRecommendations.filter((job) => {
    const experienceMatches =
      experienceFilter === 'All' ||
      (job.experience_category || 'Experience not specified') === experienceFilter

    const searchableSkills = [
      ...(Array.isArray(job.matched_skills) ? job.matched_skills : []),
      ...(Array.isArray(job.missing_skills) ? job.missing_skills : []),
    ].join(' ').toLowerCase()
    const skillMatches =
      !skillFilter.trim() || searchableSkills.includes(skillFilter.trim().toLowerCase())

    const locationMatches =
      !locationFilter.trim() ||
      (job.job_location || '').toLowerCase().includes(locationFilter.trim().toLowerCase())

    const scoreMatches = Number(job.match_score || 0) >= Number(minMatchScore || 0)

    return experienceMatches && skillMatches && locationMatches && scoreMatches
  })

  return (
    <div className="recommendations-page">
      <style>{`
        .recommendations-page {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 22px;
          animation: rec-page-enter .4s ease both;
        }

        .recommendations-page > .topbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          margin: 0;
          padding: 10px 0 22px;
          border-bottom: 1px solid var(--border);
        }

        .recommendations-page .page-title {
          font-size: clamp(26px, 3vw, 34px);
          font-weight: 800;
          letter-spacing: -1px;
          line-height: 1.2;
        }

        .recommendations-page .page-subtitle {
          max-width: 760px;
          margin-top: 9px;
          line-height: 1.7;
        }

        .recommendations-page .filter-bar {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          padding: 17px;
          margin: 0;
          border: 1px solid var(--border);
          border-radius: 17px;
          background: var(--surface);
          box-shadow: var(--shadow-sm);
        }

        .recommendations-page .filter-bar select {
          min-width: min(260px, 100%);
          flex: 1 1 250px;
        }

        .recommendations-page .filter-bar .btn {
          min-height: 42px;
          white-space: nowrap;
        }

        .recommendations-page .grid {
          display: grid;
          width: 100%;
          min-width: 0;
          align-items: stretch;
          gap: 19px;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 390px), 1fr));
        }

        .recommendations-page .recommendation-card {
          position: relative;
          display: flex;
          flex-direction: column;
          min-width: 0;
          overflow: hidden;
          padding: 22px;
          border: 1px solid var(--border);
          border-radius: 18px;
          background: var(--surface);
          box-shadow: var(--shadow-sm);
          transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
        }

        .recommendations-page .recommendation-card:hover {
          transform: translateY(-3px);
          border-color: var(--primary);
          box-shadow: var(--shadow);
        }

        .recommendations-page .recommendation-card::before {
          content: "";
          position: absolute;
          inset: 0 0 auto;
          height: 3px;
          background: linear-gradient(90deg, var(--primary), #a78bfa, transparent);
        }

        .recommendations-page .job-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }

        .recommendations-page .job-card-top > div:first-child {
          flex: 1 1 190px;
          min-width: 0;
        }

        .recommendations-page .job-title {
          line-height: 1.4;
          overflow-wrap: anywhere;
        }

        .recommendations-page .job-company {
          margin-top: 6px;
          color: var(--text-muted);
          font-size: 13px;
          font-weight: 600;
          overflow-wrap: anywhere;
        }

        .recommendations-page .job-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 13px;
        }

        .recommendations-page .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .recommendations-page .skill-chip {
          border-radius: 999px;
        }

        .recommendations-page .divider {
          border-color: var(--border);
        }

        .recommendations-page h2 {
          margin-bottom: 6px;
        }

        .recommendations-page .form-control {
          min-height: 43px;
          max-width: 100%;
          border-radius: 10px;
        }

        .recommendations-page input[type="range"] {
          accent-color: var(--primary);
        }

        .recommendations-page .card-padded {
          border-radius: 18px;
        }

        .recommendations-page .recommendation-card .flex-between {
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: auto;
        }

        .recommendations-page .recommendation-card .text-sm.muted.mt-2 {
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 4;
          overflow: hidden;
          line-height: 1.65;
          overflow-wrap: anywhere;
        }

        .recommendations-page .external-filter-card {
          padding: 20px;
          border: 1px solid var(--border);
          border-radius: 17px;
          background: var(--surface);
        }

        .recommendations-page .external-filter-card .grid {
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 190px), 1fr));
          gap: 14px;
        }

        .recommendations-page .form-group {
          min-width: 0;
        }

        .recommendations-page .form-group input,
        .recommendations-page .form-group select,
        .recommendations-page textarea {
          width: 100%;
          min-width: 0;
        }

        .recommendations-page .recommendation-card .btn {
          min-height: 37px;
          border-radius: 9px;
        }

        .recommendations-page .recommendation-card .flex.gap-2 {
          flex-wrap: wrap;
        }

        @keyframes rec-page-enter {
          from { opacity: 0; transform: translateY(7px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 900px) {
          .recommendations-page .grid {
            grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
          }
        }

        @media (max-width: 640px) {
          .recommendations-page { gap: 17px; }
          .recommendations-page > .topbar { flex-direction: column; }
          .recommendations-page .filter-bar { align-items: stretch; }
          .recommendations-page .filter-bar select,
          .recommendations-page .filter-bar .btn { width: 100% !important; min-width: 0; }
          .recommendations-page .job-card-top { flex-direction: column; }
          .recommendations-page .recommendation-card { padding: 17px; }
          .recommendations-page .recommendation-card .flex-between {
            align-items: flex-start;
            flex-direction: column;
          }
          .recommendations-page .recommendation-card .flex.gap-2 {
            width: 100%;
          }
          .recommendations-page .recommendation-card .flex.gap-2 .btn {
            flex: 1;
            justify-content: center;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .recommendations-page,
          .recommendations-page .recommendation-card {
            animation: none !important;
            transition: none !important;
          }
          .recommendations-page .recommendation-card:hover { transform: none; }
        }
      `}</style>
      <div className="topbar">
        <div>
          <h1 className="page-title flex gap-2" style={{ alignItems: 'center' }}>
            <SparklesIcon size={24} color="var(--primary)" /> AI Job Recommendations
          </h1>
          <p className="page-subtitle">
            Matches your resume's skills against available jobs with match scores and skill-gap analysis.
            Results are saved from your last analysis and update only when you re-run it.
          </p>
        </div>
      </div>

      {resumes.length > 0 && (
        <div className="filter-bar">
          <TargetIcon size={18} />
          <select className="form-control" style={{ width: 'auto' }} value={selectedResume}
            onChange={(e) => setSelectedResume(e.target.value)}>
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.file_name} {r.is_analyzed ? '(analyzed)' : '(not analyzed)'} {r.is_primary ? '(primary)' : ''}
              </option>
            ))}
          </select>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => fetchRecommendations(true)}
            disabled={refreshing || loading}
          >
            {refreshing ? <span className="spinner" /> : <RefreshIcon size={14} />}
            {refreshing ? 'AI Rechecking...' : 'Refresh with AI'}
          </button>
          {lastAnalyzedAt && (
            <span className="text-xs muted" style={{ marginLeft: 'auto' }}>
              Last analyzed {formatDateTime(lastAnalyzedAt)}
            </span>
          )}
        </div>
      )}

      {error && <ErrorState message={error} onRetry={fetchRecommendations} />}

      {noResume && (
        <div className="card">
          <EmptyState
            icon={SparklesIcon}
            title="No analyzed resume found"
            description="Upload and analyze your resume to get AI-powered job recommendations and match scores."
            action={<a href="/seeker/resume" className="btn btn-primary">Upload Resume</a>}
          />
        </div>
      )}

      {recommendations && recommendations.length === 0 && !noResume && (
        <div className="card">
          <EmptyState
            icon={BriefcaseIcon}
            title="No matching jobs yet"
            description="No open jobs currently match your profile. Check back later or browse all jobs."
          />
        </div>
      )}

      {recommendations && recommendations.length > 0 && (
        <div className="grid">
          {recommendations.map((rec, idx) => (
            <div key={rec.job_id} className="card card-padded recommendation-card">
              <div className="job-card-top">
                <div>
                  <div className="text-xs muted mb-1">#{idx + 1} Recommendation</div>
                  <h3 className="job-title">{rec.job_title}</h3>
                  <div className="job-company">{rec.job_company} {rec.job_location ? `• ${rec.job_location}` : ''}</div>
                </div>
                <div className="flex gap-2" style={{ alignItems: 'center' }}>
                  <MatchScore score={rec.match_score} />
                  {rec.source === 'ai'
                    ? (
                      <Badge color="primary" data-testid={`badge-${rec.job_id}`}>
                        <SparklesIcon size={11} style={{ marginRight: 4 }} /> AI analysis
                      </Badge>
                    ) : (
                      <Badge color="secondary" data-testid={`badge-${rec.job_id}`}>
                        Auto match
                      </Badge>
                    )}
                </div>
              </div>
              <div className="job-meta">
                <Badge color="secondary">{jobTypeLabel[rec.job_type] || rec.job_type}</Badge>
                <Badge color="secondary">{experienceLevelLabel[rec.experience_level] || rec.experience_level}</Badge>
              </div>

              <div className="mt-2">
                <div className="text-sm bold flex gap-1 mb-1" style={{ alignItems: 'center' }}>
                  <CheckIcon size={15} color="var(--success)" /> Matched Skills ({rec.matched_skills?.length || 0})
                </div>
                <SkillList skills={rec.matched_skills} type="matched" />
              </div>

              <div className="mt-2">
                <div className="text-sm bold flex gap-1 mb-1" style={{ alignItems: 'center' }}>
                  <XIcon size={15} color="var(--danger)" /> Skill Gap ({rec.missing_skills?.length || 0})
                </div>
                {rec.missing_skills?.length ? (
                  <SkillList skills={rec.missing_skills} type="missing" />
                ) : (
                  <span className="text-sm muted">No skill gaps - great match!</span>
                )}
              </div>

              <div className="divider" style={{ margin: '8px 0' }} />
              <div className="flex-between">
                <div className="flex gap-1">
                  <button className="btn btn-sm btn-outline" onClick={() => openView(rec)}>
                    <EyeIcon size={14} /> View
                  </button>
                  <button className="btn btn-sm btn-primary" onClick={() => openApply(rec)}>
                    <SendIcon size={14} /> Apply
                  </button>
                </div>
                <span className="text-xs muted">{formatSalary(rec.salary_min, rec.salary_max)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      
      <div className="mb-3">
        <h2>External Jobs Matching Your Resume</h2>
        <p className="text-sm muted">
          Real vacancies matched with your extracted resume skills.
        </p>
      </div>

      {externalRecommendations.length > 0 && (
        <div className="card card-padded mb-3">
          <h3 className="mb-2">Filter External Jobs</h3>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Experience</label>
              <select
                className="form-control"
                value={experienceFilter}
                onChange={(e) => setExperienceFilter(e.target.value)}
              >
                <option value="All">All experience levels</option>
                <option value="Fresher">Fresher</option>
                <option value="Experienced">Experienced</option>
                <option value="Experience not specified">Not specified</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Skill</label>
              <input
                className="form-control"
                type="text"
                placeholder="Search a skill, e.g. Python"
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                className="form-control"
                type="text"
                placeholder="Search location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Minimum match score: {minMatchScore}%</label>
              <input
                className="form-control"
                type="range"
                min="0"
                max="100"
                step="5"
                value={minMatchScore}
                onChange={(e) => setMinMatchScore(e.target.value)}
              />
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setExperienceFilter('All')
              setSkillFilter('')
              setLocationFilter('')
              setMinMatchScore('0')
            }}
          >
            Clear filters
          </button>
          <span className="text-xs muted" style={{ marginLeft: 12 }}>
            Showing {filteredExternalRecommendations.length} of {externalRecommendations.length} jobs
          </span>
        </div>
      )}

      {externalRecommendations.length === 0 ? (
        <div className="card card-padded">
          <EmptyState
            icon={BriefcaseIcon}
            title="No external recommendations found"
            description="Try refreshing your recommendations later."
          />
        </div>
      ) : filteredExternalRecommendations.length === 0 ? (
        <div className="card card-padded">
          <EmptyState
            icon={BriefcaseIcon}
            title="No jobs match these filters"
            description="Try changing or clearing your filters to see more jobs."
          />
        </div>
      ) : (
        <div className="grid mb-4">
          {filteredExternalRecommendations.map((job) => (
            <div key={job.id} className="card card-padded recommendation-card">
              <div className="job-card-top">
                <div>
                  <h3 className="job-title">{job.job_title}</h3>
                  <div className="job-company">
                    {job.job_company || 'Company not specified'}
                  </div>
                  <p className="text-sm muted">
                    {job.job_location}
                  </p>
                </div>
                <MatchScore score={job.match_score} />
              </div>

              <div className="job-meta">
                <Badge color="secondary">Adzuna External Job</Badge>
                <Badge color={job.experience_category === 'Fresher' ? 'success' : 'secondary'}>
                  {job.experience_category || 'Experience not specified'}
                </Badge>
              </div>

              <div className="mt-2">
                <div className="text-sm bold mb-1">
                  Matched Skills
                </div>
                <SkillList skills={job.matched_skills} type="matched" />
              </div>

              <div className="mt-2">
                <div className="text-sm bold mb-1">
                  Missing Skills
                </div>
                <SkillList skills={job.missing_skills} type="missing" />
              </div>

              <p className="text-sm muted mt-2">
                {job.description}
              </p>

              <div className="divider" />

              <div className="flex gap-2 flex-wrap">
                <a
                  href={job.redirect_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                >
                  Apply on Adzuna
                </a>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleMarkAsApplied(job)}
                  disabled={
                    savingExternalJobId === String(job.id) ||
                    appliedExternalJobIds.includes(String(job.id))
                  }
                >
                  {savingExternalJobId === String(job.id)
                    ? 'Saving...'
                    : appliedExternalJobIds.includes(String(job.id))
                      ? 'Saved in My Applications'
                      : 'Mark as Applied'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}


      {/* View Job Details modal */}
      <Modal
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title={viewTarget?.title || viewTarget?.job_title}
        size="lg"
      >
        {viewLoading ? (
          <LoadingState message="Loading job details..." />
        ) : viewError ? (
          <ErrorState message={viewError} onRetry={() => viewTarget && openView(viewTarget)} />
        ) : viewTarget ? (
          <div>
            <div className="flex-between mb-2 flex-wrap gap-2">
              <div>
                <div className="job-company text-lg bold">{viewTarget.company || viewTarget.job_company}</div>
                {(viewTarget.location || viewTarget.job_location) && (
                  <div className="text-sm muted flex gap-1" style={{ alignItems: 'center' }}>
                    <LocationIcon size={14} /> {viewTarget.location || viewTarget.job_location}
                  </div>
                )}
              </div>
              <MatchScore score={viewTarget.match_score} />
            </div>
            <div className="job-meta mb-3">
              <Badge color="secondary">{jobTypeLabel[viewTarget.job_type] || viewTarget.job_type}</Badge>
              <Badge color="secondary">{experienceLevelLabel[viewTarget.experience_level] || viewTarget.experience_level}</Badge>
              <Badge color="primary">{formatSalary(viewTarget.salary_min, viewTarget.salary_max)}</Badge>
            </div>

            <div className="mb-3">
              <div className="text-sm bold mb-1">Description</div>
              <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{viewTarget.description || 'No description provided.'}</p>
            </div>

            {viewTarget.requirements?.length > 0 && (
              <div className="mb-3">
                <div className="text-sm bold mb-1">Requirements</div>
                <ul className="text-sm" style={{ marginLeft: 18 }}>
                  {viewTarget.requirements.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}

            {viewTarget.responsibilities?.length > 0 && (
              <div className="mb-3">
                <div className="text-sm bold mb-1">Responsibilities</div>
                <ul className="text-sm" style={{ marginLeft: 18 }}>
                  {viewTarget.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}

            {viewTarget.skills_required?.length > 0 && (
              <div className="mb-3">
                <div className="text-sm bold mb-1">Skills Required</div>
                <div className="skills-list">
                  {viewTarget.skills_required.map((s, i) => (
                    <span key={i} className="skill-chip neutral">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {viewTarget.created_at && <p className="text-xs muted">Posted {formatDate(viewTarget.created_at)}</p>}

            <div className="flex gap-2 mt-3" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setViewTarget(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => { openApply(viewTarget); setViewTarget(null) }}>
                <SendIcon size={15} /> Apply Now
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Apply modal */}
      <Modal open={!!applyTarget} onClose={() => setApplyTarget(null)} title={`Apply for ${applyTarget?.job_title}`}>
        <p className="text-sm muted mb-3">{applyTarget?.job_company} • Match {Math.round(applyTarget?.match_score)}%</p>

        <div className="form-group">
          <label className="form-label">Select a Resume</label>
          {resumes.length === 0 ? (
            <p className="text-sm muted mb-2">You don't have any resumes yet. Upload one below or on your resume page.</p>
          ) : (
            <select className="form-control" value={applyResume} onChange={(e) => setApplyResume(e.target.value)}>
              <option value="">Select a resume...</option>
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.file_name} {r.is_analyzed ? '(analyzed)' : '(not analyzed)'} {r.is_primary ? '(primary)' : ''}
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
            <input type="file" accept=".pdf,.docx,.doc,.txt" hidden onChange={handleResumeUpload} disabled={uploadingResume} />
          </label>
          <div className="form-hint">Supported formats: PDF, DOCX, TXT (max 10MB). The uploaded resume will be selected automatically.</div>
          {uploadError && <div className="form-error">{uploadError}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">Cover Letter (optional)</label>
          <textarea className="form-control" placeholder="Briefly tell the recruiter why you're a good fit..."
            value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} />
        </div>

        <div className="flex gap-2 mt-3" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setApplyTarget(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleApply} disabled={applying || !applyResume || uploadingResume}>
            {applying && <span className="spinner" />}
            {applying ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </Modal>
    </div>
  )
}