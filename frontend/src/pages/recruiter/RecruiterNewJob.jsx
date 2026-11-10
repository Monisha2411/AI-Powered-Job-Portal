import { useNavigate } from 'react-router-dom'
import JobForm from '../../components/JobForm'
import { SparklesIcon, BriefcaseIcon, UsersIcon, TargetIcon } from '../../components/Icons'

export default function RecruiterNewJob() {
  const navigate = useNavigate()

  const handleSuccess = (job) => {
    navigate(`/recruiter/applicants?job=${job.id}`)
  }

  return (
    <div className="recruiter-new-job-page">
      <style>{`
        .recruiter-new-job-page { animation: newJobEnter .4s ease both; }
        @keyframes newJobEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .recruiter-new-job-page .topbar { margin-bottom: 22px; }
        .recruiter-new-job-page .page-title { display: flex; align-items: center; gap: 10px; letter-spacing: -.035em; }
        .recruiter-new-job-page .title-icon {
          display: grid; place-items: center; width: 42px; height: 42px; flex: 0 0 42px;
          border-radius: 13px; color: #c4b5fd; background: rgba(139,92,246,.16);
          border: 1px solid rgba(167,139,250,.23);
        }
        .recruiter-new-job-page .page-subtitle { margin-top: 7px; max-width: 650px; line-height: 1.65; }
        .recruiter-new-job-page .new-job-intro {
          position: relative; overflow: hidden; display: flex; align-items: center; justify-content: space-between;
          gap: 20px; padding: 20px 23px; margin-bottom: 20px; border-radius: 17px;
          border: 1px solid rgba(167,139,250,.2);
          background: linear-gradient(110deg,rgba(112,78,190,.14),rgba(91,72,154,.055));
        }
        .recruiter-new-job-page .intro-copy { max-width: 620px; }
        .recruiter-new-job-page .intro-title { margin: 0 0 5px; font-size: 13px; font-weight: 750; }
        .recruiter-new-job-page .intro-description { margin: 0; color: var(--text-muted,#9692a8); font-size: 12px; line-height: 1.65; }
        .recruiter-new-job-page .intro-icon {
          display: grid; place-items: center; width: 43px; height: 43px; flex: 0 0 43px;
          border-radius: 13px; color: #c4b5fd; background: rgba(139,92,246,.16);
        }
        .recruiter-new-job-page .form-shell {
          padding: clamp(16px,2.5vw,25px); border: 1px solid var(--border-color,rgba(151,130,220,.18));
          border-radius: 19px; background: var(--card-bg,rgba(255,255,255,.025));
        }
        .recruiter-new-job-page .process-strip {
          display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 10px; margin-top: 18px;
        }
        .recruiter-new-job-page .process-item {
          display: flex; align-items: center; gap: 9px; padding: 12px;
          border: 1px solid var(--border-color,rgba(151,130,220,.14)); border-radius: 12px;
          background: var(--card-bg,rgba(255,255,255,.018));
        }
        .recruiter-new-job-page .process-item-icon {
          width: 30px; height: 30px; flex: 0 0 30px; display: grid; place-items: center;
          border-radius: 9px; color: #bda8ff; background: rgba(139,92,246,.13);
        }
        .recruiter-new-job-page .process-item-text { font-size: 11px; font-weight: 650; line-height: 1.4; }
        @media (max-width: 640px) {
          .recruiter-new-job-page .new-job-intro { padding: 16px; }
          .recruiter-new-job-page .process-strip { grid-template-columns: 1fr; }
          .recruiter-new-job-page .intro-icon { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .recruiter-new-job-page,.recruiter-new-job-page * { animation: none !important; transition: none !important; }
        }
      `}</style>

      <div className="topbar">
        <div>
          <h1 className="page-title">
            <span className="title-icon"><SparklesIcon size={22} /></span>
            Post a New Job
          </h1>
          <p className="page-subtitle">
            Add your job details. AI will analyze the role and extract key skills and requirements for candidate matching.
          </p>
        </div>
      </div>

      <section className="new-job-intro">
        <div className="intro-copy">
          <h2 className="intro-title">Create a clear, complete job posting</h2>
          <p className="intro-description">
            Include accurate responsibilities, qualifications and skills. This information helps candidates understand the role and supports AI-based matching.
          </p>
        </div>
        <div className="intro-icon"><SparklesIcon size={21} /></div>
      </section>

      <section className="form-shell">
        <JobForm onSuccess={handleSuccess} />
      </section>

      <div className="process-strip">
        <div className="process-item">
          <span className="process-item-icon"><BriefcaseIcon size={15} /></span>
          <span className="process-item-text">Add job information</span>
        </div>
        <div className="process-item">
          <span className="process-item-icon"><SparklesIcon size={15} /></span>
          <span className="process-item-text">AI analyzes role requirements</span>
        </div>
        <div className="process-item">
          <span className="process-item-icon"><UsersIcon size={15} /></span>
          <span className="process-item-text">Review candidate applications</span>
        </div>
      </div>
    </div>
  )
}
