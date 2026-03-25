import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'

function getUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || ''
}

function getAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

let _supabase: SupabaseClient | null = null

export function getSupabase() {
  if (!_supabase) {
    const url = getUrl()
    const key = getAnonKey()
    if (!url || !key) return null
    _supabase = createClient(url, key)
  }
  return _supabase
}

// Keep backward compat — pages that import `supabase` directly
export const supabase = null as unknown as SupabaseClient

export function getServiceClient() {
  const url = getUrl()
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || ''
  if (!url || !serviceKey) return null
  return createClient(url, serviceKey)
}

export function getBrowserClient() {
  const url = getUrl() || 'https://placeholder.supabase.co'
  const key = getAnonKey() || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'
  return createBrowserClient(url, key)
}
