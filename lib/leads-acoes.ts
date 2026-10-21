import { supabase } from './supabase/client'
import type { Status } from './types'
import { expirarContatosSemRespostaCom, HORAS_SEM_RESPOSTA, MOTIVO_NAO_RESPONDEU } from './expirar-contatos'

export { HORAS_SEM_RESPOSTA, MOTIVO_NAO_RESPONDEU }

// Muda o status de um ou vários leads. "Sem interesse" guarda o motivo; fechado/perdido limpa o follow-up.
// Ao entrar em "Contato realizado", marca ultimo_contato (relógio das 48h).
export async function atualizarStatus(ids: string[], status: Status, motivo?: string | null) {
  const campos: Record<string, unknown> = { status, motivo_perda: status === 'sem_interesse' ? (motivo ?? null) : null }
  if (status === 'convertido' || status === 'sem_interesse') campos.proximo_contato = null
  if (status === 'contato_realizado') campos.ultimo_contato = new Date().toISOString()
  const { error } = await supabase().from('leads').update(campos).in('id', ids)
  return error?.message ?? null
}

/**
 * Versão do navegador (respeita RLS — só leads do usuário logado).
 * O cron do servidor usa a mesma lógica com service_role em /api/cron/expirar-contatos.
 */
export async function expirarContatosSemResposta() {
  return expirarContatosSemRespostaCom(supabase())
}
