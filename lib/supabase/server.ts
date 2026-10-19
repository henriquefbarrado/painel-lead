import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Cliente do Supabase para rotas de servidor. Usa o login do usuário (cookies), então as regras RLS continuam valendo.
export function supabaseServidor() {
  const store = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!,
    { cookies: { getAll: () => store.getAll(), setAll: () => {} } })
}
