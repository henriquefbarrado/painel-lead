'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { PartyPopper } from 'lucide-react'
import { useToast } from './Toast'
import { supabase } from '@/lib/supabase/client'
import { CATEGORIAS_RECEITA } from '@/lib/metricas'
import { totalDaVenda } from '@/lib/precos'
import { carregarPrecos, categoriaDaVenda, lancarVenda, registrarVenda, semReceita } from '@/lib/vendas'
import type { Lead } from '@/lib/types'

type Auto = { id: string; lead: Lead; valor: number }
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Ao marcar Convertido: se as soluções do lead têm preço cadastrado (Financeiro > Preços das soluções),
// a receita é lançada sozinha como "A receber". Sem preço, abre a janela pedindo o valor.
export function useVenda() {
  const [fila, setFila] = useState<Lead[]>([]), [auto, setAuto] = useState<Auto[]>([]), depois = useRef<(() => void) | undefined>()
  const pedirVenda = useCallback(async (leads: Lead[], aoTerminar?: () => void) => {
    const livres = new Set(await semReceita(leads.map(l => l.id)))
    const q = leads.filter(l => livres.has(l.id))
    if (!q.length) return
    const precos = await carregarPrecos(), feitas: Auto[] = [], manuais: Lead[] = []
    for (const l of q) {
      const v = totalDaVenda(l, precos)
      if (v <= 0) { manuais.push(l); continue }
      const r = await lancarVenda(l, v, 'pendente', categoriaDaVenda(l))
      if (r.id) feitas.push({ id: r.id, lead: l, valor: v }); else manuais.push(l)
    }
    if (feitas.length) setAuto(feitas)
    if (manuais.length) { depois.current = aoTerminar; setFila(manuais) } else aoTerminar?.()
  }, [])
  const vendaDialog = (auto.length > 0 || fila.length > 0) ? (
    <>
      {auto.length > 0 && <VendaAuto itens={auto} onFechar={() => setAuto([])} />}
      {fila.length > 0 && <VendaDialog key={fila[0].id} lead={fila[0]} resto={fila.length - 1}
        onFechar={() => { if (fila.length === 1) { depois.current?.(); depois.current = undefined } setFila(f => f.slice(1)) }} />}
    </>
  ) : null
  return { pedirVenda, vendaDialog }
}

// Aviso das receitas lançadas sozinhas, com Desfazer / Editar valor / Marcar recebido.
function VendaAuto({ itens, onFechar }: { itens: Auto[]; onFechar: () => void }) {
  const { toast, aviso } = useToast()
  const [editando, setEditando] = useState(false), [valor, setValor] = useState(''), [busy, setBusy] = useState(false)
  useEffect(() => { if (editando) return; const t = setTimeout(onFechar, 15000); return () => clearTimeout(t) }, [editando, onFechar])
  const ids = itens.map(i => i.id), total = itens.reduce((s, i) => s + i.valor, 0)

  async function desfazer() {
    setBusy(true); const { error } = await supabase().from('financeiro').delete().in('id', ids); setBusy(false)
    if (error) return toast('Erro ao desfazer: ' + error.message, 'erro'); onFechar()
  }
  async function recebido() {
    setBusy(true); const { error } = await supabase().from('financeiro').update({ situacao: 'pago' }).in('id', ids); setBusy(false)
    if (error) return toast('Erro: ' + error.message, 'erro'); onFechar()
  }
  async function salvarValor() {
    const v = parseFloat(valor.replace(/\./g, '').replace(',', '.'))
    if (isNaN(v) || v <= 0) return toast('Valor inválido', 'erro')
    setBusy(true); const { error } = await supabase().from('financeiro').update({ valor: v }).eq('id', ids[0]); setBusy(false)
    if (error) return toast('Erro: ' + error.message, 'erro'); onFechar()
  }
  return (
    <div className="dialog-pop card fixed bottom-4 left-1/2 z-40 w-[min(94vw,32rem)] -translate-x-1/2 space-y-3 p-4">
      <p className="text-sm">
        <b>{itens.length === 1 ? `Receita de ${brl(total)} lançada` : `${itens.length} receitas lançadas (${brl(total)})`}</b> como <b>A receber</b>
        <span className="text-slate-500"> · {itens.length === 1 ? itens[0].lead.nome_loja : 'no Financeiro'}</span>
      </p>
      {editando ? (
        <div className="flex gap-2">
          <input className="inp" autoFocus inputMode="decimal" placeholder="Novo valor (ex.: 1500,00)" value={valor} onChange={e => setValor(e.target.value)} />
          <button className="btn-p" disabled={busy} onClick={salvarValor}>Salvar</button>
          <button className="btn" onClick={() => setEditando(false)}>Cancelar</button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button className="btn-p" disabled={busy} onClick={recebido}>Marcar recebido</button>
          {itens.length === 1 && <button className="btn" disabled={busy} onClick={() => { setValor(String(itens[0].valor).replace('.', ',')); setEditando(true) }}>Editar valor</button>}
          <button className="btn" disabled={busy} onClick={desfazer}>Desfazer</button>
          <button className="btn" onClick={onFechar}>OK</button>
        </div>)}
      {aviso}
    </div>
  )
}

function VendaDialog({ lead, resto, onFechar }: { lead: Lead; resto: number; onFechar: () => void }) {
  const { toast, aviso } = useToast()
  const [valor, setValor] = useState(''), [situacao, setSituacao] = useState<'pago' | 'pendente'>('pago')
  const [categoria, setCategoria] = useState(categoriaDaVenda(lead)), [busy, setBusy] = useState(false)
  async function lancar(e: React.FormEvent) {
    e.preventDefault()
    const v = parseFloat(valor.replace(/\./g, '').replace(',', '.'))
    if (isNaN(v) || v <= 0) return toast('Informe o valor da venda', 'erro')
    setBusy(true); const erro = await registrarVenda(lead, v, situacao, categoria); setBusy(false)
    if (erro) return toast('Erro ao lançar: ' + erro, 'erro')
    toast('Receita lançada no Financeiro', 'ok'); setTimeout(onFechar, 400)
  }
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <form onSubmit={lancar} className="dialog-pop card w-full max-w-sm space-y-4 p-6">
        <div className="text-center">
          <div className="mx-auto mb-2 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-600"><PartyPopper size={26} /></div>
          <h2 className="text-lg font-bold text-slate-900">Venda fechada!</h2>
          <p className="mt-1 text-sm text-slate-500"><b>{lead.nome_loja}</b>{resto > 0 && <> · faltam mais {resto}</>}<br />Quanto foi a venda? Ela entra sozinha no Financeiro.</p>
        </div>
        <input className="inp" autoFocus inputMode="decimal" placeholder="Valor (ex.: 1500,00)" value={valor} onChange={e => setValor(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          {(['pago', 'pendente'] as const).map(s => (
            <button type="button" key={s} onClick={() => setSituacao(s)}
              className={`rounded-xl border px-3 py-2 text-sm font-medium ${situacao === s ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-300'}`}>{s === 'pago' ? 'Já recebi' : 'A receber'}</button>))}
        </div>
        <select className="inp" value={categoria} onChange={e => setCategoria(e.target.value)}>{CATEGORIAS_RECEITA.map(c => <option key={c}>{c}</option>)}</select>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn" onClick={onFechar} disabled={busy}>Agora não</button>
          <button className="btn-p" disabled={busy}>{busy ? 'Lançando…' : 'Lançar receita'}</button>
        </div>
        {aviso}
      </form>
    </div>
  )
}
