import { useEffect, useState, useCallback, useRef } from 'react'

import { resumesApi } from '../../api/resumes'

import LoadingState from '../../components/ui/LoadingState'

import ErrorState from '../../components/ui/ErrorState'

import Badge from '../../components/ui/Badge'

import Modal from '../../components/ui/Modal'

import SkillList from '../../components/ui/SkillList'

import {

  UploadIcon, FileIcon, SparklesIcon, TrashIcon, CheckIcon, DownloadIcon, ClockIcon,

} from '../../components/Icons'

import { formatDateTime, getApiError } from '../../utils/helpers'



export default function SeekerResume() {

  const [resumes, setResumes] = useState([])

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState('')

  const [uploading, setUploading] = useState(false)

  const [analyzingId, setAnalyzingId] = useState(null)

  const [selected, setSelected] = useState(null)

  const [dragActive, setDragActive] = useState(false)

  const fileInputRef = useRef(null)



  const fetchResumes = useCallback(() => {

    setLoading(true)

    resumesApi

      .list()

      .then((res) => setResumes(res.data.results || res.data))

      .catch(() => setError('Failed to load your resumes.'))

      .finally(() => setLoading(false))

  }, [])



  useEffect(() => { fetchResumes() }, [fetchResumes])



  useEffect(() => {

    if (!error) return

    const timer = setTimeout(() => setError(''), 10000)

    return () => clearTimeout(timer)

  }, [error])



  const handleUpload = async (file) => {

    if (!file) return



    const allowed = /\.(pdf|docx?|txt)$/i.test(file.name)

    if (!allowed) {

      setError('Please choose a PDF, DOC, DOCX, or TXT file.')

      return

    }

    if (file.size > 10 * 1024 * 1024) {

      setError('File size must be 10MB or less.')

      return

    }



    setUploading(true)

    setError('')

    const formData = new FormData()

    formData.append('file', file)



    try {

      await resumesApi.upload(formData)

      fetchResumes()

      alert('Resume uploaded successfully. You can now analyze it with AI.')

    } catch (err) {

      setError(getApiError(err, 'Failed to upload resume. Please check file type and size (max 10MB, PDF/DOCX/TXT).'))

    } finally {

      setUploading(false)

      if (fileInputRef.current) fileInputRef.current.value = ''

    }

  }



  const handleFileChange = (e) => handleUpload(e.target.files?.[0])



  const handleDrop = (e) => {

    e.preventDefault()

    setDragActive(false)

    handleUpload(e.dataTransfer.files?.[0])

  }



  const handleAnalyze = async (id) => {

    setAnalyzingId(id)

    setError('')

    try {

      await resumesApi.analyze(id)

      fetchResumes()

      alert('Resume analysis completed successfully!')

    } catch (err) {

      const msg = getApiError(err, 'Resume analysis failed. Check that GEMINI_API_KEY is configured on the server.')

      setError(msg)

      alert(msg)

      fetchResumes()

    } finally {

      setAnalyzingId(null)

    }

  }



  const handleDelete = async (id) => {

    if (!window.confirm('Delete this resume?')) return

    try {

      await resumesApi.delete(id)

      if (selected?.id === id) setSelected(null)

      fetchResumes()

    } catch (err) {

      setError(getApiError(err, 'Failed to delete resume.'))

    }

  }



  const handleSetPrimary = async (id) => {

    try {

      await resumesApi.setPrimary(id)

      fetchResumes()

    } catch (err) {

      setError(getApiError(err, 'Failed to set resume as primary.'))

    }

  }



  const statusBadge = (status) => {

    if (status === 'completed') return <Badge color="success">Analyzed</Badge>

    if (status === 'processing' || status === 'pending') return <Badge color="warning">{status}</Badge>

    if (status === 'failed') return <Badge color="danger">Failed</Badge>

    return <Badge color="secondary">{status || 'Not analyzed'}</Badge>

  }



  const analyzedCount = resumes.filter((resume) => resume.is_analyzed).length

  const primaryResume = resumes.find((resume) => resume.is_primary)



  if (loading) return <LoadingState message="Loading your resumes..." />



  return (

    <div className="seeker-resume-page">

      <style>{`

        .seeker-resume-page {

          --resume-accent: var(--primary, #7257df);

          --resume-ink: var(--text, #19172b);

          --resume-muted: var(--text-muted, #77758a);

          animation: resume-page-enter .35s ease both;

        }

        .seeker-resume-page * { box-sizing: border-box; }

        .seeker-resume-page .resume-heading {

          display:flex; justify-content:space-between; align-items:flex-start;

          gap:18px; flex-wrap:wrap; margin-bottom:22px;

        }

        .seeker-resume-page .resume-eyebrow {

          display:inline-flex; align-items:center; gap:7px; margin-bottom:9px;

          color:var(--resume-accent); font-size:11px; font-weight:800;

          letter-spacing:.11em; text-transform:uppercase;

        }

        .seeker-resume-page .resume-title {

          margin:0; color:var(--resume-ink); font-size:clamp(25px,3vw,34px);

          line-height:1.15; letter-spacing:-.04em; font-weight:800;

        }

        .seeker-resume-page .resume-subtitle {

          margin:9px 0 0; color:var(--resume-muted); font-size:14px; line-height:1.65;

          max-width:620px;

        }

        .seeker-resume-page .resume-stats {

          display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:13px;

          margin-bottom:20px;

        }

        .seeker-resume-page .resume-stat {

          padding:17px 18px; border:1px solid var(--border);

          border-radius:16px; background:var(--surface);

          box-shadow:0 5px 18px rgba(30,24,65,.035);

        }

        .seeker-resume-page .resume-stat-label {

          color:var(--resume-muted); font-size:11px; font-weight:700;

          text-transform:uppercase; letter-spacing:.07em;

        }

        .seeker-resume-page .resume-stat-value {

          margin-top:7px; color:var(--resume-ink); font-size:25px;

          font-weight:800; letter-spacing:-.04em;

        }

        .seeker-resume-page .resume-upload-panel {

          position:relative; overflow:hidden; padding:22px; margin-bottom:22px;

          border:1px solid var(--border); border-radius:19px;

          background:var(--surface); box-shadow:0 8px 28px rgba(30,24,65,.055);

        }

        .seeker-resume-page .resume-upload-panel::before {

          content:""; position:absolute; inset:0 0 auto; height:3px;

          background:linear-gradient(90deg,var(--resume-accent),#a78bfa,#67d6c0);

        }

        .seeker-resume-page .resume-upload-top {

          display:flex; justify-content:space-between; align-items:flex-start;

          gap:14px; margin-bottom:17px;

        }

        .seeker-resume-page .resume-section-title {

          margin:0; color:var(--resume-ink); font-size:16px; font-weight:800;

        }

        .seeker-resume-page .resume-section-copy {

          margin:5px 0 0; color:var(--resume-muted); font-size:12px; line-height:1.6;

        }

        .seeker-resume-page .resume-dropzone {

          display:flex; flex-direction:column; align-items:center; justify-content:center;

          min-height:174px; padding:24px; text-align:center; cursor:pointer;

          border:1.5px dashed var(--border); border-radius:15px;

          background:var(--surface-muted,rgba(120,105,180,.035));

          transition:border-color .2s ease, background .2s ease, transform .2s ease;

        }

        .seeker-resume-page .resume-dropzone:hover,

        .seeker-resume-page .resume-dropzone.is-active {

          border-color:var(--resume-accent); background:rgba(114,87,223,.065);

        }

        .seeker-resume-page .resume-dropzone.is-active { transform:scale(.995); }

        .seeker-resume-page .resume-upload-icon {

          display:grid; place-items:center; width:48px; height:48px;

          margin-bottom:12px; border-radius:15px; color:var(--resume-accent);

          background:rgba(114,87,223,.11);

        }

        .seeker-resume-page .resume-drop-title {

          color:var(--resume-ink); font-size:14px; font-weight:800;

        }

        .seeker-resume-page .resume-drop-copy {

          margin-top:5px; color:var(--resume-muted); font-size:12px;

        }

        .seeker-resume-page .resume-file-types {

          display:flex; justify-content:center; flex-wrap:wrap; gap:7px; margin-top:13px;

        }

        .seeker-resume-page .resume-file-type {

          padding:4px 8px; border:1px solid var(--border); border-radius:7px;

          color:var(--resume-muted); font-size:10px; font-weight:800; letter-spacing:.04em;

        }

        .seeker-resume-page .resume-list-heading {

          display:flex; justify-content:space-between; align-items:center;

          gap:12px; margin:0 0 13px;

        }

        .seeker-resume-page .resume-list-title {

          margin:0; color:var(--resume-ink); font-size:17px; font-weight:800;

        }

        .seeker-resume-page .resume-list-count {

          color:var(--resume-muted); font-size:12px;

        }

        .seeker-resume-page .resume-grid {

          display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:15px;

        }

        .seeker-resume-page .resume-card {

          position:relative; min-width:0; padding:18px; overflow:hidden;

          border:1px solid var(--border); border-radius:17px; background:var(--surface);

          box-shadow:0 6px 22px rgba(30,24,65,.04);

          transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease;

          animation:resume-card-enter .4s ease both;

        }

        .seeker-resume-page .resume-card:hover {

          transform:translateY(-3px); border-color:var(--resume-accent);

          box-shadow:0 13px 28px rgba(92,63,190,.10);

        }

        .seeker-resume-page .resume-card-top {

          display:flex; align-items:flex-start; justify-content:space-between; gap:12px;

        }

        .seeker-resume-page .resume-file-icon {

          display:grid; place-items:center; flex:0 0 43px; width:43px; height:43px;

          border-radius:13px; color:var(--resume-accent); background:rgba(114,87,223,.10);

        }

        .seeker-resume-page .resume-file-name {

          margin:0; color:var(--resume-ink); font-size:14px; font-weight:800;

          overflow-wrap:anywhere; line-height:1.45;

        }

        .seeker-resume-page .resume-file-meta {

          margin-top:5px; color:var(--resume-muted); font-size:11px; line-height:1.5;

        }

        .seeker-resume-page .resume-badges {

          display:flex; justify-content:flex-end; align-items:center; flex-wrap:wrap; gap:6px;

        }

        .seeker-resume-page .resume-card-divider {

          height:1px; margin:16px 0 13px; background:var(--border);

        }

        .seeker-resume-page .resume-card-actions {

          display:flex; flex-wrap:wrap; align-items:center; gap:8px;

        }

        .seeker-resume-page .resume-card-actions .btn { transition:transform .18s ease,box-shadow .18s ease; }

        .seeker-resume-page .resume-card-actions .btn:not(:disabled):hover { transform:translateY(-1px); }

        .seeker-resume-page .resume-empty {

          padding:32px 18px; border:1px solid var(--border); border-radius:17px;

          background:var(--surface); text-align:center;

        }

        .seeker-resume-page .resume-empty-icon {

          display:grid; place-items:center; width:54px; height:54px; margin:0 auto 12px;

          border-radius:17px; color:var(--resume-accent); background:rgba(114,87,223,.10);

        }

        .seeker-resume-page .resume-modal-section {

          padding:15px; border:1px solid var(--border); border-radius:13px;

          background:var(--surface); min-width:0;

        }

        .seeker-resume-page .resume-modal-label {

          margin-bottom:7px; color:var(--resume-muted); font-size:10px;

          font-weight:800; letter-spacing:.08em; text-transform:uppercase;

        }

        .seeker-resume-page .resume-modal-value {

          color:var(--resume-ink); font-size:13px; font-weight:650; overflow-wrap:anywhere;

        }

        .seeker-resume-page .resume-modal-block { margin-top:15px; }

        .seeker-resume-page .resume-modal-heading {

          margin:0 0 9px; color:var(--resume-ink); font-size:13px; font-weight:800;

        }

        .seeker-resume-page .resume-detail-list { display:flex; flex-direction:column; gap:8px; }

        .seeker-resume-page .resume-detail-item {

          padding:11px 13px; border:1px solid var(--border); border-radius:11px;

          background:var(--surface-muted,var(--surface));

        }

        .seeker-resume-page .resume-error { margin-bottom:16px; }

        @keyframes resume-page-enter {

          from { opacity:0; transform:translateY(8px); }

          to { opacity:1; transform:translateY(0); }

        }

        @keyframes resume-card-enter {

          from { opacity:0; transform:translateY(9px); }

          to { opacity:1; transform:translateY(0); }

        }

        @media(max-width:760px) {

          .seeker-resume-page .resume-grid { grid-template-columns:1fr; }

        }

        @media(max-width:520px) {

          .seeker-resume-page .resume-stats { gap:8px; }

          .seeker-resume-page .resume-stat { padding:13px 11px; }

          .seeker-resume-page .resume-stat-value { font-size:21px; }

          .seeker-resume-page .resume-upload-panel { padding:16px; }

          .seeker-resume-page .resume-card { padding:15px; }

          .seeker-resume-page .resume-card-top { flex-direction:column; }

          .seeker-resume-page .resume-badges { justify-content:flex-start; }

        }

        @media(prefers-reduced-motion:reduce) {

          .seeker-resume-page,.seeker-resume-page .resume-card {

            animation:none !important; transition:none !important;

          }

          .seeker-resume-page .resume-card:hover { transform:none; }

        }

      `}</style>



      <div className="resume-heading">

        <div>

          <div className="resume-eyebrow"><SparklesIcon size={14} /> AI Career Studio</div>

          <h1 className="resume-title">My Resume</h1>

          <p className="resume-subtitle">

            Manage your resumes, extract your professional profile, and use AI insights

            to find roles that match your skills.

          </p>

        </div>

      </div>



      {error && <div className="resume-error"><ErrorState message={error} /></div>}



      <div className="resume-stats">

        <div className="resume-stat">

          <div className="resume-stat-label">Total resumes</div>

          <div className="resume-stat-value">{resumes.length}</div>

        </div>

        <div className="resume-stat">

          <div className="resume-stat-label">AI analyzed</div>

          <div className="resume-stat-value">{analyzedCount}</div>

        </div>

        <div className="resume-stat">

          <div className="resume-stat-label">Primary resume</div>

          <div className="resume-stat-value" style={{ fontSize: primaryResume ? 16 : 19, paddingTop: primaryResume ? 5 : 0 }}>

            {primaryResume ? 'Selected' : 'Not set'}

          </div>

        </div>

      </div>



      <section className="resume-upload-panel">

        <div className="resume-upload-top">

          <div>

            <h2 className="resume-section-title">Upload your resume</h2>

            <p className="resume-section-copy">Add your latest resume to get started with AI-powered analysis.</p>

          </div>

          <div className="resume-eyebrow" style={{ margin: 0 }}><SparklesIcon size={13} /> AI ready</div>

        </div>



        <label

          className={`resume-dropzone ${dragActive ? 'is-active' : ''}`}

          onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}

          onDragLeave={() => setDragActive(false)}

          onDrop={handleDrop}

          htmlFor="resume-file-input"

        >

          <span className="resume-upload-icon">

            {uploading ? <span className="spinner" /> : <UploadIcon size={22} />}

          </span>

          <span className="resume-drop-title">

            {uploading ? 'Uploading your resume...' : 'Drop your resume here or browse files'}

          </span>

          <span className="resume-drop-copy">Choose a file from your device. Maximum file size is 10MB.</span>

          <span className="resume-file-types">

            <span className="resume-file-type">PDF</span>

            <span className="resume-file-type">DOC</span>

            <span className="resume-file-type">DOCX</span>

            <span className="resume-file-type">TXT</span>

          </span>

          <input

            ref={fileInputRef}

            id="resume-file-input"

            type="file"

            accept=".pdf,.docx,.doc,.txt"

            hidden

            onChange={handleFileChange}

            disabled={uploading}

          />

        </label>

      </section>



      <div className="resume-list-heading">

        <h2 className="resume-list-title">Your resumes</h2>

        <span className="resume-list-count">{resumes.length} {resumes.length === 1 ? 'file' : 'files'}</span>

      </div>



      {resumes.length === 0 ? (

        <div className="resume-empty">

          <div className="resume-empty-icon"><FileIcon size={24} /></div>

          <h3 className="resume-section-title">No resumes uploaded yet</h3>

          <p className="resume-section-copy">

            Upload your resume above. Then run AI analysis to extract your skills, education, and experience.

          </p>

        </div>

      ) : (

        <div className="resume-grid">

          {resumes.map((r) => (

            <article key={r.id} className="resume-card">

              <div className="resume-card-top">

                <div className="flex gap-2" style={{ alignItems: 'center', minWidth: 0 }}>

                  <div className="resume-file-icon"><FileIcon size={21} /></div>

                  <div style={{ minWidth: 0 }}>

                    <h3 className="resume-file-name">{r.file_name}</h3>

                    <div className="resume-file-meta">

                      <ClockIcon size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />

                      {formatDateTime(r.created_at)} · {(r.file_size / 1024).toFixed(1)} KB

                    </div>

                  </div>

                </div>

                <div className="resume-badges">

                  {r.is_primary && <Badge color="info">Primary</Badge>}

                  {statusBadge(r.analysis_status)}

                </div>

              </div>



              <div className="resume-card-divider" />

              <div className="resume-card-actions">

                <button className="btn btn-sm btn-primary" onClick={() => setSelected(r)}>

                  <SparklesIcon size={14} /> {r.is_analyzed ? 'View Analysis' : 'Preview Details'}

                </button>

                {!r.is_analyzed && (

                  <button

                    className="btn btn-sm btn-secondary"

                    onClick={() => handleAnalyze(r.id)}

                    disabled={analyzingId === r.id}

                  >

                    {analyzingId === r.id && <span className="spinner" />}

                    {analyzingId === r.id ? 'Analyzing...' : 'Run AI Analysis'}

                  </button>

                )}

                {!r.is_primary && (

                  <button className="btn btn-sm btn-outline" onClick={() => handleSetPrimary(r.id)} disabled={analyzingId === r.id}>

                    <CheckIcon size={14} /> Set Primary

                  </button>

                )}

                {r.file && (

                  <button className="btn btn-sm btn-outline" onClick={() => window.open(r.file, '\_blank', 'noopener,noreferrer')}>

                    <DownloadIcon size={14} /> Download

                  </button>

                )}

                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r.id)}>

                  <TrashIcon size={14} /> Delete

                </button>

              </div>

            </article>

          ))}

        </div>

      )}



      <Modal open={!!selected} onClose={() => setSelected(null)} title="Resume AI Analysis" size="lg">

        {selected && (

          <div className="seeker-resume-page">

            <div className="resume-modal-section" style={{ marginBottom: 14 }}>

              <div className="resume-eyebrow"><SparklesIcon size={13} /> Extracted profile</div>

              <div className="grid grid-3">

                <div>

                  <div className="resume-modal-label">Full name</div>

                  <div className="resume-modal-value">{selected.full_name || '-'}</div>

                </div>

                <div>

                  <div className="resume-modal-label">Email</div>

                  <div className="resume-modal-value">{selected.email || '-'}</div>

                </div>

                <div>

                  <div className="resume-modal-label">Phone</div>

                  <div className="resume-modal-value">{selected.phone || '-'}</div>

                </div>

              </div>

            </div>



            {selected.summary && (

              <section className="resume-modal-section resume-modal-block">

                <h3 className="resume-modal-heading">Professional summary</h3>

                <p className="text-sm muted" style={{ lineHeight: 1.7, margin: 0 }}>{selected.summary}</p>

              </section>

            )}



            <section className="resume-modal-block">

              <h3 className="resume-modal-heading">Skills ({selected.skills?.length || 0})</h3>

              <div className="resume-modal-section">

                <SkillList skills={selected.skills} type="neutral" />

              </div>

            </section>



            <section className="resume-modal-block">

              <h3 className="resume-modal-heading">Education</h3>

              {selected.education?.length ? (

                <div className="resume-detail-list">

                  {selected.education.map((ed, i) => {

                    if (typeof ed === 'string') {

                      return <div key={i} className="resume-detail-item text-sm">{ed}</div>

                    }

                    const education = ed || {}

                    const degree = education.degree || education.qualification || education.course ||

                      education.program || education.title || education.name || education.field_of_study ||

                      education.field || education.branch || ''

                    const institution = education.institution || education.institution_name ||

                      education.college || education.university || education.school || education.school_name || ''

                    const years = education.years || education.year || education.graduation_year || education.duration || ''

                    const knownKeys = [

                      'degree', 'qualification', 'course', 'program', 'title', 'name', 'field_of_study',

                      'field', 'branch', 'institution', 'institution_name', 'college', 'university',

                      'school', 'school_name', 'years', 'year', 'graduation_year', 'duration',

                    ]

                    const extraDetails = Object.entries(education)

                      .filter(([key, value]) => value && !knownKeys.includes(key.toLowerCase()))

                      .map(([, value]) => typeof value === 'string' || typeof value === 'number' ? String(value) : '')

                      .filter(Boolean)

                    return (

                      <div key={i} className="resume-detail-item">

                        {degree && <div className="text-sm bold">{degree}</div>}

                        {institution && <div className="text-xs muted">{institution}</div>}

                        {years && <div className="text-xs muted">{years}</div>}

                        {!degree && !institution && !years && (

                          <div className="text-sm">{extraDetails.join(' · ') || 'Education details unavailable'}</div>

                        )}

                      </div>

                    )

                  })}

                </div>

              ) : <span className="text-xs muted">No education found</span>}

            </section>



            <section className="resume-modal-block">

              <h3 className="resume-modal-heading">Work experience</h3>

              {selected.experience?.length ? (

                <div className="resume-detail-list">

                  {selected.experience.map((exp, i) => (

                    <div key={i} className="resume-detail-item">

                      <div className="text-sm bold">{exp.title || 'Role not specified'}</div>

                      {exp.company && <div className="text-xs muted">{exp.company}</div>}

                      {exp.duration && <div className="text-xs muted">{exp.duration}</div>}

                      {exp.description && <p className="text-sm muted" style={{ margin: '7px 0 0', lineHeight: 1.6 }}>{exp.description}</p>}

                    </div>

                  ))}

                </div>

              ) : <span className="text-xs muted">No experience found</span>}

            </section>



            {selected.certifications?.length > 0 && (

              <section className="resume-modal-block">

                <h3 className="resume-modal-heading">Certifications</h3>

                <div className="resume-modal-section">

                  <SkillList skills={selected.certifications} type="neutral" />

                </div>

              </section>

            )}

          </div>

        )}

      </Modal>

    </div>

  )

}
