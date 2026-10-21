import { supabase } from './supabase/client'
import { normalizarStatus, type Lead } from './types'

// O Supabase devolve no máximo 1000 linhas por consulta. Com importação por planilha
// a base passa disso fácil, então esta função busca em páginas até acabar.
export async function todosLeads(): Promise<{ data: Lead[]; error: string | null }> {
  const lote = 1000, tudo: Lead[] = []
  for (let de = 0; ; de += lote) {
    const { data, error } = await supabase().from('leads').select('*')
      .order('created_at', { ascending: false }).order('id').range(de, de + lote - 1)
    if (error) return { data: tudo, error: error.message }
    const loteDados = ((data as Lead[]) || []).map(lead => ({
      ...lead,
      // Leads da antiga etapa 'Entrar em contato' reaparecem em 'Novo'.
      status: normalizarStatus((lead as Lead).status),
    }))
    tudo.push(...loteDados)
    if (!data || data.length < lote) break
  }
  return { data: tudo, error: null }
}
