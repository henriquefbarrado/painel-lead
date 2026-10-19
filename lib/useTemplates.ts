'use client'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase/client'
import type { Template } from './templates'

// Carrega os templates editáveis. Se a tabela ainda não existir, devolve lista vazia (vale o texto padrão).
export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]), [pronto, setPronto] = useState(false)
  const recarregar = useCallback(async () => {
    const { data } = await supabase().from('templates').select('*').order('created_at')
    setTemplates((data as Template[]) || []); setPronto(true)
  }, [])
  useEffect(() => { recarregar() }, [recarregar])
  return { templates, pronto, recarregar }
}
