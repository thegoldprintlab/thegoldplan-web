import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import { isDemoPreview, DEMO_EMAIL } from '../lib/demo'
import type { Session } from '@supabase/supabase-js'

interface AuthCtx {
  session: Session | null
  loading: boolean
  configured: boolean
}

const Ctx = createContext<AuthCtx>({ session: null, loading: true, configured: false })

const DEMO_SESSION = {
  user: { id: 'demo-user', email: DEMO_EMAIL },
} as unknown as Session

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured()
  const demoPreview = isDemoPreview()
  const [session, setSession] = useState<Session | null>(demoPreview ? DEMO_SESSION : null)
  const [loading, setLoading] = useState(!demoPreview)

  useEffect(() => {
    if (demoPreview) {
      setLoading(false)
      return
    }
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
  }, [configured, demoPreview])

  return <Ctx.Provider value={{ session, loading, configured }}>{children}</Ctx.Provider>
}

export function useAuth() {
  return useContext(Ctx)
}
