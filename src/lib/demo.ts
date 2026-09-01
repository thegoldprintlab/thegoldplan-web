/** Force sample-data preview mode (no login) via ?demo=1 or gp-demo=1 in localStorage. */
export function isDemoPreview(): boolean {
  try {
    const p = new URLSearchParams(window.location.search)
    return p.get('demo') === '1' || localStorage.getItem('gp-demo') === '1'
  } catch {
    return false
  }
}

export const DEMO_EMAIL = 'gold@preview.app'
