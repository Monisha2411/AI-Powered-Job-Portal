
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import Logo from '../ui/Logo'

import {
  SunIcon,
  MoonIcon,
  LogoutIcon,
  DashboardIcon,
} from '../Icons'

export default function Navbar() {
  const { logout, user } = useAuth()
  const { dark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const getDashboardPath = () => {
    if (!user) return '/'
    if (user.role === 'admin' || user.is_superuser) return '/admin'
    if (user.role === 'recruiter') return '/recruiter'
    return '/seeker'
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const displayName = user?.first_name || user?.username || 'User'

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand-link" aria-label="Home">
          <Logo />
        </Link>

        <div className="nav-links navbar-actions">
          {!user ? (
            <>
              <Link
                to="/login"
                className="btn btn-outline btn-sm"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="btn btn-primary btn-sm"
              >
                Get Started
              </Link>
            </>
          ) : (
            <>
              <button
                type="button"
                className="icon-btn"
                onClick={toggleTheme}
                aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
                title={dark ? 'Light theme' : 'Dark theme'}
              >
                {dark ? (
                  <SunIcon size={18} />
                ) : (
                  <MoonIcon size={18} />
                )}
              </button>

              <Link
                to={getDashboardPath()}
                className="btn btn-outline btn-sm navbar-dashboard"
              >
                <DashboardIcon size={16} />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/profile"
                className="navbar-profile"
                title="Manage your profile"
              >
                <span className="avatar">
                  {displayName.charAt(0).toUpperCase()}
                </span>

                <span className="navbar-profile-name">
                  {displayName}
                </span>
              </Link>

              <button
                type="button"
                className="icon-btn navbar-logout"
                onClick={handleLogout}
                aria-label="Sign out"
                title="Sign out"
              >
                <LogoutIcon size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        .navbar-brand-link {
          display: inline-flex;
          align-items: center;
          flex-shrink: 0;
        }

        .navbar-actions {
          gap: 12px;
        }

        .navbar-profile {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 4px 8px 4px 4px;
          border-radius: 12px;
          color: var(--text);
          transition: background 0.2s ease;
        }

        .navbar-profile:hover {
          background: var(--surface-2);
          color: var(--text);
        }

        .navbar-profile-name {
          max-width: 130px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 12px;
          font-weight: 650;
        }

        .navbar-dashboard {
          gap: 7px;
        }

        @media (max-width: 520px) {
          .navbar-actions {
            gap: 7px;
          }

          .navbar-profile-name {
            display: none;
          }

          .navbar-dashboard span {
            display: none;
          }

          .navbar-dashboard {
            width: 36px;
            height: 36px;
            padding: 0;
          }
        }
      `}</style>
    </nav>
  )
}
