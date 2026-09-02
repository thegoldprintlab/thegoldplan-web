import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { adminListUsers, adminSetUser, type AdminUser } from '../lib/admin'
import { adminListPromos, type PromoRow } from '../lib/promo'

/** Admin panel (Fasa C) — list users, promote/demote admin, disable/enable, view plans + promos. */
export default function AdminPage() {
  const { isAdmin } = useAuth()
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [promos, setPromos] = useState<PromoRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [u, p] = await Promise.all([adminListUsers(), adminListPromos()])
      setUsers(u)
      setPromos(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [])

  useEffect(() => {
    if (isAdmin) load()
  }, [isAdmin, load])

  if (!isAdmin) {
    return (
      <div className="empty-state">
        You don't have admin access. Ask the owner to promote your account.
      </div>
    )
  }

  async function toggleAdmin(u: AdminUser) {
    setBusy(u.user_id)
    try {
      await adminSetUser(u.user_id, u.role === 'admin' ? 'user' : 'admin')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
    }
  }

  async function toggleDisabled(u: AdminUser) {
    setBusy(u.user_id)
    try {
      await adminSetUser(u.user_id, undefined, !u.disabled)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="kicker">Admin</div>
          <h1>Admin Panel</h1>
          <p className="page-sub">Manage users, roles, and subscriptions.</p>
        </div>
      </div>

      {error && <div className="form-err" style={{ marginBottom: 14 }}>{error}</div>}

      <div className="panel">
        <div className="share-head">
          <h2>Promo Codes ({promos?.length ?? 0})</h2>
          <button className="btn" onClick={load}>Refresh</button>
        </div>

        <div className="table-wrap">
          <table className="tbl tbl--wide">
            <thead>
              <tr>
                <th>Code</th>
                <th className="num">Used</th>
                <th className="num">Days</th>
                <th>Status</th>
                <th>Redeemed By</th>
              </tr>
            </thead>
            <tbody>
              {promos?.map((p) => (
                <tr key={p.code}>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{p.code}</td>
                  <td className="num">{p.used_count}/{p.max_uses}</td>
                  <td className="num">{p.duration_days}</td>
                  <td className={p.active ? 'green' : 'muted'}>{p.active ? 'active' : 'inactive'}</td>
                  <td>{p.redeemed_by ?? '—'}</td>
                </tr>
              ))}
              {promos && !promos.length && <tr><td colSpan={5} className="empty-state">No promo codes.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="share-head">
          <h2>Users ({users?.length ?? 0})</h2>
          <button className="btn" onClick={load}>Refresh</button>
        </div>

        <div className="table-wrap">
          <table className="tbl tbl--wide">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u.user_id} style={u.disabled ? { opacity: 0.55 } : undefined}>
                  <td>{u.email}</td>
                  <td>
                    <span className={u.role === 'admin' ? 'badge-volatile' : 'badge-normal'}>{u.role}</span>
                  </td>
                  <td>{u.plan ?? '—'}</td>
                  <td className={u.sub_status === 'active' ? 'green' : 'muted'}>{u.sub_status ?? '—'}</td>
                  <td>{u.created_at ? new Date(u.created_at).toLocaleDateString('en-US') : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button className="btn btn-ghost btn-sm" disabled={busy === u.user_id} onClick={() => toggleAdmin(u)}>
                        {u.role === 'admin' ? 'Demote' : 'Make admin'}
                      </button>
                      <button
                        className={`btn btn-sm ${u.disabled ? 'btn-primary' : 'btn-danger'}`}
                        disabled={busy === u.user_id}
                        onClick={() => toggleDisabled(u)}
                      >
                        {u.disabled ? 'Enable' : 'Disable'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users && !users.length && <tr><td colSpan={6} className="empty-state">No users yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
