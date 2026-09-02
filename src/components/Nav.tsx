import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Nav() {
  const { isAdmin } = useAuth()

  const links = [
    { to: '/app', label: 'Dashboard' },
    { to: '/app/log', label: 'Trading Log' },
    { to: '/app/input', label: 'Input Form' },
    { to: '/app/import', label: 'Import MT5' },
    { to: '/app/help', label: 'How to use' },
    { to: '/app/settings', label: 'Settings' },
    { to: '/app/account', label: 'Account' },
    ...(isAdmin ? [{ to: '/app/admin', label: 'Admin' }] : []),
  ]

  return (
    <nav className="nav">
      <div className="nav-brand">
        <span className="nav-logo" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 3 21 12 12 21 3 12 12 3Z" fill="var(--primary)" />
            <path d="M12 7 16.5 12 12 17 7.5 12 12 7Z" fill="var(--surface)" />
          </svg>
        </span>
        The Gold Plan
      </div>
      <div className="nav-links">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/app'}
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            {l.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
