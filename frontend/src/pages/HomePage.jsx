import { useNavigate, Link } from 'react-router-dom'
import Logo from '../components/ui/Logo'
import {
  SparklesIcon,
  UsersIcon,
  BriefcaseIcon,
  FileIcon,
  SearchIcon,
  TrendingUpIcon,
  TargetIcon,
} from '../components/Icons'

const features = [
  {
    icon: FileIcon,
    tone: 'primary',
    title: 'Smart Resume Analysis',
    description:
      'Upload your resume and let AI identify your skills, education, experience and certifications.',
    tag: 'For job seekers',
  },
  {
    icon: TargetIcon,
    tone: 'success',
    title: 'AI Job Matching',
    description:
      'Explore relevant opportunities with match scores and skill-gap insights based on your profile.',
    tag: 'Personalized matches',
  },
  {
    icon: UsersIcon,
    tone: 'warning',
    title: 'Recruiter Screening',
    description:
      'Review applicants against job requirements and compare candidates with AI-assisted insights.',
    tag: 'For recruiters',
  },
]

const steps = [
  {
    number: '01',
    icon: BriefcaseIcon,
    title: 'Create a job',
    description: 'Recruiters publish openings and define the skills and experience they need.',
  },
  {
    number: '02',
    icon: FileIcon,
    title: 'Build your profile',
    description: 'Job seekers add their details, upload a resume and apply for suitable roles.',
  },
  {
    number: '03',
    icon: TrendingUpIcon,
    title: 'Find the right match',
    description: 'AI compares skills and job requirements to surface useful match insights.',
  },
]

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="home-page">
      <header className="navbar home-navbar">
        <div className="navbar-inner">
          <Link to="/" aria-label="AI Job Portal home">
            <Logo />
          </Link>

          <div className="nav-links home-nav-actions">
            <span className="home-nav-caption">Your next opportunity starts here</span>
            <Link className="btn btn-outline btn-sm" to="/login">
              Sign in
            </Link>
            <Link className="btn btn-primary btn-sm" to="/register">
              Create account
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="hero home-hero">
          <div className="container home-hero-grid">
            <div className="home-hero-copy">
              <span className="badge badge-primary home-eyebrow">
                <SparklesIcon size={14} />
                AI-powered talent matching
              </span>

              <h1 className="hero-title">
                Find the right role.
                <span className="home-title-accent"> Meet the right talent.</span>
              </h1>

              <p className="hero-subtitle home-hero-subtitle">
                AI-JobPortal connects job seekers and recruiters through resume analysis,
                intelligent job recommendations and clear candidate matching insights.
              </p>

              <div className="home-hero-actions">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => navigate('/register')}
                >
                  Get started
                  <SearchIcon size={17} />
                </button>
                <button
                  className="btn btn-secondary btn-lg"
                  onClick={() => navigate('/login')}
                >
                  Sign in
                </button>
              </div>

              <div className="home-trust-line">
                <span className="home-trust-dot" />
                One platform for job seekers and hiring teams
              </div>
            </div>

            <div className="home-visual" aria-label="AI job matching overview">
              <div className="home-visual-glow" />
              <div className="home-visual-card home-visual-main">
                <div className="home-visual-top">
                  <div>
                    <span className="home-visual-kicker">MATCH OVERVIEW</span>
                    <h3>Profile match</h3>
                  </div>
                  <span className="home-ai-chip">
                    <SparklesIcon size={13} /> AI
                  </span>
                </div>

                <div className="home-match-score">
                  <div className="home-score-ring">
                    <div>
                      <strong>92%</strong>
                      <span>Match</span>
                    </div>
                  </div>
                  <div className="home-score-copy">
                    <strong>Strong profile fit</strong>
                    <span>Your skills align with this role</span>
                  </div>
                </div>

                <div className="home-skill-heading">
                  <span>Skill alignment</span>
                  <span>4 skills</span>
                </div>
                <div className="home-skill-row">
                  <span>React</span>
                  <div className="home-skill-track"><i style={{ width: '94%' }} /></div>
                  <b>94%</b>
                </div>
                <div className="home-skill-row">
                  <span>Python</span>
                  <div className="home-skill-track"><i style={{ width: '88%' }} /></div>
                  <b>88%</b>
                </div>
                <div className="home-skill-row">
                  <span>SQL</span>
                  <div className="home-skill-track"><i style={{ width: '82%' }} /></div>
                  <b>82%</b>
                </div>
              </div>

              <div className="home-floating-card home-floating-top">
                <span className="home-floating-icon"><TargetIcon size={17} /></span>
                <span><b>Smart matching</b><small>Skills and role fit</small></span>
              </div>

              <div className="home-floating-card home-floating-bottom">
                <span className="home-floating-icon success"><TrendingUpIcon size={17} /></span>
                <span><b>Clear insights</b><small>Understand your match</small></span>
              </div>
            </div>
          </div>
        </section>

        <section className="container home-features-section">
          <div className="home-section-heading">
            <span className="home-section-kicker">PLATFORM FEATURES</span>
            <h2>Everything you need to move forward</h2>
            <p>Useful tools for every step of the hiring process.</p>
          </div>

          <div className="grid grid-3 home-feature-grid">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <article className="card card-padded feature-card home-feature-card" key={feature.title}>
                  <div className={`feature-icon ${feature.tone}`}>
                    <Icon size={25} />
                  </div>
                  <span className="home-feature-tag">{feature.tag}</span>
                  <h3>{feature.title}</h3>
                  <p className="text-sm muted">{feature.description}</p>
                  <span className="home-feature-line" />
                </article>
              )
            })}
          </div>
        </section>

        <section className="home-process-section">
          <div className="container">
            <div className="home-section-heading">
              <span className="home-section-kicker">SIMPLE WORKFLOW</span>
              <h2>How the platform works</h2>
              <p>Three clear steps bring candidates and opportunities closer.</p>
            </div>

            <div className="grid grid-3 home-steps-grid">
              {steps.map((step) => {
                const Icon = step.icon
                return (
                  <article className="home-step-card" key={step.number}>
                    <div className="home-step-top">
                      <span className="home-step-number">{step.number}</span>
                      <span className="home-step-icon"><Icon size={21} /></span>
                    </div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="container home-cta-wrap">
          <div className="home-cta">
            <div>
              <span className="home-section-kicker">TAKE THE NEXT STEP</span>
              <h2>Make your next career move count.</h2>
              <p>Set up your account and explore the AI-JobPortal experience.</p>
            </div>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/register')}
            >
              Get started <SparklesIcon size={17} />
            </button>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <div className="container home-footer-inner">
          <Logo />
          <p className="text-sm muted">
            AI-JobPortal. Intelligent recruitment, powered by AI.
          </p>
        </div>
      </footer>

      <style>{`
        .home-page { overflow: hidden; }
        .home-navbar { position: relative; }
        .home-nav-actions { gap: 10px; }
        .home-nav-caption { margin-right: 8px; color: var(--text-muted); font-size: 12px; }
        .home-hero {
          position: relative;
          padding: 76px 0 88px;
          text-align: left;
          background:
            radial-gradient(ellipse at 78% 42%, rgba(126, 99, 235, .16), transparent 42%),
            radial-gradient(ellipse at 8% 0%, rgba(161, 138, 244, .12), transparent 38%);
        }
        .home-hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(360px, .95fr);
          align-items: center;
          gap: 56px;
        }
        .home-hero-copy { position: relative; z-index: 1; }
        .home-eyebrow { padding: 7px 13px; font-size: 11px; letter-spacing: .025em; }
        .home-hero .hero-title {
          max-width: 680px;
          margin: 23px 0 19px;
          font-size: clamp(39px, 5.2vw, 62px);
          line-height: 1.06;
          letter-spacing: -.06em;
        }
        .home-title-accent {
          display: block;
          color: var(--primary);
        }
        .home-hero-subtitle { max-width: 570px; margin: 0; font-size: 15px; line-height: 1.8; }
        .home-hero-actions { display: flex; flex-wrap: wrap; gap: 11px; margin-top: 27px; }
        .home-trust-line { display: flex; align-items: center; gap: 9px; margin-top: 25px; color: var(--text-muted); font-size: 11px; }
        .home-trust-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--success); box-shadow: 0 0 0 4px rgba(22,167,131,.12); }
        .home-visual { position: relative; min-height: 390px; display: flex; align-items: center; justify-content: center; }
        .home-visual-glow { position: absolute; width: 340px; height: 340px; border-radius: 50%; background: rgba(126,99,235,.15); filter: blur(65px); }
        .home-visual-card {
          position: relative; z-index: 1; width: min(100%, 390px); padding: 25px;
          border: 1px solid var(--border); border-radius: 21px; background: var(--surface);
          box-shadow: var(--shadow-lg);
        }
        .home-visual-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .home-visual-kicker, .home-section-kicker { color: var(--primary); font-size: 10px; font-weight: 800; letter-spacing: .12em; }
        .home-visual-top h3 { margin-top: 5px; font-size: 18px; }
        .home-ai-chip { display: inline-flex; align-items: center; gap: 5px; padding: 5px 9px; border-radius: 99px; background: var(--primary-light); color: var(--primary); font-size: 10px; font-weight: 800; }
        .home-match-score { display: flex; align-items: center; gap: 17px; padding: 22px 0; border-bottom: 1px solid var(--border); }
        .home-score-ring { display: grid; width: 91px; height: 91px; flex-shrink: 0; place-items: center; border-radius: 50%; background: conic-gradient(var(--primary) 0 92%, var(--surface-3) 92% 100%); }
        .home-score-ring > div { display: flex; width: 72px; height: 72px; flex-direction: column; align-items: center; justify-content: center; border-radius: 50%; background: var(--surface); }
        .home-score-ring strong { color: var(--text); font-size: 21px; line-height: 1.1; }
        .home-score-ring span { color: var(--text-muted); font-size: 9px; }
        .home-score-copy { display: flex; flex-direction: column; gap: 4px; }
        .home-score-copy strong { font-size: 13px; }
        .home-score-copy span { color: var(--text-muted); font-size: 11px; }
        .home-skill-heading { display: flex; justify-content: space-between; margin: 17px 0 12px; color: var(--text-muted); font-size: 10px; font-weight: 700; }
        .home-skill-row { display: grid; grid-template-columns: 54px 1fr 31px; align-items: center; gap: 9px; margin-top: 11px; font-size: 10px; }
        .home-skill-row > span { color: var(--text-muted); }
        .home-skill-row b { color: var(--text); text-align: right; font-size: 10px; }
        .home-skill-track { height: 6px; overflow: hidden; border-radius: 99px; background: var(--surface-2); }
        .home-skill-track i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--primary), var(--secondary)); }
        .home-floating-card { position: absolute; z-index: 2; display: flex; align-items: center; gap: 10px; padding: 11px 14px; border: 1px solid var(--border); border-radius: 13px; background: var(--surface); box-shadow: var(--shadow); animation: homeFloat 5s ease-in-out infinite; }
        .home-floating-top { top: 34px; right: -13px; }
        .home-floating-bottom { bottom: 26px; left: -19px; animation-delay: -2.5s; }
        .home-floating-card > span:last-child { display: flex; flex-direction: column; gap: 1px; }
        .home-floating-card b { font-size: 10px; }
        .home-floating-card small { color: var(--text-muted); font-size: 9px; }
        .home-floating-icon { display: grid; width: 32px; height: 32px; place-items: center; border-radius: 10px; background: var(--primary-light); color: var(--primary); }
        .home-floating-icon.success { background: rgba(22,167,131,.12); color: var(--success); }
        @keyframes homeFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }

        .home-features-section { padding-top: 30px; padding-bottom: 75px; }
        .home-section-heading { max-width: 650px; margin: 0 auto 32px; text-align: center; }
        .home-section-heading h2 { margin: 10px 0 9px; font-size: clamp(24px, 3vw, 33px); letter-spacing: -.045em; }
        .home-section-heading p { color: var(--text-muted); font-size: 13px; }
        .home-feature-grid { align-items: stretch; }
        .home-feature-card { position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 12px; overflow: hidden; }
        .home-feature-card h3 { font-size: 16px; }
        .home-feature-card p { line-height: 1.75; }
        .home-feature-tag { color: var(--primary); font-size: 10px; font-weight: 750; }
        .home-feature-line { width: 35px; height: 3px; margin-top: auto; border-radius: 99px; background: var(--primary); opacity: .65; }
        .home-process-section { padding: 72px 0; background: var(--surface-2); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .home-steps-grid { gap: 15px; }
        .home-step-card { padding: 22px; border: 1px solid var(--border); border-radius: 16px; background: var(--surface); }
        .home-step-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
        .home-step-number { color: var(--primary); font-size: 12px; font-weight: 850; letter-spacing: .08em; }
        .home-step-icon { display: grid; width: 42px; height: 42px; place-items: center; border-radius: 13px; background: var(--primary-light); color: var(--primary); }
        .home-step-card h3 { margin-bottom: 8px; font-size: 15px; }
        .home-step-card p { color: var(--text-muted); font-size: 12px; line-height: 1.75; }
        .home-cta-wrap { padding-top: 70px; padding-bottom: 25px; }
        .home-cta { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 32px; border: 1px solid var(--border); border-radius: 20px; background: linear-gradient(120deg, var(--primary-light), var(--surface) 70%); }
        .home-cta h2 { margin: 8px 0; font-size: clamp(21px, 3vw, 29px); }
        .home-cta p { color: var(--text-muted); font-size: 12px; }
        .home-footer { margin-top: 30px; }
        .home-footer-inner { display: flex; align-items: center; justify-content: space-between; gap: 15px; }
        @media (max-width: 900px) {
          .home-hero-grid { grid-template-columns: minmax(0, 1fr); gap: 35px; }
          .home-hero-copy { text-align: center; }
          .home-hero .hero-title, .home-hero-subtitle { margin-left: auto; margin-right: auto; }
          .home-hero-actions, .home-trust-line { justify-content: center; }
          .home-visual { min-height: 370px; }
          .home-floating-top { right: 4%; }
          .home-floating-bottom { left: 4%; }
        }
        @media (max-width: 600px) {
          .home-nav-caption { display: none; }
          .home-nav-actions { gap: 6px; }
          .home-hero { padding: 52px 0 58px; }
          .home-hero .hero-title { font-size: 39px; }
          .home-visual { min-height: 340px; }
          .home-visual-card { padding: 19px; }
          .home-floating-card { padding: 8px 10px; }
          .home-floating-top { top: 0; right: 0; }
          .home-floating-bottom { bottom: 0; left: 0; }
          .home-features-section, .home-process-section { padding-top: 50px; padding-bottom: 50px; }
          .home-cta { align-items: flex-start; flex-direction: column; padding: 23px; }
          .home-footer-inner { align-items: flex-start; flex-direction: column; }
        }
        @media (prefers-reduced-motion: reduce) {
          .home-floating-card { animation: none; }
        }
      `}</style>
    </div>
  )
}
