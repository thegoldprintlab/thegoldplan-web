import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Trade, Settings } from '../lib/types'
import { fetchTrades, fetchSettings, saveSettings, useConfigured } from '../lib/api'
import { isDemoPreview } from '../lib/demo'
import { DEMO_TRADES, DEMO_SETTINGS } from '../demo/seed'

interface DataCtx {
  trades: Trade[]
  settings: Settings
  loading: boolean
  configured: boolean
  demoMode: boolean
  error: string | null
  reload: () => Promise<void>
  updateSettings: (s: Settings) => Promise<void>
}

const Ctx = createContext<DataCtx>({
  trades: [],
  settings: { user_id: '', setups: [], sessions: [], emotions: [], accounts: [], max_daily_loss: 100, account_capitals: {} },
  loading: true,
  configured: false,
  demoMode: true,
  error: null,
  reload: async () => {},
  updateSettings: async () => {},
})

export function DataProvider({ children }: { children: ReactNode }) {
  const configured = useConfigured()
  const demoMode = !configured || isDemoPreview()
  const [trades, setTrades] = useState<Trade[]>(demoMode ? DEMO_TRADES : [])
  const [settings, setSettings] = useState<Settings>(demoMode ? DEMO_SETTINGS : { user_id: '', setups: [], sessions: [], emotions: [], accounts: [], max_daily_loss: 100, account_capitals: {} })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    if (demoMode) {
      setTrades(DEMO_TRADES)
      setSettings(DEMO_SETTINGS)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [t, s] = await Promise.all([fetchTrades(), fetchSettings()])
      setTrades(t)
      setSettings(s)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  async function updateSettings(s: Settings) {
    if (demoMode) {
      setSettings(s)
      return
    }
    await saveSettings(s)
    setSettings(s)
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured])

  return (
    <Ctx.Provider value={{ trades, settings, loading, configured, demoMode, error, reload, updateSettings }}>
      {children}
    </Ctx.Provider>
  )
}

export function useData() {
  return useContext(Ctx)
}
