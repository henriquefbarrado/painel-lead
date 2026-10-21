import type { SupabaseClient } from '@supabase/supabase-js'

/** Após este tempo em "Contato realizado" sem avanço → Sem interesse. */
export const HORAS_SEM_RESPOSTA = 24
export const MOTIVO_NAO_RESPONDEU = 'Não respondeu'

type Resultado = { movidos: number; erro: string | null }

/**
 * Move para "Sem interesse" (motivo "Não respondeu") os leads em
 * "Contato realizado" há mais de HORAS_SEM_RESPOSTA horas.
 * Critério: status = contato_realizado e (ultimo_contato ?? created_at) < agora − 48h.
 *
 * Aceita qualquer cliente Supabase (browser com RLS ou admin com service_role).
 */
export async function expirarContatosSemRespostaCom(db: SupabaseClient): Promise<Resultado> {
  const limite = new Date(Date.now() - HORAS_SEM_RESPOSTA * 60 * 60 * 1000).toISOString()
  const { data, error } = await db
    .from('leads')
    .select('id, ultimo_contato, created_at')
    .eq('status', 'contato_realizado')
  if (error) return { movidos: 0, erro: error.message }

  const ids = (data || [])
    .filter(l => (l.ultimo_contato || l.created_at) < limite)
    .map(l => l.id as string)
  if (ids.length === 0) return { movidos: 0, erro: null }

  let movidos = 0
  for (let i = 0; i < ids.length; i += 100) {
    const lote = ids.slice(i, i + 100)
    const { error: errUp } = await db
      .from('leads')
      .update({
        status: 'sem_interesse',
        motivo_perda: MOTIVO_NAO_RESPONDEU,
        proximo_contato: null,
      })
      .in('id', lote)
    if (errUp) return { movidos, erro: errUp.message }
    movidos += lote.length
  }
  return { movidos, erro: null }
}