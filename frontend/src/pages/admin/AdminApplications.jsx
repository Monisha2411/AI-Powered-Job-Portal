import { useEffect, useState, useCallback } from 'react'
import { applicationsApi } from '../../api/applications'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'
import MatchScore from '../../components/ui/MatchScore'
import {
  SendIcon, SearchIcon,
} from '../../components/Icons'
import { formatDateTime, applicationStatusLabel } from '../../utils/helpers'

const statusBadgeMap = {
  submitted: 'info',
  under_review: 'warning',
  interview: 'primary',
  offer: 'success',
  hired: 'success',
  rejected: 'danger',
  withdrawn: 'secondary',
}

export default function AdminApplications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const fetchApplications = useCallback(() => {
    setLoading(true)
    setError('')
    const params = {}
    if (statusFilter) params.status = statusFilter
    if (search) params.search = search
    applicationsApi
      .list(params)
      .then((res) => setApplications(res.data.results || res.data))
      .catch(() => setError('Failed to load applications.'))
      .finally(() => setLoading(false))
  }, [statusFilter, search])

  useEffect(() => { fetchApplications() }, [fetchApplications])

  if (loading) return <LoadingState message="Loading applications..." />
  if (error) return <ErrorState message={error} onRetry={fetchApplications} />

  const statusCounts = applications.reduce((counts, application) => {
    counts[application.status] = (counts[application.status] || 0) + 1
    return counts
  }, {})

  const reviewedCount = (statusCounts.under_review || 0) + (statusCounts.interview || 0) +
    (statusCounts.offer || 0) + (statusCounts.hired || 0) + (statusCounts.rejected || 0)

  return (
    <div className="admin-applications-page">
      <style>{`
        .admin-applications-page { animation: adminApplicationsIn .4s ease both; }
        @keyframes adminApplicationsIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .admin-applications-page .topbar { margin-bottom: 20px; }
        .admin-applications-page .page-title { letter-spacing: -.035em; }
        .admin-applications-page .page-subtitle { margin-top: 6px; }
        .admin-applications-page .application-summary { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 11px; margin-bottom: 18px; }
        .admin-applications-page .summary-tile { padding: 14px 16px; border: 1px solid var(--border-color,rgba(151,130,220,.17)); border-radius: 14px; background: var(--card-bg,rgba(255,255,255,.025)); }
        .admin-applications-page .summary-label { color: var(--text-muted,#9692a8); font-size: 10px; margin-bottom: 7px; }
        .admin-applications-page .summary-value { font-size: 21px; font-weight: 750; line-height: 1.1; }
        .admin-applications-page .summary-value.accent { color: #c4b5fd; }
        .admin-applications-page .applications-toolbar { display: flex; gap: 11px; align-items: center; padding: 13px; margin-bottom: 14px; border: 1px solid var(--border-color,rgba(151,130,220,.17)); border-radius: 15px; background: var(--card-bg,rgba(255,255,255,.025)); }
        .admin-applications-page .search-field { position: relative; flex: 1; min-width: 180px; }
        .admin-applications-page .search-field > svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted,#9692a8); pointer-events: none; }
        .admin-applications-page .search-field .form-control { padding-left: 38px; }
        .admin-applications-page .status-filter { width: 190px; flex: 0 0 190px; }
        .admin-applications-page .results-line { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin: 0 2px 10px; color: var(--text-muted,#9692a8); font-size: 11px; }
        .admin-applications-page .applications-table-card { overflow: hidden; border: 1px solid var(--border-color,rgba(151,130,220,.17)); border-radius: 16px; background: var(--card-bg,rgba(255,255,255,.025)); }
        .admin-applications-page .table-wrap { overflow-x: auto; }
        .admin-applications-page .table { width: 100%; min-width: 760px; border-collapse: collapse; }
        .admin-applications-page .table th { padding: 13px 15px; color: var(--text-muted,#9692a8); background: rgba(139,92,246,.055); font-size: 10px; font-weight: 750; text-align: left; text-transform: uppercase; letter-spacing: .07em; white-space: nowrap; }
        .admin-applications-page .table td { padding: 14px 15px; border-top: 1px solid var(--border-color,rgba(151,130,220,.12)); vertical-align: middle; }
        .admin-applications-page .table tbody tr { transition: background .18s ease; }
        .admin-applications-page .table tbody tr:hover { background: rgba(139,92,246,.045); }
        .admin-applications-page .candidate-cell { display: flex; align-items: center; gap: 10px; min-width: 190px; }
        .admin-applications-page .candidate-avatar { width: 36px; height: 36px; flex: 0 0 36px; display: grid; place-items: center; border-radius: 11px; color: #d6caff; background: rgba(139,92,246,.16); border: 1px solid rgba(167,139,250,.18); font-size: 12px; font-weight: 750; }
        .admin-applications-page .candidate-name { font-size: 12px; font-weight: 700; }
        .admin-applications-page .candidate-username { margin-top: 4px; color: var(--text-muted,#9692a8); font-size: 10px; }
        .admin-applications-page .job-name { font-size: 12px; font-weight: 650; }
        .admin-applications-page .job-company { margin-top: 4px; color: var(--text-muted,#9692a8); font-size: 10px; }
        .admin-applications-page .match-cell { min-width: 100px; }
        @media (max-width: 650px) {
          .admin-applications-page .application-summary { grid-template-columns: 1fr; gap: 8px; }
          .admin-applications-page .applications-toolbar { align-items: stretch; flex-direction: column; }
          .admin-applications-page .search-field { width: 100%; }
          .admin-applications-page .status-filter { width: 100%; flex-basis: auto; }
        }
        @media (prefers-reduced-motion: reduce) { .admin-applications-page,.admin-applications-page * { animation: none !important; transition: none !important; } }
      `}</style>

      <div className="topbar">
        <div>
          <h1 className="page-title">All Applications</h1>
          <p className="page-subtitle">Review application activity across the platform.</p>
        </div>
      </div>

      <div className="application-summary">
        <div className="summary-tile">
          <div className="summary-label">Applications shown</div>
          <div className="summary-value accent">{applications.length}</div>
        </div>
        <div className="summary-tile">
          <div className="summary-label">Submitted</div>
          <div className="summary-value">{statusCounts.submitted || 0}</div>
        </div>
        <div className="summary-tile">
          <div className="summary-label">Moved beyond submission</div>
          <div className="summary-value">{reviewedCount}</div>
        </div>
      </div>

      <div className="applications-toolbar">
        <div className="search-field">
          <SearchIcon size={16} />
          <input type="text" className="form-control" placeholder="Search by candidate or job..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select aria-label="Filter applications by status" className="form-control status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(applicationStatusLabel).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="results-line">
        <span>Showing {applications.length} applications</span>
        {(search || statusFilter) && <button type="button" className="btn btn-sm btn-outline" onClick={() => { setSearch(''); setStatusFilter('') }}>Clear filters</button>}
      </div>

      {applications.length === 0 ? (
        <div className="card">
          <EmptyState icon={SendIcon} title="No applications found" description="No applications match your current search or status filter." />
        </div>
      ) : (
        <div className="applications-table-card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job</th>
                  <th>Status</th>
                  <th>AI Match</th>
                  <th>Applied</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id}>
                    <td>
                      <div className="candidate-cell">
                        <span className="candidate-avatar">{(application.applicant_name || application.applicant_username || '?').charAt(0).toUpperCase()}</span>
                        <div>
                          <div className="candidate-name">{application.applicant_name || application.applicant_username}</div>
                          <div className="candidate-username">{application.applicant_username}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="job-name">{application.job_title}</div>
                      <div className="job-company">{application.job_company}</div>
                    </td>
                    <td><Badge color={statusBadgeMap[application.status] || 'secondary'}>{applicationStatusLabel[application.status] || application.status}</Badge></td>
                    <td className="match-cell">
                      {application.match_score != null ? (
                        <MatchScore score={application.match_score} showLabel={false} />
                      ) : (
                        <span className="text-xs muted">Not analyzed</span>
                      )}
                    </td>
                    <td className="text-sm muted">{formatDateTime(application.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
