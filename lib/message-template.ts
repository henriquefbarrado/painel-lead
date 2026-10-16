import type { Status } from './types'

// Para mudar os textos, edite só aqui. Marcadores: {SEU_NOME} e {NOME_DA_LOJA}.
// Status que NÃO estão nesta lista (sem_interesse e convertido) não têm mensagem: ficam só com a tag.
export const MESSAGES: Partial<Record<Status, string>> = {
  novo:
    'Olá, tudo bem? Me chamo {SEU_NOME} e estou entrando em contato com a {NOME_DA_LOJA}. Gostaria de conversar com o responsável para apresentar uma solução que pode fazer sentido para o negócio de vocês. Quem seria a melhor pessoa para conversar sobre isso?',
  contato_realizado:
    'Olá, tudo bem? Aqui é {SEU_NOME}. Te mandei uma mensagem há alguns dias sobre uma solução para a {NOME_DA_LOJA} e queria saber se você conseguiu ver. Posso te explicar rapidinho, sem compromisso, para você avaliar se faz sentido?',
  interessado:
    'Olá, tudo bem? Aqui é {SEU_NOME}. Que bom saber que a {NOME_DA_LOJA} se interessou! Posso te mostrar como funcionaria na prática e já te passar valores e prazos? Se preferir, podemos marcar uma conversa rápida de 10 minutos, no melhor horário para você.',
  negociacao:
    'Olá, tudo bem? Aqui é {SEU_NOME}. Estou passando para saber se você conseguiu avaliar a nossa proposta para a {NOME_DA_LOJA}. Ficou alguma dúvida sobre valores, prazos ou funcionalidades? Posso ajustar o que for preciso para fecharmos da melhor forma. Qual o melhor momento para conversarmos?',
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
