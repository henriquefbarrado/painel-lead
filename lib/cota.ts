// Plano grátis do OpenWeb Ninja: 500 lojas por mês. Cada busca consome a quantidade consultada.
export const LIMITE_MES = 500
export const BUSCAS_POR_MINUTO = 5
export const CACHE_HORAS = 24
export const chaveBusca = (segmento: string, local: string, qtd: number) => {
  const n = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ')
  return `${n(segmento)}|${n(local)}|${qtd}`
}
export const inicioDoMesUtc = (d = new Date()) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString()
