import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { statsApi } from '../../api/matching'
import StatCard from '../../components/ui/StatCard'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'
import {
  BriefcaseIcon, UsersIcon, SparklesIcon, PlusIcon, TargetIcon, TrendingUpIcon,
} from '../../components/Icons'
import { formatDateTime, applicationStatusLabel, statusBadgeColor } from '../../utils/helpers'

export default function RecruiterDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchStats = useCallback(() => {
    setLoading(true)
    setError('')
    statsApi
      .dashboard()
      .then((res) => setStats(res.data))
      .catch(() => setError('Failed to load dashboard statistics.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  if (loading) return <LoadingState message="Loading your dashboard..." />
  if (error) return <ErrorState message={error} onRetry={fetchStats} />

  const avgScore = Math.round(stats.avg_match_score || 0)
  const topJobs = stats.top_jobs || []
  const recentApplications = stats.recent_applications || []

  return (
    <div className="recruiter-dashboard-page">
      <style>{`
        .recruiter-dashboard-page { animation: recruiterFadeIn .45s ease both; }
        @keyframes recruiterFadeIn { from { opacity: 0; transform: translateY(9px); } to { opacity: 1; transform: translateY(0); } }
        .recruiter-dashboard-page .topbar { align-items: center; gap: 18px; margin-bottom: 26px; }
        .recruiter-dashboard-page .page-title { letter-spacing: -.035em; }
        .recruiter-dashboard-page .page-subtitle { margin-top: 6px; }
        .recruiter-dashboard-page .recruiter-welcome {
          position: relative; overflow: hidden; display: flex; justify-content: space-between;
          align-items: center; gap: 22px; padding: 25px 28px; margin-bottom: 22px;
          border: 1px solid var(--border-color, rgba(151,130,220,.22)); border-radius: 20px;
          background: linear-gradient(115deg, rgba(112,78,190,.17), rgba(91,72,154,.07) 55%, rgba(55,47,91,.10));
        }
        .recruiter-dashboard-page .recruiter-welcome:after {
          content: ''; position: absolute; width: 210px; height: 210px; right: 7%; top: -145px;
          border-radius: 50%; border: 1px solid rgba(168,142,255,.22);
          box-shadow: 0 0 0 24px rgba(168,142,255,.035), 0 0 0 48px rgba(168,142,255,.025);
          pointer-events: none;
        }
        .recruiter-dashboard-page .welcome-kicker { color: var(--accent, #a78bfa); font-size: 11px; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; margin-bottom: 8px; }
        .recruiter-dashboard-page .welcome-title { font-size: clamp(19px, 2.3vw, 25px); font-weight: 750; letter-spacing: -.035em; margin: 0 0 7px; }
        .recruiter-dashboard-page .welcome-copy { color: var(--text-muted, #9692a8); font-size: 13px; margin: 0; line-height: 1.6; max-width: 540px; }
        .recruiter-dashboard-page .welcome-mark {
          position: relative; z-index: 1; width: 58px; height: 58px; flex: 0 0 58px;
          display: grid; place-items: center; border-radius: 17px;
          color: #c4b5fd; background: rgba(139,92,246,.16); border: 1px solid rgba(167,139,250,.25);
        }
        .recruiter-dashboard-page .stats-grid { margin-bottom: 23px; }
        .recruiter-dashboard-page .dashboard-panels { align-items: stretch; }
        .recruiter-dashboard-page .dashboard-panel { min-width: 0; overflow: hidden; }
        .recruiter-dashboard-page .dashboard-panel .card-header { padding: 18px 20px; }
        .recruiter-dashboard-page .dashboard-panel .card-body { padding: 8px 20px 18px; }
        .recruiter-dashboard-page .panel-heading { display: flex; align-items: center; gap: 10px; }
        .recruiter-dashboard-page .panel-icon {
          width: 34px; height: 34px; display: grid; place-items: center; border-radius: 11px;
          color: #b9a2ff; background: rgba(139,92,246,.13);
        }
        .recruiter-dashboard-page .panel-title { margin: 0; font-size: 14px; font-weight: 700; }
        .recruiter-dashboard-page .panel-caption { margin-top: 3px; color: var(--text-muted, #9692a8); font-size: 11px; }
        .recruiter-dashboard-page .dashboard-row {
          display: flex; justify-content: space-between; align-items: center; gap: 14px;
          padding: 14px 0; border-bottom: 1px solid var(--border-color, rgba(151,130,220,.14));
          transition: padding .2s ease;
        }
        .recruiter-dashboard-page .dashboard-row:last-child { border-bottom: 0; }
        .recruiter-dashboard-page .dashboard-row:hover { padding-left: 5px; }
        .recruiter-dashboard-page .row-main { min-width: 0; }
        .recruiter-dashboard-page .row-title { color: var(--text-primary, inherit); font-size: 13px; font-weight: 650; overflow-wrap: anywhere; }
        .recruiter-dashboard-page .row-meta { color: var(--text-muted, #9692a8); font-size: 11px; margin-top: 5px; }
        .recruiter-dashboard-page .panel-link { color: var(--accent, #a78bfa); font-size: 12px; font-weight: 650; text-decoration: none; }
        .recruiter-dashboard-page .panel-link:hover { color: #c4b5fd; }
        .recruiter-dashboard-page .dashboard-empty { padding: 10px 0; }
        @media (max-width: 700px) {
          .recruiter-dashboard-page .topbar { align-items: flex-start; flex-direction: column; }
          .recruiter-dashboard-page .recruiter-welcome { padding: 20px; }
          .recruiter-dashboard-page .welcome-mark { display: none; }
          .recruiter-dashboard-page .dashboard-panel .card-header { padding: 16px; }
          .recruiter-dashboard-page .dashboard-panel .card-body { padding: 6px 16px 14px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .recruiter-dashboard-page, .recruiter-dashboard-page * { animation: none !important; transition: none !important; }
        }
      `}</style>

      <div className="topbar">
        <div>
          <h1 className="page-title">Recruiter Overview</h1>
          <p className="page-subtitle">Track your hiring activity and find the right candidates.</p>
        </div>
        <Link to="/recruiter/new-job" className="btn btn-primary">
          <PlusIcon size={16} /> Post a Job
        </Link>
      </div>

      <section className="recruiter-welcome">
        <div>
          <div className="welcome-kicker">Recruiter workspace</div>
          <h2 className="welcome-title">Your hiring activity, at a glance</h2>
          <p className="welcome-copy">Review job performance, monitor incoming applications and use AI match scores to guide your candidate screening.</p>
        </div>
        <div className="welcome-mark"><SparklesIcon size={27} /></div>
      </section>

      <div className="grid grid-4 mb-4 stats-grid">
        <StatCard icon={BriefcaseIcon} label="Total Jobs" value={stats.total_jobs ?? 0} color="primary" />
        <StatCard icon={TrendingUpIcon} label="Open Jobs" value={stats.open_jobs ?? 0} color="success" />
        <StatCard icon={UsersIcon} label="Total Applications" value={stats.total_applications ?? 0} color="info" />
        <StatCard
          icon={TargetIcon}
          label="Avg AI Match Score"
          value={`${avgScore}%`}
          color="warning"
          sub={`${stats.ai_analyzed_applications ?? 0} analyzed`}
        />
      </div>

      <div className="grid grid-2 dashboard-panels">
        <section className="card dashboard-panel">
          <div className="card-header">
            <div className="panel-heading">
              <span className="panel-icon"><BriefcaseIcon size={17} /></span>
              <div>
                <h3 className="panel-title">Your Top Jobs</h3>
                <div className="panel-caption">Jobs receiving the most applications</div>
              </div>
            </div>
            <Link to="/recruiter/jobs" className="panel-link">View all</Link>
          </div>
          <div className="card-body">
            {topJobs.length === 0 ? (
              <div className="dashboard-empty">
                <EmptyState
                  icon={BriefcaseIcon}
                  title="No jobs posted yet"
                  description="Create your first job posting to start receiving applications."
                  action={<Link to="/recruiter/new-job" className="btn btn-primary btn-sm"><PlusIcon size={14} /> Post a Job</Link>}
                />
              </div>
            ) : (
              <div className="flex-column">
                {topJobs.map((job) => (
                  <div key={job.id} className="dashboard-row">
                    <div className="row-main">
                      <div className="row-title">{job.title}</div>
                      <div className="row-meta">{job.apps ?? 0} applications</div>
                    </div>
                    <Badge color={statusBadgeColor[job.status]}>{job.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="card dashboard-panel">
          <div className="card-header">
            <div className="panel-heading">
              <span className="panel-icon"><UsersIcon size={17} /></span>
              <div>
                <h3 className="panel-title">Recent Applications</h3>
                <div className="panel-caption">Latest candidate activity</div>
              </div>
            </div>
            <Link to="/recruiter/applicants" className="panel-link">View applicants</Link>
          </div>
          <div className="card-body">
            {recentApplications.length === 0 ? (
              <div className="dashboard-empty">
                <EmptyState
                  icon={UsersIcon}
                  title="No applications yet"
                  description="Applications from candidates will appear here for AI review."
                />
              </div>
            ) : (
              <div className="flex-column">
                {recentApplications.map((a) => (
                  <div key={a.id} className="dashboard-row">
                    <div className="row-main">
                      <div className="row-title">{a.applicant_name || a.applicant_username}</div>
                      <div className="row-meta">{formatDateTime(a.created_at)}</div>
                    </div>
                    <Badge color={statusBadgeColor[a.status]}>{applicationStatusLabel[a.status] || a.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
