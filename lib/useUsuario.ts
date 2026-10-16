'use client'
import { useEffect, useState } from 'react'
import { supabase } from './supabase/client'
import { nomeDoEmail } from './usuarios'

// Devolve { nome, email } do usuário logado, ou null enquanto carrega.
export function useUsuario() {
  const [u, setU] = useState<{ nome: string; email: string } | null>(null)
  useEffect(() => {
    supabase().auth.getUser().then(({ data }) => {
      const email = data.user?.email || ''
      setU({ nome: nomeDoEmail(email), email })
    })
  }, [])
  return u
}
