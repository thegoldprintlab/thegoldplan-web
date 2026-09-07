/** Force sample-data preview mode (no login) via ?demo=1 or gp-demo=1 in localStorage. */
export function isDemoPreview(search?: string): boolean {
  try {
    const p = new URLSearchParams(search ?? window.location.search)
    if (p.get('demo') === '1') {
      // Persist so demo survives in-app navigation (Link to /log etc. drops the query string).
      try { localStorage.setItem('gp-demo', '1') } catch {}
      return true
    }
    return localStorage.getItem('gp-demo') === '1'
  } catch {
    return false
  }
}

export function exitDemoPreview(): void {
  try { localStorage.removeItem('gp-demo') } catch {}
}

export const DEMO_EMAIL = 'gold@preview.app'
