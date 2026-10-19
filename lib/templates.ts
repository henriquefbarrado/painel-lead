import { MESSAGES } from './message-template'
import type { Lead, Status } from './types'

export type Template = { id: string; nome: string; segmento: string | null; status: Status; texto: string }

// Variáveis aceitas nos templates. As antigas {SEU_NOME} e {NOME_DA_LOJA} continuam funcionando.
export const VARIAVEIS = ['{nome_loja}', '{seu_nome}', '{responsavel}', '{cidade}'] as const

export function aplicarVariaveis(texto: string, v: { nomeLoja: string; seuNome: string; responsavel?: string | null; cidade?: string | null }) {
  const rep = (t: string, re: RegExp, val: string) => t.replace(re, () => val)
  let t = texto
  t = rep(t, /\{(SEU_NOME|seu_nome)\}/g, v.seuNome || '[SEU NOME]')
  t = rep(t, /\{(NOME_DA_LOJA|nome_loja)\}/g, v.nomeLoja)
  t = rep(t, /\{responsavel\}/g, v.responsavel?.trim() || 'tudo bem')
  t = rep(t, /\{cidade\}/g, v.cidade?.trim() || 'sua região')
  return t
}

// Prefere o template do segmento do lead; se não houver, o geral (sem segmento); se não houver, null.
export function escolherTemplate(templates: Template[], status: Status, segmento: string | null | undefined): Template | null {
  const doStatus = templates.filter(t => t.status === status)
  return doStatus.find(t => segmento && t.segmento === segmento) ?? doStatus.find(t => !t.segmento) ?? null
}

// Mensagem final do lead. Só existe para os status que têm mensagem (sem_interesse e convertido ficam sem).
export function mensagemDoLead(lead: Pick<Lead, 'nome_loja' | 'status' | 'segmento' | 'responsavel' | 'cidade'>, seuNome: string, templates: Template[] = []) {
  if (!MESSAGES[lead.status]) return ''
  const modelo = escolherTemplate(templates, lead.status, lead.segmento)?.texto ?? MESSAGES[lead.status]!
  return aplicarVariaveis(modelo, { nomeLoja: lead.nome_loja, seuNome, responsavel: lead.responsavel, cidade: lead.cidade })
}
