import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente com service_role — só no servidor (API/cron).
 * Ignora RLS e enxerga leads de todos os usuários.
 * NUNCA importe este módulo em componentes 'use client'.
 */
export function supabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no ambiente do servidor')
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
