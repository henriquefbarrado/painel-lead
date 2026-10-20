import type { Status } from './types'

// Para mudar os textos, edite só aqui. Marcadores: {SEU_NOME} e {NOME_DA_LOJA}.
// Status que NÃO estão nesta lista (sem_interesse e convertido) não têm mensagem: ficam só com a tag.
const PRIMEIRO_CONTATO =
    'Olá, tudo bem? Aqui é o {SEU_NOME}, eu crio sites e páginas para negócios da região. Vi a {NOME_DA_LOJA} e queria fazer uma pergunta rápida: vocês já têm um site ou página própria para os clientes encontrarem e entrarem em contato? Se ainda não tiver, posso te mostrar um exemplo bem simples de como ficaria, sem compromisso.'

export const MESSAGES: Partial<Record<Status, string>> = {
  novo: PRIMEIRO_CONTATO,
  entrar_em_contato: PRIMEIRO_CONTATO, // mesma mensagem do "Novo": é a fila de quem vai receber o primeiro contato
  contato_realizado:
    'Oi, tudo bem? {SEU_NOME} aqui de novo. Sei que a rotina da {NOME_DA_LOJA} é corrida, então vou ser breve: posso te mandar um exemplo de como ficaria uma página para vocês? É só responder "pode" que eu envio. Se não fizer sentido agora, sem problema, é só me avisar.',
  interessado:
    'Que bom, obrigado pelo retorno! Para eu montar algo certinho para a {NOME_DA_LOJA}, me conta rapidinho: hoje os clientes chegam até vocês principalmente por onde (Instagram, WhatsApp, indicação)? Com isso eu te envio uma proposta com valores e prazo. Se preferir, podemos conversar 10 minutinhos hoje ou amanhã.',
  negociacao:
    'Oi, tudo bem? {SEU_NOME} aqui. Passando para saber o que você achou da proposta para a {NOME_DA_LOJA}. Ficou alguma dúvida sobre valores, prazo ou o que está incluso? Se alguma coisa não encaixou, me fala que eu ajusto. Se fizer sentido para você, já combinamos o início.',
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