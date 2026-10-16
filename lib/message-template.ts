// Para mudar o texto padrão da mensagem, edite só aqui.
export const MESSAGE_TEMPLATE =
  'Olá, tudo bem? Me chamo {SEU_NOME} e estou entrando em contato com a {NOME_DA_LOJA}. Gostaria de conversar com o responsável para apresentar uma solução que pode fazer sentido para o negócio de vocês. Quem seria a melhor pessoa para conversar sobre isso?'

export function buildMessage(lojaNome: string, seuNome: string) {
  return MESSAGE_TEMPLATE.replace('{SEU_NOME}', seuNome || '[SEU NOME]').replace('{NOME_DA_LOJA}', lojaNome)
}

// Retorna só dígitos com DDI 55 (Brasil), ou null se o número for inválido.
export function whatsappNumber(raw: string | null) {
  const d = (raw || '').replace(/\D/g, '')
  if (d.length === 10 || d.length === 11) return '55' + d
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) return d
  return null
}
export const whatsappLink = (num: string, msg: string) => `https://wa.me/${num}?text=${encodeURIComponent(msg)}`
