import { supabase } from './supabase/client'
import type { Status } from './types'

// Muda o status de um ou vários leads. "Sem interesse" guarda o motivo; fechado/perdido limpa o follow-up.
export async function atualizarStatus(ids: string[], status: Status, motivo?: string | null) {
  const campos: Record<string, unknown> = { status, motivo_perda: status === 'sem_interesse' ? (motivo ?? null) : null }
  if (status === 'convertido' || status === 'sem_interesse') campos.proximo_contato = null
  const { error } = await supabase().from('leads').update(campos).in('id', ids)
  return error?.message ?? null
}
