'use client'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarCheck, DatabaseBackup, LayoutDashboard, Target } from 'lucide-react'
import PageHeader from './PageHeader'
import { useToast } from './Toast'
import { supabase } from '@/lib/supabase/client'
import { todosLeads } from '@/lib/leads-api'
import { baixar } from '@/lib/exportar'
import { SEGMENTOS } from '@/lib/segmentos'
import { ativo, contarPorStatus, dataHoje, situacaoFollowUp, somaTipo, taxaConversao, type Lancamento } from '@/lib/metricas'
import { FUNIL, STATUS, STATUS_COR, type Lead } from '@/lib/types'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const COR_BARRA: Record<string, string> = { novo: 'bg-sky-500', contato_realizado: 'bg-violet-500', interessado: 'bg-amber-500', negociacao: 'bg-orange-500', convertido: 'bg-emerald-500', sem_interesse: 'bg-slate-400' }

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]), [fin, setFin] = useState<Lancamento[]>([]), [contatos, setContatos] = useState<{ contatado_em: string }[]>([])
  const [meta, setMeta] = useState(5), [metaTxt, setMetaTxt] = useState('5'), [editaMeta, setEditaMeta] = useState(false), [loading, setLoading] = useState(true)
  const { toast, aviso } = useToast(), mes = dataHoje().slice(0, 7), hoje = dataHoje()

  const carregar = useCallback(async () => {
    const desde = new Date(); desde.setDate(desde.getDate() - 6); desde.setHours(0, 0, 0, 0)
    const [l, f, c, m] = await Promise.all([
      todosLeads(),
      supabase().from('financeiro').select('*'),
      supabase().from('contatos').select('contatado_em').gte('contatado_em', desde.toISOString()),
      supabase().from('config').select('valor').eq('chave', 'meta_mensal').maybeSingle(),
    ])
    if (l.error) toast('Erro ao carregar leads: ' + l.error, 'erro')
    setLeads(l.data); setFin(((f.data || []) as Lancamento[]).map(i => ({ ...i, valor: Number(i.valor) }))); setContatos((c.data as { contatado_em: string }[]) || [])
    const v = Number((m.data?.valor as { fechados?: number } | undefined)?.fechados); if (v > 0) { setMeta(v); setMetaTxt(String(v)) }
    setLoading(false)
  }, [toast])
  useEffect(() => { carregar() }, [carregar])

  const porStatus = useMemo(() => contarPorStatus(leads), [leads])
  const funil = FUNIL.filter(s => s !== 'sem_interesse'), maxFunil = Math.max(1, ...funil.map(s => porStatus[s]))
  const devidos = leads.filter(l => ativo(l.status) && ['hoje', 'atrasado'].includes(situacaoFollowUp(l.proximo_contato, hoje) ?? '')).length
  const porSeg = useMemo(() => {
    const m = new Map<string, number>(); leads.forEach(l => m.set(l.segmento || 'sem', (m.get(l.segmento || 'sem') || 0) + 1))
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1])
  }, [leads])
  const motivos = useMemo(() => {
    const m = new Map<string, number>(); leads.filter(l => l.status === 'sem_interesse' && l.motivo_perda).forEach(l => m.set(l.motivo_perda!, (m.get(l.motivo_perda!) || 0) + 1))
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [leads])
  const dias = useMemo(() => Array.from({ length: 7 }, (_, k) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - k)); const key = dataHoje(d)
    return { key, nome: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''), n: contatos.filter(c => dataHoje(new Date(c.contatado_em)) === key).length }
  }), [contatos])
  const maxDia = Math.max(1, ...dias.map(d => d.n))
  const doMes = fin.filter(i => i.data.startsWith(mes))
  const fechadosMes = new Set(doMes.filter(i => i.tipo === 'receita' && i.lead_id).map(i => i.lead_id)).size
  const pctMeta = Math.min(100, (fechadosMes / Math.max(1, meta)) * 100)

  async function salvarMeta() {
    const n = Math.round(Number(metaTxt)); if (!(n > 0)) return toast('Meta inválida', 'erro')
    const { error } = await supabase().from('config').upsert({ chave: 'meta_mensal', valor: { fechados: n }, updated_at: new Date().toISOString() })
    if (error) return toast(error.message.includes('config') ? 'Erro: rode o arquivo supabase/melhorias.sql no Supabase.' : 'Erro: ' + error.message, 'erro')
    setMeta(n); setEditaMeta(false); toast('Meta salva', 'ok')
  }
  async function backup() {
    const tabelas = ['leads', 'contatos', 'financeiro', 'templates', 'config'], dados: Record<string, unknown> = { gerado_em: new Date().toISOString() }
    for (const t of tabelas) { const { data, error } = await supabase().from(t).select('*'); dados[t] = error ? { erro: error.message } : data }
    baixar(`backup-painel-${hoje}.json`, JSON.stringify(dados, null, 2), 'application/json;charset=utf-8'); toast('Backup baixado', 'ok')
  }

  if (loading) return <div className="space-y-4" aria-busy="true"><div className="skeleton h-28" /><div className="grid gap-4 md:grid-cols-2"><div className="skeleton h-64" /><div className="skeleton h-64" /></div></div>
  return (
    <div className="space-y-6">
      <PageHeader titulo="Início" sub="Como está sua prospecção hoje." icone={<LayoutDashboard size={24} />}>
        <Link href="/hoje" className="btn-w"><CalendarCheck size={16} />Hoje{devidos > 0 ? ` (${devidos})` : ''}</Link>
        <button className="btn-w" onClick={backup}><DatabaseBackup size={16} />Backup</button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card space-y-3 p-5 lg:col-span-2">
          <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 font-semibold"><Target size={16} />Meta do mês</h2>
            {editaMeta ? <span className="flex items-center gap-2"><input className="inp !w-20 !py-1" inputMode="numeric" value={metaTxt} onChange={e => setMetaTxt(e.target.value)} aria-label="Meta de sites fechados" /><button className="btn-p !py-1" onClick={salvarMeta}>Salvar</button></span>
              : <button className="btn !py-1 text-xs" onClick={() => setEditaMeta(true)}>Alterar meta</button>}</div>
          <p className="text-3xl font-bold">{fechadosMes} <span className="text-lg font-medium text-slate-500">de {meta} {meta === 1 ? 'site fechado' : 'sites fechados'}</span></p>
          <div className="h-3 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={fechadosMes} aria-valuemax={meta}><div className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 transition-all" style={{ width: `${pctMeta}%` }} /></div>
          <p className="text-sm text-slate-500">Receita do mês: <b className="text-slate-900">{brl(somaTipo(doMes, 'receita'))}</b> · conta cada lead com receita lançada no mês.</p>
        </section>
        <section className="card space-y-1 p-5"><h2 className="font-semibold">Conversão</h2>
          <p className="text-4xl font-bold">{(taxaConversao(leads) * 100).toFixed(1).replace('.', ',')}%</p>
          <p className="text-sm text-slate-500">{porStatus.convertido} fechados de {leads.filter(l => l.status !== 'novo').length} leads abordados.</p></section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card space-y-3 p-5"><h2 className="font-semibold">Funil de conversão</h2>
          {leads.length === 0 ? <p className="text-sm text-slate-500">Sem leads ainda. <Link href="/buscar" className="text-indigo-600 underline">Busque lojas</Link> ou <Link href="/importar" className="text-indigo-600 underline">importe uma planilha</Link>.</p> :
            funil.map((s, i) => (
              <Link key={s} href={`/leads?status=${s}`} className="block space-y-1">
                <div className="flex justify-between text-sm"><span className={`lh-chip ${STATUS_COR[s]}`}>{STATUS[s]}</span>
                  <span><b>{porStatus[s]}</b>{i > 0 && porStatus[funil[i - 1]] > 0 && <span className="ml-2 text-xs text-slate-500">{Math.round((porStatus[s] / porStatus[funil[i - 1]]) * 100)}% da etapa anterior</span>}</span></div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-200"><div className={`h-full ${COR_BARRA[s]}`} style={{ width: `${(porStatus[s] / maxFunil) * 100}%` }} /></div></Link>))}
          {porStatus.sem_interesse > 0 && <p className="border-t pt-3 text-sm text-slate-500"><b>{porStatus.sem_interesse}</b> sem interesse{motivos.length > 0 && <>. Principais motivos: {motivos.map(([m, n]) => `${m} (${n})`).join(', ')}</>}</p>}
        </section>
        <section className="card space-y-3 p-5"><h2 className="font-semibold">Leads por segmento</h2>
          {porSeg.length === 0 ? <p className="text-sm text-slate-500">Nenhum lead cadastrado.</p> : porSeg.map(([k, n]) => (
            <div key={k} className="space-y-1"><div className="flex justify-between text-sm"><span>{SEGMENTOS[k]?.nome ?? 'Sem segmento'}</span><b>{n}</b></div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-gradient-to-r from-indigo-600 to-violet-500" style={{ width: `${(n / porSeg[0][1]) * 100}%` }} /></div></div>))}
        </section>
      </div>

      <section className="card space-y-3 p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Contatos nos últimos 7 dias</h2><b className="text-2xl">{contatos.length}</b></div>
        <div className="flex h-28 items-end gap-2">{dias.map(d => (
          <div key={d.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1"><span className="text-xs text-slate-500">{d.n || ''}</span>
            <div className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-violet-400" style={{ height: `${Math.max(d.n ? 8 : 3, (d.n / maxDia) * 70)}%` }} /><span className="text-xs capitalize text-slate-500">{d.nome}</span></div>))}</div>
      </section>
      {aviso}
    </div>
  )
}
