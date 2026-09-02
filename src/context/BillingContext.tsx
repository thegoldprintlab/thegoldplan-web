import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { billingEnabled, fetchSubscription, isSubActive } from '../lib/billing'
import { isDemoPreview } from '../lib/demo'
import type { Subscription } from '../lib/types'

interface BillingCtx {
  enabled: boolean
  loading: boolean
  subscription: Subscription | null
  active: boolean
  refresh: () => Promise<void>
}

const Ctx = createContext<BillingCtx>({
  enabled: false,
  loading: false,
  subscription: null,
  active: false,
  refresh: async () => {},
})

export function BillingProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const enabled = billingEnabled()
  const demoPreview = isDemoPreview()
  const userId = session?.user?.id
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (demoPreview) {
      setSubscription(null)
      return
    }
    if (!enabled || !userId) {
      setSubscription(null)
      return
    }
    setLoading(true)
    try {
      setSubscription(await fetchSubscription(userId))
    } catch {
      setSubscription(null)
    } finally {
      setLoading(false)
    }
  }, [enabled, userId, demoPreview])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <Ctx.Provider
      value={{
        enabled,
        loading,
        subscription,
        active: demoPreview || isSubActive(subscription),
        refresh,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useBilling() {
  return useContext(Ctx)
}
