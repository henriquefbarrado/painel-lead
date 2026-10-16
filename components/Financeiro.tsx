'use client'
import PageHeader from './PageHeader'
import ConfirmDialog from './ConfirmDialog'
import { PiggyBank, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

type Item = { id: string; tipo: 'receita' | 'despesa'; descricao: string; valor: number; data: string }
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const hoje = () => new Date().toISOString().slice(0, 10)

export default function Financeiro() {
  const [itens, setItens] = useState<Item[]>([]), [loading, setLoading] = useState(true), [aviso, setAviso] = useState('')
  const [apagar, setApagar] = useState<Item | null>(null)
  const [mes, setMes] = useState(hoje().slice(0, 7))
  const [f, setF] = useState({ tipo: 'receita', descricao: '', valor: '', data: hoje() })
  const toast = (m: string) => { setAviso(m); setTimeout(() => setAviso(''), 2500) }

  async function carregar() {
    const { data, error } = await supabase().from('financeiro').select('*').order('data', { ascending: false })
    if (error) toast('Erro: ' + error.message)
    setItens(((data || []) as Item[]).map(i => ({ ...i, valor: Number(i.valor) }))); setLoading(false)
  }
  useEffect(() => { carregar() }, [])

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    const valor = parseFloat(f.valor.replace(/\./g, '').replace(',', '.'))
    if (isNaN(valor) || valor < 0) return toast('Valor inválido')
    const { error } = await supabase().from('financeiro').insert({ tipo: f.tipo, descricao: f.descricao, valor, data: f.data })
    if (error) return toast('Erro: ' + error.message)
    setF({ ...f, descricao: '', valor: '' }); toast('Lançamento salvo'); carregar()
  }
  async function excluir(i: Item) {
    const { error } = await supabase().from('financeiro').delete().eq('id', i.id)
    if (error) return toast('Erro: ' + error.message)
    toast('Lançamento excluído'); carregar()
  }

  const soma = (l: Item[], t: Item['tipo']) => l.filter(i => i.tipo === t).reduce((s, i) => s + i.valor, 0)
  const doMes = useMemo(() => itens.filter(i => i.data.startsWith(mes)), [itens, mes])
  const rec = soma(doMes, 'receita'), desp = soma(doMes, 'despesa'), lucro = rec - desp
  const lucroTotal = soma(itens, 'receita') - soma(itens, 'despesa')
  const meses = useMemo(() => Array.from({ length: 6 }, (_, k) => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - k))
    const key = d.toISOString().slice(0, 7), l = itens.filter(i => i.data.startsWith(key))
    return { key, nome: d.toLocaleDateString('pt-BR', { month: 'short' }), v: soma(l, 'receita') - soma(l, 'despesa') }
  }), [itens])
  const max = Math.max(1, ...meses.map(m => Math.abs(m.v)))
  const kpis: [string, number, string][] = [['Receitas do mês', rec, 'bg-emerald-500'], ['Despesas do mês', desp, 'bg-rose-500'],
    ['Lucro do mês', lucro, lucro >= 0 ? 'bg-indigo-500' : 'bg-rose-500'], ['Lucro total', lucroTotal, 'bg-amber-500']]

  return (
    <div className="space-y-6">
      <PageHeader titulo="Financeiro" sub="Receitas, despesas e lucro." icone={<Wallet size={24} />}>
        <input type="month" className="rounded-xl bg-white/95 px-3 py-2 text-sm font-medium text-[#1e293b] focus:outline-none" value={mes} onChange={e => setMes(e.target.value)} />
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map(([n, v], i) => { const I = [TrendingUp, TrendingDown, Wallet, PiggyBank][i], dest = i === 2; return (
          <div key={n} className={`card card-hover p-4 ${dest ? '!border-0 bg-gradient-to-br from-indigo-600 to-violet-600 text-white' : ''}`}>
            <div className={`mb-3 grid h-10 w-10 place-items-center rounded-xl ${['bg-emerald-100 text-emerald-600', 'bg-rose-100 text-rose-600', 'bg-white/20 text-white', 'bg-amber-100 text-amber-600'][i]}`}><I size={20} /></div>
            <p className={`text-sm ${dest ? 'text-indigo-100' : 'text-slate-500'}`}>{n}</p>
            <p className={`text-xl font-bold sm:text-2xl ${!dest && n.startsWith('Lucro') && v < 0 ? 'text-rose-600' : ''}`}>{brl(v)}</p></div>) })}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <form onSubmit={salvar} className="card space-y-3 p-4">
          <h2 className="font-semibold">Novo lançamento</h2>
          <div className="grid grid-cols-2 gap-2">
            {(['receita', 'despesa'] as const).map(t => (
              <button type="button" key={t} onClick={() => setF({ ...f, tipo: t })}
                className={`rounded-xl border px-3 py-2 text-sm font-medium ${f.tipo === t ? (t === 'receita' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-rose-500 bg-rose-50 text-rose-700') : 'border-slate-300'}`}>
                {t === 'receita' ? 'Receita' : 'Despesa'}</button>))}
          </div>
          <input className="inp" required placeholder="Descrição (ex.: site da Loja X)" value={f.descricao} onChange={e => setF({ ...f, descricao: e.target.value })} />
          <input className="inp" required inputMode="decimal" placeholder="Valor (ex.: 1500,00)" value={f.valor} onChange={e => setF({ ...f, valor: e.target.value })} />
          <input className="inp" type="date" required value={f.data} onChange={e => setF({ ...f, data: e.target.value })} />
          <button className="btn-p w-full">Salvar</button>
        </form>
        <div className="card p-4 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Lucro dos últimos 6 meses</h2>
          <div className="flex h-44 items-end gap-3">
            {meses.map(m => (
              <div key={m.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={brl(m.v)}>
                <span className="text-[11px] text-slate-500">{brl(m.v).replace(/\s/g, ' ')}</span>
                <div className={`w-full rounded-t-xl transition hover:opacity-80 ${m.v >= 0 ? 'bg-gradient-to-t from-indigo-600 to-violet-400' : 'bg-gradient-to-t from-rose-500 to-rose-300'}`} style={{ height: `${Math.max(4, (Math.abs(m.v) / max) * 100)}%`, maxHeight: '75%' }} />
                <span className="text-xs capitalize text-slate-500">{m.nome}</span></div>))}
          </div>
        </div>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-500"><tr><th className="p-3">Data</th><th>Descrição</th><th>Tipo</th><th className="text-right">Valor</th><th /></tr></thead>
          <tbody>
            {loading ? <tr><td className="p-4 text-slate-500" colSpan={5}>Carregando…</td></tr>
              : doMes.length === 0 ? <tr><td className="p-4 text-slate-500" colSpan={5}>Nenhum lançamento neste mês.</td></tr>
              : doMes.map(i => (
                <tr key={i.id} className="border-t">
                  <td className="p-3 whitespace-nowrap">{new Date(i.data + 'T12:00:00').toLocaleDateString('pt-BR')}</td><td>{i.descricao}</td>
                  <td><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${i.tipo === 'receita' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{i.tipo}</span></td>
                  <td className={`text-right font-medium ${i.tipo === 'receita' ? 'text-emerald-700' : 'text-rose-700'}`}>{i.tipo === 'despesa' ? '− ' : ''}{brl(i.valor)}</td>
                  <td className="pr-3 text-right"><button className="text-slate-400 hover:text-rose-600" onClick={() => setApagar(i)}>Excluir</button></td></tr>))}
          </tbody>
        </table>
      </div>
      {apagar && <ConfirmDialog titulo="Excluir lançamento?" texto={`"${apagar.descricao}" será removido e essa ação não pode ser desfeita.`}
        onCancel={() => setApagar(null)} onConfirm={async () => { await excluir(apagar); setApagar(null) }} />}
      {aviso && <div className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2 text-sm text-white">{aviso}</div>}
    </div>
  )
}
