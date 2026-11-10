import { useState } from 'react'
import { AlertIcon, SparklesIcon, BriefcaseIcon, TargetIcon } from './Icons'
import { jobsApi } from '../api/jobs'
import { getApiError, jobTypeLabel, experienceLevelLabel } from '../utils/helpers'

const emptyForm = {
  title: '',
  description: '',
  company: '',
  location: '',
  job_type: 'full_time',
  experience_level: 'mid',
  status: 'open',
  salary_min: '',
  salary_max: '',
  requirements_text: '',
}

export default function JobForm({ initial, onSuccess, submitLabel = 'Create Job' }) {
  const [form, setForm] = useState(
    initial ? { ...emptyForm, ...initial, requirements_text: (initial.requirements || []).join('\n') } : { ...emptyForm }
  )
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [aiRequirements, setAiRequirements] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const errors = {}
    if (!form.title.trim()) errors.title = 'Job title is required'
    if (!form.company.trim()) errors.company = 'Company name is required'
    if (!form.description.trim()) errors.description = 'Job description is required'
    return errors
  }

  const handleAnalyze = async () => {
    setError('')
    if (!form.description.trim()) {
      setFieldErrors({ description: 'Please enter a job description first to analyze.' })
      return
    }
    setAnalyzing(true)
    try {
      const payload = {
        ...form,
        requirements: form.requirements_text.split('\n').filter((r) => r.trim()),
        salary_min: form.salary_min || null,
        salary_max: form.salary_max || null,
      }
      const jobRes = initial
        ? await jobsApi.update(initial.id, payload)
        : await jobsApi.create(payload)
      const res = await jobsApi.analyze(jobRes.data.id)
      setAiRequirements(res.data)
      const fresh = await jobsApi.get(jobRes.data.id)
      alert(initial ? 'Job updated and analyzed successfully.' : 'Job created and analyzed successfully.')
      onSuccess && onSuccess(fresh.data)
    } catch (err) {
      setError(getApiError(err, 'Failed to create and analyze job.'))
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setLoading(true)
    try {
      const payload = {
        ...form,
        requirements: form.requirements_text.split('\n').filter((r) => r.trim()),
        salary_min: form.salary_min || null,
        salary_max: form.salary_max || null,
      }
      const res = initial
        ? await jobsApi.update(initial.id, payload)
        : await jobsApi.create(payload)
      onSuccess && onSuccess(res.data)
    } catch (err) {
      setError(getApiError(err, 'Failed to save job.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="job-form-redesign">
      <style>{`
        .job-form-redesign { display: flex; flex-direction: column; gap: 19px; }
        .job-form-redesign .form-alert {
          display: flex; align-items: flex-start; gap: 9px; padding: 12px 14px;
          border: 1px solid rgba(248,113,113,.25); border-radius: 11px;
          background: rgba(239,68,68,.09); color: #f87171; font-size: 12px; line-height: 1.55;
        }
        .job-form-redesign .form-section { min-width: 0; }
        .job-form-redesign .section-heading {
          display: flex; align-items: center; gap: 9px; margin-bottom: 14px;
          padding-bottom: 10px; border-bottom: 1px solid var(--border-color,rgba(151,130,220,.15));
        }
        .job-form-redesign .section-icon {
          display: grid; place-items: center; width: 30px; height: 30px; flex: 0 0 30px;
          border-radius: 9px; color: #bda8ff; background: rgba(139,92,246,.14);
        }
        .job-form-redesign .section-title { margin: 0; font-size: 13px; font-weight: 750; }
        .job-form-redesign .section-caption { color: var(--text-muted,#9692a8); font-size: 11px; margin-top: 3px; }
        .job-form-redesign .form-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 15px; }
        .job-form-redesign .form-grid-three { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 15px; }
        .job-form-redesign .form-group { min-width: 0; margin-bottom: 14px; }
        .job-form-redesign .form-label { display: block; margin-bottom: 7px; font-size: 12px; font-weight: 650; color: var(--text-secondary,#c2bdd2); }
        .job-form-redesign .required-mark { color: #a78bfa; }
        .job-form-redesign .form-control { width: 100%; min-width: 0; }
        .job-form-redesign textarea.form-control { resize: vertical; line-height: 1.65; }
        .job-form-redesign .form-hint { color: var(--text-muted,#9692a8); font-size: 11px; line-height: 1.5; margin-top: 6px; }
        .job-form-redesign .field-error { color: #f87171; font-size: 11px; margin-top: 6px; }
        .job-form-redesign .requirements-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
        .job-form-redesign .optional-label { color: var(--text-muted,#9692a8); font-size: 10px; }
        .job-form-redesign .form-actions {
          display: flex; align-items: center; justify-content: flex-end; gap: 10px; flex-wrap: wrap;
          padding-top: 17px; border-top: 1px solid var(--border-color,rgba(151,130,220,.15));
        }
        .job-form-redesign .ai-results {
          padding: 18px; border: 1px solid rgba(167,139,250,.24); border-radius: 15px;
          background: linear-gradient(130deg,rgba(112,78,190,.13),rgba(91,72,154,.055));
        }
        .job-form-redesign .ai-results-title { display: flex; align-items: center; gap: 8px; margin: 0 0 15px; font-size: 14px; font-weight: 750; }
        .job-form-redesign .ai-results-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 15px; }
        .job-form-redesign .ai-results-label { font-size: 11px; font-weight: 700; margin-bottom: 8px; }
        .job-form-redesign .ai-results-skills { display: flex; flex-wrap: wrap; gap: 6px; }
        .job-form-redesign .ai-empty { color: var(--text-muted,#9692a8); font-size: 11px; }
        @media (max-width: 700px) {
          .job-form-redesign .form-grid-three { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 520px) {
          .job-form-redesign .form-grid,.job-form-redesign .form-grid-three,.job-form-redesign .ai-results-grid { grid-template-columns: 1fr; gap: 0; }
          .job-form-redesign .form-actions { justify-content: stretch; }
          .job-form-redesign .form-actions .btn { flex: 1 1 100%; justify-content: center; }
        }
        @media (prefers-reduced-motion: reduce) {
          .job-form-redesign,.job-form-redesign * { animation: none !important; transition: none !important; }
        }
      `}</style>

      {error && <div className="form-alert"><AlertIcon size={16} /> <span>{error}</span></div>}

      <section className="form-section">
        <div className="section-heading">
          <span className="section-icon"><BriefcaseIcon size={15} /></span>
          <div><h3 className="section-title">Job information</h3><div className="section-caption">Add the role and company details.</div></div>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="job-title">Job Title <span className="required-mark">*</span></label>
            <input id="job-title" type="text" name="title" className="form-control" placeholder="e.g. Senior React Developer" value={form.title} onChange={handleChange} />
            {fieldErrors.title && <div className="field-error">{fieldErrors.title}</div>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="job-company">Company <span className="required-mark">*</span></label>
            <input id="job-company" type="text" name="company" className="form-control" placeholder="Company name" value={form.company} onChange={handleChange} />
            {fieldErrors.company && <div className="field-error">{fieldErrors.company}</div>}
          </div>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="job-location">Location</label>
            <input id="job-location" type="text" name="location" className="form-control" placeholder="City, State or Remote" value={form.location} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="job-type">Job Type</label>
            <select id="job-type" name="job_type" className="form-control" value={form.job_type} onChange={handleChange}>
              {Object.entries(jobTypeLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="job-status">Status</label>
          <select id="job-status" name="status" className="form-control" value={form.status} onChange={handleChange}>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
          <div className="form-hint">Open jobs appear to job seekers and in recommendations.</div>
        </div>
      </section>

      <section className="form-section">
        <div className="section-heading">
          <span className="section-icon"><TargetIcon size={15} /></span>
          <div><h3 className="section-title">Experience and compensation</h3><div className="section-caption">Set the expected experience level and salary range.</div></div>
        </div>
        <div className="form-grid-three">
          <div className="form-group">
            <label className="form-label" htmlFor="job-experience">Experience Level</label>
            <select id="job-experience" name="experience_level" className="form-control" value={form.experience_level} onChange={handleChange}>
              {Object.entries(experienceLevelLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="salary-min">Salary Min (USD)</label>
            <input id="salary-min" type="number" name="salary_min" className="form-control" placeholder="e.g. 60000" value={form.salary_min} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="salary-max">Salary Max (USD)</label>
            <input id="salary-max" type="number" name="salary_max" className="form-control" placeholder="e.g. 90000" value={form.salary_max} onChange={handleChange} />
          </div>
        </div>
      </section>

      <section className="form-section">
        <div className="section-heading">
          <span className="section-icon"><SparklesIcon size={15} /></span>
          <div><h3 className="section-title">Role description</h3><div className="section-caption">Explain the role, responsibilities and expectations.</div></div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="job-description">Job Description <span className="required-mark">*</span></label>
          <textarea id="job-description" name="description" className="form-control" style={{ minHeight: 160 }} placeholder="Describe the role, responsibilities, and requirements..." value={form.description} onChange={handleChange} />
          {fieldErrors.description && <div className="field-error">{fieldErrors.description}</div>}
        </div>
        <div className="form-group">
          <div className="requirements-heading">
            <label className="form-label" htmlFor="job-requirements">Key Requirements (one per line)</label>
            <span className="optional-label">Optional. AI also extracts requirements.</span>
          </div>
          <textarea id="job-requirements" name="requirements_text" className="form-control" style={{ minHeight: 105 }} placeholder={'Strong proficiency in JavaScript\nExperience with React and REST APIs\n...'} value={form.requirements_text} onChange={handleChange} />
        </div>
      </section>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={handleAnalyze} disabled={loading || analyzing}>
          {analyzing ? <span className="spinner" /> : <SparklesIcon size={16} />}
          {analyzing ? 'Analyzing...' : 'Create & Analyze with AI'}
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading || analyzing}>
          {loading && <span className="spinner" />}
          {loading ? 'Saving...' : submitLabel}
        </button>
      </div>

      {aiRequirements && (
        <section className="ai-results">
          <h4 className="ai-results-title"><SparklesIcon size={18} color="var(--primary)" /> AI Analysis Results</h4>
          <div className="ai-results-grid">
            <div>
              <div className="ai-results-label">Required Skills</div>
              <div className="ai-results-skills">
                {(aiRequirements.required_skills || []).length > 0
                  ? aiRequirements.required_skills.map((skill, index) => <span key={`required-${index}`} className="skill-chip neutral">{skill}</span>)
                  : <span className="ai-empty">No required skills returned.</span>}
              </div>
            </div>
            <div>
              <div className="ai-results-label">Preferred Skills</div>
              <div className="ai-results-skills">
                {(aiRequirements.preferred_skills || []).length > 0
                  ? aiRequirements.preferred_skills.map((skill, index) => <span key={`preferred-${index}`} className="skill-chip neutral">{skill}</span>)
                  : <span className="ai-empty">No preferred skills returned.</span>}
              </div>
            </div>
          </div>
        </section>
      )}
    </form>
  )
}
