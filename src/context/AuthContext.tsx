import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'

interface AuthCtx {
  session: Session | null
  loading: boolean
  configured: boolean
}

const Ctx = createContext<AuthCtx>({ session: null, loading: true, configured: false })

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!configured) {
      setLoading(false)
      return
    }
    const sb = getSupabase()
    sb.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .finally(() => setLoading(false))

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, s) => setSession(s))

    return () => subscription.unsubscribe()
  }, [configured])

  return <Ctx.Provider value={{ session, loading, configured }}>{children}</Ctx.Provider>
}

export function useAuth() {
  return useContext(Ctx)
}
