import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Trade, Settings } from '../lib/types'
import { fetchTrades, fetchSettings, saveSettings, useConfigured } from '../lib/api'

interface DataCtx {
  trades: Trade[]
  settings: Settings
  loading: boolean
  configured: boolean
  error: string | null
  reload: () => Promise<void>
  updateSettings: (s: Settings) => Promise<void>
}

const Ctx = createContext<DataCtx>({
  trades: [],
  settings: { user_id: '', setups: [], sessions: [], emotions: [], accounts: [], max_daily_loss: 100, account_capitals: {} },
  loading: true,
  configured: false,
  error: null,
  reload: async () => {},
  updateSettings: async () => {},
})

export function DataProvider({ children }: { children: ReactNode }) {
  const configured = useConfigured()
  const [trades, setTrades] = useState<Trade[]>([])
  const [settings, setSettings] = useState<Settings>({ user_id: '', setups: [], sessions: [], emotions: [], accounts: [], max_daily_loss: 100, account_capitals: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    if (!configured) {
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
    await saveSettings(s)
    setSettings(s)
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured])

  return (
    <Ctx.Provider value={{ trades, settings, loading, configured, error, reload, updateSettings }}>
      {children}
    </Ctx.Provider>
  )
}

export function useData() {
  return useContext(Ctx)
}
