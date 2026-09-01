import { getSupabase } from './supabase'

export interface AdminUser {
  user_id: string
  email: string
  role: string
  disabled: boolean
  created_at: string
  plan: string | null
  sub_status: string | null
  current_period_end: string | null
}

export async function adminListUsers(): Promise<AdminUser[]> {
  const sb = getSupabase()
  const { data, error } = await sb.rpc('admin_list_users')
  if (error) throw error
  return (data ?? []) as AdminUser[]
}

export async function adminSetUser(target: string, role?: string, disabled?: boolean): Promise<void> {
  const sb = getSupabase()
  const { error } = await sb.rpc('admin_set_user', {
    target,
    p_role: role ?? null,
    p_disabled: disabled ?? null,
  })
  if (error) throw error
}
