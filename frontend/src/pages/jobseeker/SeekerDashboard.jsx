
import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { statsApi } from '../../api/matching'
import StatCard from '../../components/ui/StatCard'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'
import {
  FileIcon,
  SendIcon,
  SparklesIcon,
  ActivityIcon,
  TargetIcon,
  UploadIcon,
} from '../../components/Icons'
import {
  formatDateTime,
  applicationStatusLabel,
  statusBadgeColor,
} from '../../utils/helpers'
import './SeekerDashboard.css'

export default function SeekerDashboard() {
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

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (loading) {
    return <LoadingState message="Loading your dashboard..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchStats} />
  }

  if (!stats) {
    return (
      <ErrorState
        message="Dashboard data is unavailable."
        onRetry={fetchStats}
      />
    )
  }

  const avgScore = Math.round(stats.avg_match_score || 0)
  const recentApplications = stats.recent_applications || []

  return (
    <main className="seeker-dashboard page-enter">

      {/* Welcome section */}
      <section className="seeker-welcome">
        <div className="seeker-welcome-content">
          <span className="seeker-eyebrow">
            <SparklesIcon size={15} />
            AI CAREER INTELLIGENCE
          </span>

          <h1>Your career dashboard</h1>

          <p>
            Track your progress, explore opportunities and discover jobs
            matched to your skills.
          </p>

          <Link
            to="/seeker/recommendations"
            className="btn btn-primary seeker-explore-btn"
          >
            <SparklesIcon size={17} />
            Explore AI matches
          </Link>
        </div>

        <div className="seeker-welcome-decoration">
          <div className="seeker-decoration-circle">
            <TargetIcon size={48} />
          </div>
          <span>Find your next opportunity</span>
        </div>
      </section>

      {/* Resume prompt */}
      {!stats.has_analyzed_resume && (
        <section className="seeker-resume-prompt">
          <div className="seeker-prompt-icon">
            <UploadIcon size={23} />
          </div>

          <div className="seeker-prompt-content">
            <h3>Complete your career profile</h3>
            <p>
              Upload and analyze your resume to unlock personalized
              AI job recommendations.
            </p>
          </div>

          <Link to="/seeker/resume" className="btn btn-primary btn-sm">
            Upload resume
          </Link>
        </section>
      )}

      {/* Statistics */}
      <section className="seeker-stats-section">
        <div className="seeker-section-heading">
          <div>
            <span className="seeker-eyebrow">YOUR OVERVIEW</span>
            <h2>Career activity</h2>
            <p>Your job search progress at a glance.</p>
          </div>
        </div>

        <div className="grid grid-4 dashboard-stat-grid">
          <StatCard
            icon={FileIcon}
            label="Resumes"
            value={stats.total_resumes ?? 0}
            color="primary"
          />

          <StatCard
            icon={TargetIcon}
            label="Skills extracted"
            value={stats.total_skills ?? 0}
            color="success"
          />

          <StatCard
            icon={SendIcon}
            label="Applications"
            value={stats.total_applications ?? 0}
            color="info"
          />

          <StatCard
            icon={ActivityIcon}
            label="Average match score"
            value={`${avgScore}%`}
            color="warning"
          />
        </div>
      </section>

      {/* Recent applications */}
      <section className="card seeker-applications-card">
        <div className="seeker-applications-header">
          <div>
            <span className="seeker-eyebrow">APPLICATION TRACKER</span>
            <h2>Recent applications</h2>
            <p>Follow the progress of your latest job applications.</p>
          </div>

          <Link
            to="/seeker/applications"
            className="btn btn-outline btn-sm"
          >
            View all
          </Link>
        </div>

        <div className="seeker-applications-body">
          {recentApplications.length === 0 ? (
            <EmptyState
              icon={BriefcasePlaceholder}
              title="No applications yet"
              description="Browse available jobs and apply. Your application activity will appear here."
              action={
                <Link to="/seeker/jobs" className="btn btn-primary btn-sm">
                  Browse jobs
                </Link>
              }
            />
          ) : (
            <div className="seeker-application-list">
              {recentApplications.map((application) => (
                <div
                  className="seeker-application-item"
                  key={application.id}
                >
                  <div className="seeker-application-icon">
                    <SendIcon size={19} />
                  </div>

                  <div className="seeker-application-info">
                    <h3>
                      {application.job__title || 'Job application'}
                    </h3>

                    <p>
                      Applied {formatDateTime(application.created_at)}
                    </p>
                  </div>

                  <div className="seeker-application-match">
                    {application.match_score != null ? (
                      <>
                        <span className="seeker-match-value">
                          <TargetIcon size={15} />
                          {Math.round(application.match_score)}%
                        </span>
                        <span className="seeker-match-label">
                          Match score
                        </span>
                      </>
                    ) : (
                      <span className="seeker-match-label">
                        Match score unavailable
                      </span>
                    )}
                  </div>

                  <div className="seeker-application-status">
                    <Badge
                      color={
                        statusBadgeColor[application.status] || 'secondary'
                      }
                    >
                      {applicationStatusLabel[application.status] ||
                        application.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

    </main>
  )
}

function BriefcasePlaceholder(props) {
  return <SendIcon {...props} />
}
