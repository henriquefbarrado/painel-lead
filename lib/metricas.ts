import { FUNIL, naoAbordado, type Lead, type Status } from './types'

export type Lancamento = {
  id: string; tipo: 'receita' | 'despesa'; descricao: string; valor: number; data: string
  lead_id?: string | null; categoria?: string | null; situacao?: 'pago' | 'pendente'; recorrente?: boolean
}

export const CATEGORIAS_RECEITA = ['Landing page', 'Site institucional', 'Loja virtual', 'Manutenção', 'Outros']
export const CATEGORIAS_DESPESA = ['Hospedagem', 'Domínio', 'Ferramentas', 'Anúncios', 'Impostos', 'Outros']

export const contarPorStatus = (leads: Pick<Lead, 'status'>[]) =>
  Object.fromEntries(FUNIL.map(s => [s, leads.filter(l => l.status === s).length])) as Record<Status, number>

// Conversão = convertidos ÷ leads que já foram abordados (tudo que saiu de "Novo").
export function taxaConversao(leads: Pick<Lead, 'status'>[]) {
  const abordados = leads.filter(l => !naoAbordado(l.status)).length
  const fechados = leads.filter(l => l.status === 'convertido').length
  return abordados === 0 ? 0 : fechados / abordados
}

const pagas = (l: Lancamento[]) => l.filter(i => (i.situacao ?? 'pago') === 'pago')
export const somaTipo = (l: Lancamento[], t: Lancamento['tipo'], so: 'pago' | 'pendente' | 'todos' = 'pago') =>
  l.filter(i => i.tipo === t && (so === 'todos' || (i.situacao ?? 'pago') === so)).reduce((s, i) => s + i.valor, 0)

export function ticketMedio(l: Lancamento[]) {
  const r = pagas(l).filter(i => i.tipo === 'receita')
  return r.length === 0 ? 0 : r.reduce((s, i) => s + i.valor, 0) / r.length
}

// Custo por lead = despesas pagas ÷ leads cadastrados.
export const custoPorLead = (l: Lancamento[], totalLeads: number) => totalLeads === 0 ? 0 : somaTipo(l, 'despesa') / totalLeads

export function receitaPorSegmento(l: Lancamento[], leads: Pick<Lead, 'id' | 'segmento'>[]) {
  const seg = new Map(leads.map(x => [x.id, x.segmento || 'sem_segmento']))
  const m = new Map<string, number>()
  pagas(l).filter(i => i.tipo === 'receita').forEach(i => {
    const k = (i.lead_id && seg.get(i.lead_id)) || 'sem_segmento'
    m.set(k, (m.get(k) || 0) + i.valor)
  })
  return Array.from(m.entries()).sort((a, b) => b[1] - a[1])
}

// Follow-up: "atrasado" (data anterior a hoje), "hoje" ou "futuro". Datas no formato AAAA-MM-DD.
export const dataHoje = (d = new Date()) => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10) }
export function situacaoFollowUp(proximo: string | null | undefined, hoje = dataHoje()): 'atrasado' | 'hoje' | 'futuro' | null {
  if (!proximo) return null
  return proximo < hoje ? 'atrasado' : proximo === hoje ? 'hoje' : 'futuro'
}
// Leads que ainda estão "vivos" no funil (não fechados nem perdidos).
export const ativo = (s: Status) => s !== 'convertido' && s !== 'sem_interesse'

export function inicioDoMes(d = new Date()) { return dataHoje(d).slice(0, 7) }
export function repetirNoMes(lancs: Lancamento[], mesDestino: string): Omit<Lancamento, 'id'>[] {
  // Copia para o mês de destino as despesas recorrentes do mês anterior que ainda não existem lá.
  const [a, m] = mesDestino.split('-').map(Number), ant = m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, '0')}`
  const jaTem = new Set(lancs.filter(i => i.data.startsWith(mesDestino) && i.recorrente).map(i => i.descricao.toLowerCase()))
  return lancs.filter(i => i.recorrente && i.data.startsWith(ant) && !jaTem.has(i.descricao.toLowerCase()))
    .map(({ id: _id, ...r }) => ({ ...r, data: `${mesDestino}-${r.data.slice(8, 10)}`, situacao: 'pendente' as const }))
}
