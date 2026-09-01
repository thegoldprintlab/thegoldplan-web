import { useEffect, useState } from 'react'

const DESIGNS = [
  { id: 'linear', label: 'Linear' },
  { id: 'gold', label: 'Gold' },
  { id: 'mono', label: 'Mono' },
] as const

type DesignId = (typeof DESIGNS)[number]['id']
type ThemeId = 'light' | 'dark'

function readInitial(): { design: DesignId; theme: ThemeId } {
  const p = new URLSearchParams(window.location.search)
  const pd = p.get('design') as DesignId | null
  const pt = p.get('theme') as ThemeId | null
  const design = pd && DESIGNS.some((d) => d.id === pd) ? pd : ((localStorage.getItem('gp-design') as DesignId) || 'linear')
  const theme =
    pt === 'light' || pt === 'dark'
      ? pt
      : ((localStorage.getItem('gp-theme') as ThemeId) || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'))
  return { design, theme }
}

export default function ThemeSwitcher() {
  const [state, setState] = useState<{ design: DesignId; theme: ThemeId }>(readInitial)

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-design', state.design)
    root.setAttribute('data-theme', state.theme)
    root.style.colorScheme = state.theme
    localStorage.setItem('gp-design', state.design)
    localStorage.setItem('gp-theme', state.theme)
  }, [state])

  return (
    <div className="theme-switcher" role="group" aria-label="UI design preview">
      <div className="ts-row">
        {DESIGNS.map((d) => (
          <button
            key={d.id}
            type="button"
            className={state.design === d.id ? 'ts-btn active' : 'ts-btn'}
            onClick={() => setState((s) => ({ ...s, design: d.id }))}
          >
            {d.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="ts-mode"
        title={state.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={() => setState((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }))}
      >
        {state.theme === 'dark' ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
            <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M19.4 4.6l-1.8 1.8M6.4 17.6l-1.8 1.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </div>
  )
}
