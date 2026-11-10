
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import Navbar from './Navbar'

import {
  DashboardIcon,
  UsersIcon,
  BriefcaseIcon,
  FileIcon,
  SendIcon,
  LogoutIcon,
  SparklesIcon,
  ActivityIcon,
} from '../Icons'

export default function DashboardLayout({ role }) {
  const { user, logout } = useAuth()
  const { dark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const currentRole = role || (user?.is_superuser ? 'admin' : user?.role)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const navItems = {
    admin: [
      { to: '/admin', label: 'Overview', icon: DashboardIcon, end: true },
      { to: '/admin/users', label: 'Users', icon: UsersIcon },
      { to: '/admin/jobs', label: 'Jobs', icon: BriefcaseIcon },
      { to: '/admin/applications', label: 'Applications', icon: SendIcon },
    ],

    recruiter: [
      { to: '/recruiter', label: 'Overview', icon: DashboardIcon, end: true },
      { to: '/recruiter/jobs', label: 'My Jobs', icon: BriefcaseIcon },
      { to: '/recruiter/new-job', label: 'Post a Job', icon: SparklesIcon },
      { to: '/recruiter/applicants', label: 'Applicants', icon: UsersIcon },
    ],

    jobseeker: [
      { to: '/seeker', label: 'Overview', icon: DashboardIcon, end: true },
      { to: '/seeker/jobs', label: 'Browse Jobs', icon: BriefcaseIcon },
      { to: '/seeker/recommendations', label: 'AI Recommendations', icon: SparklesIcon },
      { to: '/seeker/resume', label: 'My Resume', icon: FileIcon },
      { to: '/seeker/applications', label: 'My Applications', icon: ActivityIcon },
    ],
  }

  const items = navItems[currentRole] || []

  const roleLabels = {
    admin: 'Administrator',
    recruiter: 'Recruiter',
    jobseeker: 'Job Seeker',
  }

  const displayName = user?.first_name || user?.username || 'User'

  return (
    <>
      <Navbar />

      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-section-label">
            Workspace
          </div>

          <nav className="sidebar-nav">
            {items.map((item) => {
              const Icon = item.icon

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''}`
                  }
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>

          <div
            style={{
              borderTop: '1px solid var(--border)',
              paddingTop: 18,
              marginTop: 24,
            }}
          >
            <Link
              to="/profile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                padding: '9px 10px',
                borderRadius: 12,
                marginBottom: 12,
                color: 'var(--text)',
                transition: 'background 0.2s ease',
              }}
            >
              <span className="avatar">
                {displayName.charAt(0).toUpperCase()}
              </span>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  className="text-sm bold"
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {displayName}
                </div>

                <div
                  className="text-xs muted"
                  style={{ marginTop: 2 }}
                >
                  {roleLabels[currentRole] || user?.role}
                </div>
              </div>
            </Link>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}
            >
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={toggleTheme}
                style={{ width: '100%' }}
                aria-label="Toggle theme"
              >
                {dark ? '☀ Light' : '☾ Dark'}
              </button>

              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleLogout}
                style={{ width: '100%' }}
              >
                <LogoutIcon size={15} />
                Sign out
              </button>
            </div>
          </div>
        </aside>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </>
  )
}
