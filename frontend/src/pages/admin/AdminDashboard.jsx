import { useEffect, useState, useCallback } from 'react'
import { statsApi } from '../../api/matching'
import StatCard from '../../components/ui/StatCard'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import Badge from '../../components/ui/Badge'
import {
  UsersIcon, BriefcaseIcon, FileIcon, SendIcon, SparklesIcon, UserIcon,
} from '../../components/Icons'
import { formatDateTime, roleBadgeColor } from '../../utils/helpers'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchStats = useCallback(() => {
    setLoading(true)
    setError('')
    statsApi
      .dashboard()
      .then((res) => setStats(res.data))
      .catch(() => setError('Failed to load dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  if (loading) return <LoadingState message="Loading admin dashboard..." />
  if (error) return <ErrorState message={error} onRetry={fetchStats} />

  const recentUsers = stats.recent_users || []
  const recentJobs = stats.recent_jobs || []

  return (
    <div className="admin-dashboard-page">
      <style>{`
        .admin-dashboard-page { animation: adminDashboardIn .42s ease both; }
        @keyframes adminDashboardIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .admin-dashboard-page .topbar { margin-bottom: 23px; }
        .admin-dashboard-page .page-title { letter-spacing: -.035em; }
        .admin-dashboard-page .page-subtitle { margin-top: 6px; }
        .admin-dashboard-page .admin-welcome {
          position: relative; overflow: hidden; display: flex; align-items: center; justify-content: space-between;
          gap: 18px; padding: 22px 25px; margin-bottom: 22px; border-radius: 18px;
          border: 1px solid rgba(167,139,250,.22);
          background: linear-gradient(110deg,rgba(112,78,190,.16),rgba(91,72,154,.055));
        }
        .admin-dashboard-page .welcome-eyebrow { color: var(--accent,#a78bfa); font-size: 10px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; margin-bottom: 7px; }
        .admin-dashboard-page .welcome-heading { margin: 0 0 6px; font-size: clamp(18px,2.2vw,23px); font-weight: 760; letter-spacing: -.035em; }
        .admin-dashboard-page .welcome-copy { margin: 0; max-width: 580px; color: var(--text-muted,#9692a8); font-size: 12px; line-height: 1.65; }
        .admin-dashboard-page .welcome-icon { display: grid; place-items: center; width: 48px; height: 48px; flex: 0 0 48px; border-radius: 14px; color: #c4b5fd; background: rgba(139,92,246,.17); border: 1px solid rgba(167,139,250,.24); }
        .admin-dashboard-page .stats-section { margin-bottom: 21px; }
        .admin-dashboard-page .section-label { margin: 0 0 12px; color: var(--text-muted,#9692a8); font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
        .admin-dashboard-page .admin-stat-grid { margin-bottom: 0; }
        .admin-dashboard-page .admin-panels { align-items: stretch; }
        .admin-dashboard-page .admin-panel { min-width: 0; overflow: hidden; }
        .admin-dashboard-page .admin-panel .card-header { padding: 17px 19px; }
        .admin-dashboard-page .admin-panel .card-body { padding: 7px 19px 16px; }
        .admin-dashboard-page .panel-heading { display: flex; align-items: center; gap: 10px; }
        .admin-dashboard-page .panel-icon { display: grid; place-items: center; width: 33px; height: 33px; border-radius: 10px; color: #bda8ff; background: rgba(139,92,246,.14); }
        .admin-dashboard-page .panel-title { margin: 0; font-size: 13px; font-weight: 750; }
        .admin-dashboard-page .panel-subtitle { margin-top: 3px; color: var(--text-muted,#9692a8); font-size: 10px; }
        .admin-dashboard-page .admin-list { display: flex; flex-direction: column; }
        .admin-dashboard-page .admin-list-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 13px 0; border-bottom: 1px solid var(--border-color,rgba(151,130,220,.14)); transition: padding .2s ease; }
        .admin-dashboard-page .admin-list-row:last-child { border-bottom: 0; }
        .admin-dashboard-page .admin-list-row:hover { padding-left: 4px; }
        .admin-dashboard-page .user-info { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .admin-dashboard-page .user-avatar { width: 36px; height: 36px; flex: 0 0 36px; display: grid; place-items: center; border-radius: 11px; color: #d6caff; background: rgba(139,92,246,.16); border: 1px solid rgba(167,139,250,.17); font-size: 12px; font-weight: 750; }
        .admin-dashboard-page .row-content { min-width: 0; }
        .admin-dashboard-page .row-title { color: var(--text-primary,inherit); font-size: 12px; font-weight: 700; overflow-wrap: anywhere; }
        .admin-dashboard-page .row-meta { color: var(--text-muted,#9692a8); font-size: 10px; margin-top: 4px; overflow-wrap: anywhere; }
        .admin-dashboard-page .job-row-title { color: var(--text-primary,inherit); font-size: 12px; font-weight: 700; overflow-wrap: anywhere; }
        .admin-dashboard-page .empty-message { padding: 19px 0; color: var(--text-muted,#9692a8); font-size: 12px; }
        @media (max-width: 700px) {
          .admin-dashboard-page .admin-welcome { padding: 18px; }
          .admin-dashboard-page .welcome-icon { display: none; }
          .admin-dashboard-page .admin-panel .card-header { padding: 15px; }
          .admin-dashboard-page .admin-panel .card-body { padding: 6px 15px 13px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .admin-dashboard-page,.admin-dashboard-page * { animation: none !important; transition: none !important; }
        }
      `}</style>

      <div className="topbar">
        <div>
          <h1 className="page-title">Admin Overview</h1>
          <p className="page-subtitle">Monitor platform activity and manage your hiring community.</p>
        </div>
      </div>

      <section className="admin-welcome">
        <div>
          <div className="welcome-eyebrow">Platform administration</div>
          <h2 className="welcome-heading">Platform activity at a glance</h2>
          <p className="welcome-copy">Review user growth, job activity, applications and resume usage from one dashboard.</p>
        </div>
        <div className="welcome-icon"><SparklesIcon size={22} /></div>
      </section>

      <section className="stats-section">
        <h2 className="section-label">Platform overview</h2>
        <div className="grid grid-4 admin-stat-grid">
          <StatCard icon={UsersIcon} label="Total Users" value={stats.total_users ?? 0} color="primary" />
          <StatCard icon={BriefcaseIcon} label="Open Jobs" value={stats.open_jobs ?? 0} color="success" />
          <StatCard icon={SendIcon} label="Applications" value={stats.total_applications ?? 0} color="info" />
          <StatCard icon={FileIcon} label="Resumes" value={stats.total_resumes ?? 0} color="warning" />
        </div>
      </section>

      <section className="stats-section">
        <h2 className="section-label">User breakdown</h2>
        <div className="grid grid-4 admin-stat-grid">
          <StatCard icon={UserIcon} label="Recruiters" value={stats.total_recruiters ?? 0} color="info" />
          <StatCard icon={UserIcon} label="Job Seekers" value={stats.total_jobseekers ?? 0} color="success" />
          <StatCard icon={SparklesIcon} label="Profiles w/ Resume" value={stats.jobseekers_with_resume ?? 0} color="primary" />
        </div>
      </section>

      <div className="grid grid-2 admin-panels">
        <section className="card admin-panel">
          <div className="card-header">
            <div className="panel-heading">
              <span className="panel-icon"><UsersIcon size={16} /></span>
              <div>
                <h3 className="panel-title">Recent Users</h3>
                <div className="panel-subtitle">Latest registered accounts</div>
              </div>
            </div>
          </div>
          <div className="card-body">
            {recentUsers.length === 0 ? (
              <p className="empty-message">No users yet.</p>
            ) : (
              <div className="admin-list">
                {recentUsers.map((user) => (
                  <div key={user.id} className="admin-list-row">
                    <div className="user-info">
                      <span className="user-avatar">{(user.username || '?').charAt(0).toUpperCase()}</span>
                      <div className="row-content">
                        <div className="row-title">{user.username}</div>
                        <div className="row-meta">{user.email}</div>
                      </div>
                    </div>
                    <Badge color={roleBadgeColor[user.role]}>{user.role}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="card admin-panel">
          <div className="card-header">
            <div className="panel-heading">
              <span className="panel-icon"><BriefcaseIcon size={16} /></span>
              <div>
                <h3 className="panel-title">Recent Jobs</h3>
                <div className="panel-subtitle">Latest job postings across the platform</div>
              </div>
            </div>
          </div>
          <div className="card-body">
            {recentJobs.length === 0 ? (
              <p className="empty-message">No jobs posted yet.</p>
            ) : (
              <div className="admin-list">
                {recentJobs.map((job) => (
                  <div key={job.id} className="admin-list-row">
                    <div className="row-content">
                      <div className="job-row-title">{job.title}</div>
                      <div className="row-meta">{job.company} · {formatDateTime(job.created_at)}</div>
                    </div>
                    <Badge color={job.status === 'open' ? 'success' : 'secondary'}>{job.status}</Badge>
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
