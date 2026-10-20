'use client'
import { useCallback, useRef, useState } from 'react'
import { PartyPopper } from 'lucide-react'
import { useToast } from './Toast'
import { CATEGORIAS_RECEITA } from '@/lib/metricas'
import { categoriaDaVenda, registrarVenda, semReceita } from '@/lib/vendas'
import type { Lead } from '@/lib/types'

// Ao marcar um lead como Convertido: pergunta o valor e lança a receita no Financeiro, ligada ao lead.
export function useVenda() {
  const [fila, setFila] = useState<Lead[]>([]), depois = useRef<(() => void) | undefined>()
  const pedirVenda = useCallback(async (leads: Lead[], aoTerminar?: () => void) => {
    const livres = new Set(await semReceita(leads.map(l => l.id)))
    const q = leads.filter(l => livres.has(l.id))
    if (!q.length) return
    depois.current = aoTerminar; setFila(q)
  }, [])
  const vendaDialog = fila.length ? (
    <VendaDialog key={fila[0].id} lead={fila[0]} resto={fila.length - 1}
      onFechar={() => { if (fila.length === 1) { depois.current?.(); depois.current = undefined } setFila(f => f.slice(1)) }} />
  ) : null
  return { pedirVenda, vendaDialog }
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
