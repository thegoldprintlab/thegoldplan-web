import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/log', label: 'Trading Log' },
  { to: '/input', label: 'Input Form' },
  { to: '/settings', label: 'Settings' },
]

export default function Nav() {
  return (
    <nav className="nav">
      <div className="nav-brand">
        <span className="nav-logo">◈</span>
        <span>The Gold Plan</span>
      </div>
      <div className="nav-links">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            {l.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
