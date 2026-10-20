import { supabase } from './supabase/client'
import { dataHoje, CATEGORIAS_RECEITA } from './metricas'
import type { Lead } from './types'

// Quais destes leads ainda NÃO têm receita lançada (evita lançar a mesma venda duas vezes).
export async function semReceita(ids: string[]) {
  const { data } = await supabase().from('financeiro').select('lead_id').eq('tipo', 'receita').in('lead_id', ids)
  const tem = new Set((data || []).map(r => r.lead_id as string))
  return ids.filter(i => !tem.has(i))
}

// Sugere a categoria da receita a partir das soluções marcadas no lead.
export function categoriaDaVenda(l: Pick<Lead, 'solucoes'>) {
  const s = l.solucoes || []
  if (s.includes('landing_page') || s.includes('pagina_vendas')) return CATEGORIAS_RECEITA[0]
  if (s.includes('site_institucional')) return CATEGORIAS_RECEITA[1]
  if (s.includes('pagina_compras') || s.includes('catalogo_online')) return CATEGORIAS_RECEITA[2]
  return CATEGORIAS_RECEITA[0]
}

export async function registrarVenda(l: Pick<Lead, 'id' | 'nome_loja'>, valor: number, situacao: 'pago' | 'pendente', categoria: string) {
  const { error } = await supabase().from('financeiro').insert({
    tipo: 'receita', descricao: `Venda — ${l.nome_loja}`, valor, data: dataHoje(), categoria: categoria || null,
    situacao, recorrente: false, lead_id: l.id })
  return error?.message ?? null
}
