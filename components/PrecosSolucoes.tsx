'use client'
import { useEffect, useState } from 'react'
import { Tag } from 'lucide-react'
import { useToast } from './Toast'
import { SOLUCOES } from '@/lib/segmentos'
import { carregarPrecos, salvarPrecos } from '@/lib/vendas'

// Quanto você cobra por cada solução. Com isso, marcar um lead como Convertido lança a receita sozinho.
export default function PrecosSolucoes() {
  const { toast, aviso } = useToast()
  const [v, setV] = useState<Record<string, string>>({}), [busy, setBusy] = useState(false)
  useEffect(() => { carregarPrecos().then(p => setV(Object.fromEntries(Object.entries(p).map(([k, n]) => [k, String(n).replace('.', ',')])))) }, [])
  async function salvar() {
    const p: Record<string, number> = {}
    for (const [k, t] of Object.entries(v)) { const n = parseFloat(t.replace(/\./g, '').replace(',', '.')); if (n > 0) p[k] = n }
    setBusy(true); const erro = await salvarPrecos(p); setBusy(false)
    toast(erro ? 'Erro ao salvar: ' + erro : 'Preços salvos', erro ? 'erro' : 'ok')
  }
  return (
    <details className="card p-4">
      <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold"><Tag size={16} />Preços das soluções <span className="font-normal text-slate-500">· lançam a venda sozinhas ao marcar Convertido</span></summary>
      <div className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(SOLUCOES).map(([id, nome]) => (
            <label key={id} className="block text-sm">{nome}
              <div className="relative mt-1"><span className="absolute left-3 top-2.5 text-sm text-slate-400">R$</span>
                <input className="inp !pl-9" inputMode="decimal" placeholder="0,00" value={v[id] ?? ''} onChange={e => setV(p => ({ ...p, [id]: e.target.value }))} /></div>
            </label>))}
        </div>
        <p className="text-xs text-slate-500">O valor da venda é a soma das soluções marcadas no lead. Deixe em branco as que você não precifica: se o lead só tiver soluções sem preço, o painel pergunta o valor na hora. Vale para os dois usuários.</p>
        <button className="btn-p" disabled={busy} onClick={salvar}>{busy ? 'Salvando…' : 'Salvar preços'}</button>
      </div>
      {aviso}
    </details>
  )
}
