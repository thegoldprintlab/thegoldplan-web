import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import { isDemoPreview, exitDemoPreview, DEMO_EMAIL } from '../lib/demo'
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
  // Subscribe to the router so client-side Link to /app?demo=1 re-renders this
  // provider. Without useLocation, AuthProvider stays on the landing-page state
  // (session=null) and Shell shows the login form until a full refresh.
  const location = useLocation()
  const demoPreview = isDemoPreview(location.search)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const effectiveSession = demoPreview ? DEMO_SESSION : session
  const effectiveLoading = demoPreview ? false : loading
  const effectiveAdmin = demoPreview ? true : isAdmin
  const effectiveDisabled = demoPreview ? false : disabled

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
      return
    }
    if (!configured) {
      setLoading(false)
      return
    }
    const sb = getSupabase()
    sb.auth
      .getSession()
      .then(({ data }) => {
        // A real session always supersedes a leftover demo flag (no ?demo=1).
        if (data.session) exitDemoPreview()
        setSession(data.session)
      })
      .finally(() => setLoading(false))

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, s) => {
      if (s) exitDemoPreview()
      setSession(s)
    })

    return () => subscription.unsubscribe()
  }, [configured, demoPreview])

  useEffect(() => {
    refreshRole()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, configured])

  return (
    <Ctx.Provider
      value={{
        session: effectiveSession,
        loading: effectiveLoading,
        configured,
        isAdmin: effectiveAdmin,
        disabled: effectiveDisabled,
        refreshRole,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  return useContext(Ctx)
}
