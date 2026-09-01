import { NavLink } from 'react-router-dom'

const links = [
  { to: '/app', label: 'Dashboard' },
  { to: '/app/log', label: 'Trading Log' },
  { to: '/app/input', label: 'Input Form' },
  { to: '/app/settings', label: 'Settings' },
  { to: '/app/account', label: 'Account' },
]

export default function Nav() {
  return (
    <nav className="nav">
      <div className="nav-brand">
        <span className="nav-logo" aria-hidden="true">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M12 2.5 21 7v10l-9 4.5L3 17V7l9-4.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M3 7l9 4.5L21 7M12 11.5V21.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
        </span>
        <span>The Gold Plan</span>
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
