import { getSupabase } from './supabase'
import type { Subscription } from './types'

/** Billing gating is OFF unless VITE_BILLING_ENABLED=true|1. Default keeps the app fully open. */
export function billingEnabled(): boolean {
  const v = import.meta.env.VITE_BILLING_ENABLED
  return v === 'true' || v === '1'
}

export async function fetchSubscription(userId: string): Promise<Subscription | null> {
  if (!billingEnabled()) return null
  const sb = getSupabase()
  const { data, error } = await sb
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return (data as Subscription) ?? null
}

/** True when the subscription is usable: active/trialing and not past its period end. */
export function isSubActive(s: Subscription | null): boolean {
  if (!s) return false
  if (s.status !== 'active' && s.status !== 'trialing') return false
  if (s.current_period_end) {
    const end = new Date(s.current_period_end).getTime()
    if (!Number.isNaN(end) && end < Date.now()) return false
  }
  return true
}

/** Build a checkout URL for a Stripe Payment Link, pre-filling what we know. */
export function checkoutUrl(paymentLink: string, email: string | null, userId: string | null): string {
  try {
    const u = new URL(paymentLink)
    if (email) u.searchParams.set('prefilled_email', email)
    if (userId) u.searchParams.set('client_reference_id', userId)
    return u.toString()
  } catch {
    return paymentLink
  }
}
