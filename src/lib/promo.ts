import { getSupabase } from './supabase'

export interface RedeemedPromo {
  plan: string
  status: string
  current_period_end: string | null
  code: string
}

export async function redeemPromo(code: string): Promise<RedeemedPromo> {
  const sb = getSupabase()
  const { data, error } = await sb.rpc('redeem_promo', { p_code: code })
  if (error) throw new Error(error.message)
  return data as RedeemedPromo
}

export interface PromoRow {
  code: string
  max_uses: number
  used_count: number
  duration_days: number
  active: boolean
  created_at: string
  note: string | null
  redeemed_by: string | null
}

export async function adminListPromos(): Promise<PromoRow[]> {
  const sb = getSupabase()
  const { data, error } = await sb.rpc('admin_list_promos')
  if (error) throw error
  return (data ?? []) as PromoRow[]
}
