import { useEffect, useState, useCallback } from 'react'
import { usersApi } from '../../api/users'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import {
  UsersIcon, SearchIcon, UserIcon,
} from '../../components/Icons'
import { formatDate, roleBadgeColor, getApiError } from '../../utils/helpers'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({})

  const fetchUsers = useCallback(() => {
    setLoading(true)
    setError('')
    usersApi
      .list()
      .then((res) => setUsers(res.data.results || res.data))
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleToggleActive = async (user) => {
    try {
      const res = await usersApi.toggleActive(user.id)
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_active: res.data.is_active } : u)))
    } catch (err) {
      alert(getApiError(err, 'Failed to update user status.'))
    }
  }

  const openEdit = (user) => {
    setEditing(user)
    setEditForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone_number: user.phone_number || '',
      company: user.company || '',
      role: user.role || '',
    })
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await usersApi.update(editing.id, editForm)
      fetchUsers()
      setEditing(null)
      alert('User updated.')
    } catch (err) {
      alert(getApiError(err, 'Failed to update user.'))
    } finally {
      setSaving(false)
    }
  }

  const filtered = users.filter((user) => {
    const username = (user.username || '').toLowerCase()
    const email = (user.email || '').toLowerCase()
    const query = search.toLowerCase()
    const matchesSearch = !query || username.includes(query) || email.includes(query)
    const matchesRole = !roleFilter || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  if (loading) return <LoadingState message="Loading users..." />
  if (error) return <ErrorState message={error} onRetry={fetchUsers} />

  const activeUsers = users.filter((user) => user.is_active).length
  const inactiveUsers = users.length - activeUsers

  return (
    <div className="admin-users-page">
      <style>{`
        .admin-users-page { animation: adminUsersIn .4s ease both; }
        @keyframes adminUsersIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .admin-users-page .topbar { margin-bottom: 22px; }
        .admin-users-page .page-title { letter-spacing: -.035em; }
        .admin-users-page .page-subtitle { margin-top: 6px; }
        .admin-users-page .user-summary { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 12px; margin-bottom: 19px; }
        .admin-users-page .summary-tile { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 14px; border: 1px solid var(--border-color,rgba(151,130,220,.17)); background: var(--card-bg,rgba(255,255,255,.025)); }
        .admin-users-page .summary-symbol { width: 35px; height: 35px; flex: 0 0 35px; display: grid; place-items: center; border-radius: 10px; color: #bda8ff; background: rgba(139,92,246,.14); }
        .admin-users-page .summary-number { font-size: 19px; font-weight: 750; line-height: 1.1; }
        .admin-users-page .summary-caption { color: var(--text-muted,#9692a8); font-size: 10px; margin-top: 4px; }
        .admin-users-page .users-toolbar { display: flex; align-items: center; gap: 11px; padding: 14px; margin-bottom: 16px; border: 1px solid var(--border-color,rgba(151,130,220,.17)); border-radius: 15px; background: var(--card-bg,rgba(255,255,255,.025)); }
        .admin-users-page .search-field { flex: 1; min-width: 180px; position: relative; }
        .admin-users-page .search-field > svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted,#9692a8); pointer-events: none; }
        .admin-users-page .search-field .form-control { padding-left: 38px; }
        .admin-users-page .role-filter { width: 180px; flex: 0 0 180px; }
        .admin-users-page .results-line { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin: 0 2px 10px; color: var(--text-muted,#9692a8); font-size: 11px; }
        .admin-users-page .users-table-card { overflow: hidden; border: 1px solid var(--border-color,rgba(151,130,220,.17)); border-radius: 16px; background: var(--card-bg,rgba(255,255,255,.025)); }
        .admin-users-page .table-wrap { overflow-x: auto; }
        .admin-users-page .table { width: 100%; border-collapse: collapse; min-width: 760px; }
        .admin-users-page .table th { padding: 13px 15px; color: var(--text-muted,#9692a8); background: rgba(139,92,246,.055); font-size: 10px; font-weight: 750; text-transform: uppercase; letter-spacing: .07em; text-align: left; white-space: nowrap; }
        .admin-users-page .table td { padding: 14px 15px; border-top: 1px solid var(--border-color,rgba(151,130,220,.12)); vertical-align: middle; }
        .admin-users-page .table tbody tr { transition: background .18s ease; }
        .admin-users-page .table tbody tr:hover { background: rgba(139,92,246,.045); }
        .admin-users-page .user-cell { display: flex; align-items: center; gap: 10px; min-width: 210px; }
        .admin-users-page .user-avatar { width: 36px; height: 36px; flex: 0 0 36px; display: grid; place-items: center; border-radius: 11px; color: #d6caff; background: rgba(139,92,246,.16); border: 1px solid rgba(167,139,250,.18); font-size: 12px; font-weight: 750; }
        .admin-users-page .user-name { color: var(--text-primary,inherit); font-size: 12px; font-weight: 700; }
        .admin-users-page .user-email { color: var(--text-muted,#9692a8); font-size: 10px; margin-top: 4px; overflow-wrap: anywhere; }
        .admin-users-page .table-actions { display: flex; align-items: center; gap: 7px; white-space: nowrap; }
        .admin-users-page .modal-form { display: flex; flex-direction: column; gap: 12px; }
        .admin-users-page .modal-form .form-group { margin: 0; }
        .admin-users-page .modal-actions { display: flex; justify-content: flex-end; gap: 9px; padding-top: 14px; margin-top: 5px; border-top: 1px solid var(--border-color,rgba(151,130,220,.14)); }
        @media (max-width: 640px) {
          .admin-users-page .user-summary { grid-template-columns: 1fr; gap: 8px; }
          .admin-users-page .users-toolbar { align-items: stretch; flex-direction: column; }
          .admin-users-page .role-filter { width: 100%; flex-basis: auto; }
          .admin-users-page .search-field { width: 100%; }
        }
        @media (prefers-reduced-motion: reduce) { .admin-users-page,.admin-users-page * { animation: none !important; transition: none !important; } }
      `}</style>

      <div className="topbar">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Search, review and manage platform accounts.</p>
        </div>
      </div>

      <div className="user-summary">
        <div className="summary-tile">
          <span className="summary-symbol"><UsersIcon size={17} /></span>
          <div><div className="summary-number">{users.length}</div><div className="summary-caption">Total users</div></div>
        </div>
        <div className="summary-tile">
          <span className="summary-symbol"><UserIcon size={17} /></span>
          <div><div className="summary-number">{activeUsers}</div><div className="summary-caption">Active accounts</div></div>
        </div>
        <div className="summary-tile">
          <span className="summary-symbol"><UserIcon size={17} /></span>
          <div><div className="summary-number">{inactiveUsers}</div><div className="summary-caption">Inactive accounts</div></div>
        </div>
      </div>

      <div className="users-toolbar">
        <div className="search-field">
          <SearchIcon size={16} />
          <input type="text" className="form-control" placeholder="Search by username or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select aria-label="Filter users by role" className="form-control role-filter" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          <option value="jobseeker">Job Seeker</option>
          <option value="recruiter">Recruiter</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="results-line">
        <span>Showing {filtered.length} of {users.length} users</span>
        {(search || roleFilter) && <button type="button" className="btn btn-sm btn-outline" onClick={() => { setSearch(''); setRoleFilter('') }}>Clear filters</button>}
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={UsersIcon} title="No users found" description="No users match your current search or role filter." />
        </div>
      ) : (
        <div className="users-table-card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Company</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-cell">
                        <span className="user-avatar">{(user.username || '?').charAt(0).toUpperCase()}</span>
                        <div>
                          <div className="user-name">{user.username}</div>
                          <div className="user-email">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><Badge color={roleBadgeColor[user.role]}>{user.role}</Badge></td>
                    <td className="text-sm">{user.company || '-'}</td>
                    <td className="text-sm muted">{formatDate(user.date_joined)}</td>
                    <td><Badge color={user.is_active ? 'success' : 'secondary'}>{user.is_active ? 'Active' : 'Inactive'}</Badge></td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="btn btn-sm btn-outline" onClick={() => openEdit(user)}><UserIcon size={14} /> Edit</button>
                        <button type="button" className={`btn btn-sm ${user.is_active ? 'btn-secondary' : 'btn-success'}`} onClick={() => handleToggleActive(user)}>
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Edit User: ${editing?.username}`}>
        <form onSubmit={handleEditSubmit} className="modal-form">
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="admin-first-name">First Name</label>
              <input id="admin-first-name" className="form-control" value={editForm.first_name || ''} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="admin-last-name">Last Name</label>
              <input id="admin-last-name" className="form-control" value={editForm.last_name || ''} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-user-email">Email</label>
            <input id="admin-user-email" type="email" className="form-control" value={editForm.email || ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-user-phone">Phone</label>
            <input id="admin-user-phone" className="form-control" value={editForm.phone_number || ''} onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-user-company">Company</label>
            <input id="admin-user-company" className="form-control" value={editForm.company || ''} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-user-role">Role</label>
            <select id="admin-user-role" className="form-control" value={editForm.role || ''} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
              <option value="jobseeker">Job Seeker</option>
              <option value="recruiter">Recruiter</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
