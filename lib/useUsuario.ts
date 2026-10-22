'use client'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase/client'
import { nomeDoEmail, precisaDefinirNome } from './usuarios'

export type Usuario = {
  nome: string
  email: string
  /** true enquanto o getUser ainda não respondeu */
  carregando: boolean
  /** true se a pessoa ainda não definiu o nome (e não está no mapa fixo) */
  precisaNome: boolean
  /** Grava o nome no user_metadata do Supabase e atualiza o estado local */
  definirNome: (nome: string) => Promise<string | null>
}

// Devolve dados do usuário logado. Nome vem do metadata (primeiro login) ou do fallback.
export function useUsuario(): Usuario {
  const [u, setU] = useState<{ nome: string; email: string; precisaNome: boolean } | null>(null)
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    const { data } = await supabase().auth.getUser()
    const email = data.user?.email || ''
    const meta = (data.user?.user_metadata ?? {}) as Record<string, unknown>
    setU({
      nome: nomeDoEmail(email, meta),
      email,
      precisaNome: !!email && precisaDefinirNome(email, meta),
    })
    setCarregando(false)
  }, [])

  useEffect(() => {
    carregar()
    const { data: sub } = supabase().auth.onAuthStateChange(() => { carregar() })
    return () => sub.subscription.unsubscribe()
  }, [carregar])

  const definirNome = useCallback(async (nome: string) => {
    const n = nome.trim()
    if (!n) return 'Digite o seu nome.'
    if (n.length > 40) return 'Nome muito longo (máx. 40 caracteres).'
    const { error } = await supabase().auth.updateUser({ data: { nome: n } })
    if (error) return error.message
    setU(prev => prev ? { ...prev, nome: n, precisaNome: false } : { nome: n, email: '', precisaNome: false })
    return null
  }, [])

  return {
    nome: u?.nome ?? '',
    email: u?.email ?? '',
    carregando,
    precisaNome: u?.precisaNome ?? false,
    definirNome,
  }
}
