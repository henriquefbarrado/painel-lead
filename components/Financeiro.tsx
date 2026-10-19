'use client'
import PageHeader from './PageHeader'
import ConfirmDialog from './ConfirmDialog'
import { useToast } from './Toast'
import Link from 'next/link'
import { Clock, Download, PiggyBank, Repeat, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { todosLeads } from '@/lib/leads-api'
import { atualizarStatus } from '@/lib/leads-acoes'
import { baixar, paraCsv } from '@/lib/exportar'
import { SEGMENTOS } from '@/lib/segmentos'
import { CATEGORIAS_DESPESA, CATEGORIAS_RECEITA, custoPorLead, dataHoje, receitaPorSegmento, repetirNoMes, somaTipo, taxaConversao, ticketMedio, type Lancamento } from '@/lib/metricas'
import type { Lead } from '@/lib/types'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const MIGRACAO = 'Erro: rode o arquivo supabase/melhorias.sql no Supabase para usar este recurso.'
const novoForm = (lead = '') => ({ id: '', tipo: 'receita' as Lancamento['tipo'], descricao: '', valor: '', data: dataHoje(), categoria: '', leadTxt: lead, situacao: 'pago' as 'pago' | 'pendente', recorrente: false })

export default function Financeiro() {
  const params = useSearchParams()
  const [itens, setItens] = useState<Lancamento[]>([]), [leads, setLeads] = useState<Lead[]>([]), [loading, setLoading] = useState(true)
  const [apagar, setApagar] = useState<Lancamento | null>(null), [salvando, setSalvando] = useState(false)
  const [mes, setMes] = useState(dataHoje().slice(0, 7)), [f, setF] = useState(novoForm())
  const { toast, aviso } = useToast()
  const rotuloLead = (l: Lead) => `${l.nome_loja}${l.cidade ? ' — ' + l.cidade : ''}`

  const carregar = useCallback(async () => {
    const [fin, ls] = await Promise.all([supabase().from('financeiro').select('*').order('data', { ascending: false }), todosLeads()])
    if (fin.error) toast('Erro: ' + fin.error.message, 'erro')
    setItens(((fin.data || []) as Lancamento[]).map(i => ({ ...i, valor: Number(i.valor) }))); setLeads(ls.data); setLoading(false)
  }, [toast])
  useEffect(() => { carregar() }, [carregar])
  useEffect(() => { // chegou pela ficha do lead: já vem com o lead escolhido
    const id = params.get('lead'); if (!id || !leads.length) return
    const l = leads.find(x => x.id === id)
    if (l) setF(p => p.leadTxt ? p : { ...p, leadTxt: rotuloLead(l), descricao: p.descricao || `Site — ${l.nome_loja}` })
  }, [params, leads]) // eslint-disable-line react-hooks/exhaustive-deps

  const leadEscolhido = useMemo(() => leads.find(l => rotuloLead(l) === f.leadTxt) ?? null, [leads, f.leadTxt])
  const categorias = f.tipo === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    const valor = parseFloat(f.valor.replace(/\./g, '').replace(',', '.'))
    if (isNaN(valor) || valor < 0) return toast('Valor inválido', 'erro')
    if (f.leadTxt && !leadEscolhido) return toast('Lead inválido: escolha um da lista ou deixe em branco', 'erro')
    setSalvando(true)
    const dados = { tipo: f.tipo, descricao: f.descricao.trim(), valor, data: f.data, categoria: f.categoria || null, situacao: f.situacao,
      recorrente: f.tipo === 'despesa' && f.recorrente, lead_id: f.tipo === 'receita' ? leadEscolhido?.id ?? null : null }
    const { error } = f.id ? await supabase().from('financeiro').update(dados).eq('id', f.id) : await supabase().from('financeiro').insert(dados)
    setSalvando(false)
    if (error) return toast(/column|schema/i.test(error.message) ? MIGRACAO : 'Erro: ' + error.message, 'erro')
    let msg = f.id ? 'Lançamento atualizado' : 'Lançamento salvo'
    if (dados.lead_id && leadEscolhido && leadEscolhido.status !== 'convertido') { // receita de um lead = lead fechado
      const erro = await atualizarStatus([dados.lead_id], 'convertido'); if (!erro) msg += `. ${leadEscolhido.nome_loja} marcado como Convertido`
    }
    toast(msg, 'ok'); setF(novoForm()); carregar()
  }
  function editar(i: Lancamento) {
    const l = leads.find(x => x.id === i.lead_id)
    setF({ id: i.id, tipo: i.tipo, descricao: i.descricao, valor: String(i.valor).replace('.', ','), data: i.data, categoria: i.categoria ?? '', leadTxt: l ? rotuloLead(l) : '', situacao: i.situacao ?? 'pago', recorrente: !!i.recorrente })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  async function excluir(i: Lancamento) {
    const { error } = await supabase().from('financeiro').delete().eq('id', i.id)
    if (error) return toast('Erro: ' + error.message, 'erro'); toast('Lançamento excluído', 'ok'); carregar()
  }
  async function quitar(i: Lancamento) {
    const { error } = await supabase().from('financeiro').update({ situacao: 'pago', data: dataHoje() }).eq('id', i.id)
    if (error) return toast('Erro: ' + error.message, 'erro'); toast(i.tipo === 'receita' ? 'Marcado como recebido' : 'Marcado como pago', 'ok'); carregar()
  }
  async function lancarRecorrentes() {
    const novos = repetirNoMes(itens, mes)
    if (!novos.length) return toast('Nenhuma despesa recorrente pendente para este mês', 'erro')
    const { error } = await supabase().from('financeiro').insert(novos)
    if (error) return toast(/column|schema/i.test(error.message) ? MIGRACAO : 'Erro: ' + error.message, 'erro')
    toast(`${novos.length} despesa${novos.length === 1 ? '' : 's'} recorrente${novos.length === 1 ? '' : 's'} lançada${novos.length === 1 ? '' : 's'} (a pagar)`, 'ok'); carregar()
  }
  function exportar() {
    baixar(`financeiro-${mes}.csv`, paraCsv(doMes.map(i => ({ ...i, lead: leads.find(l => l.id === i.lead_id)?.nome_loja ?? '', situacao: i.situacao ?? 'pago', recorrente: i.recorrente ? 'sim' : '' })) as unknown as Record<string, unknown>[],
      [{ chave: 'data', rotulo: 'data' }, { chave: 'tipo', rotulo: 'tipo' }, { chave: 'descricao', rotulo: 'descricao' }, { chave: 'categoria', rotulo: 'categoria' }, { chave: 'lead', rotulo: 'lead' }, { chave: 'valor', rotulo: 'valor' }, { chave: 'situacao', rotulo: 'situacao' }, { chave: 'recorrente', rotulo: 'recorrente' }]))
  }

  const doMes = useMemo(() => itens.filter(i => i.data.startsWith(mes)), [itens, mes])
  const rec = somaTipo(doMes, 'receita'), desp = somaTipo(doMes, 'despesa'), lucro = rec - desp
  const lucroTotal = somaTipo(itens, 'receita') - somaTipo(itens, 'despesa')
  const aReceber = somaTipo(itens, 'receita', 'pendente'), aPagar = somaTipo(itens, 'despesa', 'pendente')
  const meses = useMemo(() => Array.from({ length: 6 }, (_, k) => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - k))
    const key = dataHoje(d).slice(0, 7), l = itens.filter(i => i.data.startsWith(key))
    return { key, nome: d.toLocaleDateString('pt-BR', { month: 'short' }), v: somaTipo(l, 'receita') - somaTipo(l, 'despesa') }
  }), [itens])
  const max = Math.max(1, ...meses.map(m => Math.abs(m.v))), semDados = itens.length === 0
  const porSeg = useMemo(() => receitaPorSegmento(itens, leads), [itens, leads])
  const kpis: [string, number, string][] = [['Receitas do mês', rec, 'emerald'], ['Despesas do mês', desp, 'rose'], ['Lucro do mês', lucro, 'indigo'], ['Lucro total', lucroTotal, 'amber'], ['A receber', aReceber, 'sky']]
  const icones = [TrendingUp, TrendingDown, Wallet, PiggyBank, Clock]
  const estilo: Record<string, string> = { emerald: 'bg-emerald-100 text-emerald-600', rose: 'bg-rose-100 text-rose-600', indigo: 'bg-white/20 text-white', amber: 'bg-amber-100 text-amber-600', sky: 'bg-sky-100 text-sky-600' }

  return (
    <div className="space-y-6">
      <PageHeader titulo="Financeiro" sub="Receitas, despesas, lucro e o que ainda vai entrar." icone={<Wallet size={24} />}>
        <button className="btn-w" onClick={exportar} disabled={!doMes.length}><Download size={16} />CSV</button>
        <input type="month" aria-label="Mês" className="rounded-xl bg-white/95 px-3 py-2 text-sm font-medium text-[#1e293b] focus:outline-none" value={mes} onChange={e => setMes(e.target.value)} />
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {kpis.map(([n, v, cor], i) => { const I = icones[i], dest = i === 2; return (
          <div key={n} className={`card card-hover p-4 ${dest ? '!border-0 bg-gradient-to-br from-indigo-600 to-violet-600 text-white' : ''}`}>
            <div className={`mb-3 grid h-10 w-10 place-items-center rounded-xl ${estilo[cor]}`}><I size={20} /></div>
            <p className={`text-sm ${dest ? 'text-indigo-100' : 'text-slate-500'}`}>{n}</p>
            <p className={`text-xl font-bold sm:text-2xl ${!dest && n.startsWith('Lucro') && v < 0 ? 'text-rose-600' : ''}`}>{brl(v)}</p>
            {n === 'A receber' && aPagar > 0 && <p className="text-xs text-slate-500">A pagar: {brl(aPagar)}</p>}</div>) })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <form onSubmit={salvar} className="card space-y-3 p-4">
          <h2 className="font-semibold">{f.id ? 'Editar lançamento' : 'Novo lançamento'}</h2>
          <div className="grid grid-cols-2 gap-2">
            {(['receita', 'despesa'] as const).map(t => (
              <button type="button" key={t} onClick={() => setF({ ...f, tipo: t, categoria: '', leadTxt: t === 'despesa' ? '' : f.leadTxt })}
                className={`rounded-xl border px-3 py-2 text-sm font-medium ${f.tipo === t ? (t === 'receita' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-rose-500 bg-rose-50 text-rose-700') : 'border-slate-300'}`}>
                {t === 'receita' ? 'Receita' : 'Despesa'}</button>))}
          </div>
          {f.tipo === 'receita' && <>
            <input className="inp" list="leads-lista" placeholder="Lead (opcional): comece a digitar o nome" value={f.leadTxt} onChange={e => setF({ ...f, leadTxt: e.target.value })} aria-label="Lead" />
            <datalist id="leads-lista">{leads.slice(0, 500).map(l => <option key={l.id} value={rotuloLead(l)} />)}</datalist>
            {leadEscolhido && leadEscolhido.status !== 'convertido' && <p className="text-xs text-emerald-600">Ao salvar, {leadEscolhido.nome_loja} será marcado como Convertido.</p>}</>}
          <input className="inp" required placeholder="Descrição (ex.: site da Loja X)" value={f.descricao} onChange={e => setF({ ...f, descricao: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <input className="inp" required inputMode="decimal" placeholder="Valor (ex.: 1500,00)" value={f.valor} onChange={e => setF({ ...f, valor: e.target.value })} aria-label="Valor" />
            <input className="inp" type="date" required value={f.data} onChange={e => setF({ ...f, data: e.target.value })} aria-label="Data" />
          </div>
          <select className="inp" value={f.categoria} onChange={e => setF({ ...f, categoria: e.target.value })} aria-label="Categoria"><option value="">Categoria…</option>{categorias.map(c => <option key={c}>{c}</option>)}</select>
          <select className="inp" value={f.situacao} onChange={e => setF({ ...f, situacao: e.target.value as 'pago' | 'pendente' })} aria-label="Situação">
            <option value="pago">{f.tipo === 'receita' ? 'Já recebido' : 'Já pago'}</option><option value="pendente">{f.tipo === 'receita' ? 'A receber' : 'A pagar'}</option></select>
          {f.tipo === 'despesa' && <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={f.recorrente} onChange={e => setF({ ...f, recorrente: e.target.checked })} />Despesa recorrente (todo mês)</label>}
          <div className="flex gap-2"><button className="btn-p flex-1" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button>{f.id && <button type="button" className="btn" onClick={() => setF(novoForm())}>Cancelar</button>}</div>
        </form>

        <div className="card p-4 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Lucro dos últimos 6 meses</h2>
          {semDados ? <div className="grid h-44 place-items-center text-center text-sm text-slate-500"><div><Wallet className="mx-auto mb-2 text-slate-300" size={32} />Registre sua primeira receita para ver o gráfico.<br />Ao fechar um site, lance o valor ao lado e vincule ao lead.</div></div> : (
            <div className="flex h-44 items-end gap-3">
              {meses.map(m => (
                <div key={m.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={brl(m.v)}>
                  <span className="text-[11px] text-slate-500">{brl(m.v).replace(/\s/g, ' ')}</span>
                  <div className={`w-full rounded-t-xl transition hover:opacity-80 ${m.v >= 0 ? 'bg-gradient-to-t from-indigo-600 to-violet-400' : 'bg-gradient-to-t from-rose-500 to-rose-300'}`} style={{ height: `${Math.max(4, (Math.abs(m.v) / max) * 100)}%`, maxHeight: '75%' }} />
                  <span className="text-xs capitalize text-slate-500">{m.nome}</span></div>))}
            </div>)}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card grid grid-cols-3 gap-3 p-4 text-center">
          <div><p className="text-xs text-slate-500">Ticket médio</p><p className="text-lg font-bold">{brl(ticketMedio(itens))}</p></div>
          <div><p className="text-xs text-slate-500">Conversão</p><p className="text-lg font-bold">{(taxaConversao(leads) * 100).toFixed(1).replace('.', ',')}%</p><p className="text-[11px] text-slate-500">fechados ÷ abordados</p></div>
          <div><p className="text-xs text-slate-500">Custo por lead</p><p className="text-lg font-bold">{brl(custoPorLead(itens, leads.length))}</p></div>
        </div>
        <div className="card space-y-2 p-4"><h2 className="font-semibold">Receita por segmento</h2>
          {porSeg.length === 0 ? <p className="text-sm text-slate-500">Vincule as receitas a leads com segmento para ver a divisão.</p> : porSeg.map(([k, v]) => (
            <div key={k} className="space-y-1"><div className="flex justify-between text-sm"><span>{SEGMENTOS[k]?.nome ?? 'Sem segmento'}</span><b>{brl(v)}</b></div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-gradient-to-r from-indigo-600 to-violet-500" style={{ width: `${(v / porSeg[0][1]) * 100}%` }} /></div></div>))}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <div className="flex items-center justify-between p-4 pb-0"><h2 className="font-semibold">Lançamentos do mês</h2>
          <button className="btn !py-1.5 text-xs" onClick={lancarRecorrentes}><Repeat size={13} />Lançar recorrentes</button></div>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-500"><tr><th className="p-3">Data</th><th>Descrição</th><th>Categoria</th><th>Tipo</th><th className="text-right">Valor</th><th /></tr></thead>
          <tbody>
            {loading ? <tr><td className="p-4 text-slate-500" colSpan={6}>Carregando…</td></tr>
              : doMes.length === 0 ? <tr><td className="p-4 text-slate-500" colSpan={6}>Nenhum lançamento neste mês.</td></tr>
              : doMes.map(i => { const lead = leads.find(l => l.id === i.lead_id), pend = i.situacao === 'pendente'; return (
                <tr key={i.id} className="border-t">
                  <td className="whitespace-nowrap p-3">{new Date(i.data + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                  <td>{i.descricao}{lead && <Link href={`/leads/${lead.id}`} className="ml-2 text-xs text-indigo-600 hover:underline">{lead.nome_loja}</Link>}{i.recorrente && <Repeat size={12} className="ml-1 inline text-slate-400" aria-label="recorrente" />}</td>
                  <td className="text-slate-500">{i.categoria || '—'}</td>
                  <td><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${i.tipo === 'receita' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{i.tipo}</span>{pend && <span className="lh-chip ml-1 bg-amber-100 text-amber-700">{i.tipo === 'receita' ? 'a receber' : 'a pagar'}</span>}</td>
                  <td className={`text-right font-medium ${i.tipo === 'receita' ? 'text-emerald-700' : 'text-rose-700'}`}>{i.tipo === 'despesa' ? '− ' : ''}{brl(i.valor)}</td>
                  <td className="space-x-3 whitespace-nowrap pr-3 text-right">
                    {pend && <button className="text-emerald-600 hover:underline" onClick={() => quitar(i)}>{i.tipo === 'receita' ? 'Recebi' : 'Paguei'}</button>}
                    <button className="text-slate-500 hover:text-indigo-600" onClick={() => editar(i)}>Editar</button>
                    <button className="text-slate-400 hover:text-rose-600" onClick={() => setApagar(i)}>Excluir</button></td></tr>) })}
          </tbody>
        </table>
      </div>
      {apagar && <ConfirmDialog titulo="Excluir lançamento?" texto={`"${apagar.descricao}" será removido e essa ação não pode ser desfeita.`} onCancel={() => setApagar(null)} onConfirm={async () => { await excluir(apagar); setApagar(null) }} />}
      {aviso}
    </div>
  )
}
