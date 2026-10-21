import type { Status } from './types'

// Para mudar os textos, edite só aqui. Marcadores: {SEU_NOME} e {NOME_DA_LOJA}.
// Só o primeiro contato tem mensagem automática; as demais etapas ficam como status/etiquetas.
const PRIMEIRO_CONTATO =
    'Olá, tudo bem? Aqui é o {SEU_NOME}, eu crio sites e páginas para negócios da região. Vi a {NOME_DA_LOJA} e queria fazer uma pergunta rápida: vocês já têm um site ou página própria para os clientes encontrarem e entrarem em contato? Se ainda não tiver, posso te mostrar um exemplo bem simples de como ficaria, sem compromisso.'

export const MESSAGES: Partial<Record<Status, string>> = {
  // A mensagem padrão é usada apenas na fila de primeiro contato.
  // As demais etapas do funil continuam como status/etiquetas do lead.
  novo: PRIMEIRO_CONTATO,
  entrar_em_contato: PRIMEIRO_CONTATO,
}

export const temMensagem = (status: Status) => !!MESSAGES[status]

export function buildMessage(lojaNome: string, seuNome: string, status: Status = 'novo') {
  const modelo = MESSAGES[status]
  if (!modelo) return ''
  return modelo.replace(/\{SEU_NOME\}/g, seuNome || '[SEU NOME]').replace(/\{NOME_DA_LOJA\}/g, lojaNome)
}

// Retorna só dígitos com DDI 55 (Brasil), ou null se o número for inválido.
export function whatsappNumber(raw: string | null) {
  const d = (raw || '').replace(/\D/g, '')
  if (d.length === 10 || d.length === 11) return '55' + d
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) return d
  return null
}
export const whatsappLink = (num: string, msg: string) => `https://wa.me/${num}?text=${encodeURIComponent(msg)}`