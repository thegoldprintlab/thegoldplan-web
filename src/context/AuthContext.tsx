import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import { isDemoPreview, DEMO_EMAIL } from '../lib/demo'
import type { Session } from '@supabase/supabase-js'

interface AuthCtx {
  session: Session | null
  loading: boolean
  configured: boolean
  isAdmin: boolean
  disabled: boolean
  refreshRole: () => Promise<void>
}

const Ctx = createContext<AuthCtx>({
  session: null,
  loading: true,
  configured: false,
  isAdmin: false,
  disabled: false,
  refreshRole: async () => {},
})

const DEMO_SESSION = {
  user: { id: 'demo-user', email: DEMO_EMAIL },
} as unknown as Session

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured()
  const demoPreview = isDemoPreview()
  const [session, setSession] = useState<Session | null>(demoPreview ? DEMO_SESSION : null)
  const [loading, setLoading] = useState(!demoPreview)
  const [isAdmin, setIsAdmin] = useState(false)
  const [disabled, setDisabled] = useState(false)

  async function refreshRole() {
    const userId = session?.user?.id
    if (!configured || !userId) {
      setIsAdmin(false)
      setDisabled(false)
      return
    }
    const sb = getSupabase()
    try {
      const [{ data: a }, { data: d }] = await Promise.all([
        sb.rpc('is_admin'),
        sb.rpc('current_user_disabled'),
      ])
      setIsAdmin(Boolean(a))
      setDisabled(Boolean(d))
    } catch {
      // RPCs not deployed yet — fail open to non-admin.
      setIsAdmin(false)
      setDisabled(false)
    }
  }

  useEffect(() => {
    if (demoPreview) {
      setLoading(false)
      setIsAdmin(true)
      setDisabled(false)
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

  useEffect(() => {
    refreshRole()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, configured])

  return (
    <Ctx.Provider value={{ session, loading, configured, isAdmin, disabled, refreshRole }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  return useContext(Ctx)
}
