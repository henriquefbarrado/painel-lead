'use client'
import { useEffect, useState } from 'react'
import { MOTIVOS_PERDA } from '@/lib/types'

// Pergunta o motivo quando um lead vira "Sem interesse", para você aprender o que não funciona.
export default function MotivoPerdaDialog({ nome, onConfirm, onCancel }: { nome: string; onConfirm: (motivo: string) => Promise<void> | void; onCancel: () => void }) {
  const [motivo, setMotivo] = useState(MOTIVOS_PERDA[0]), [outro, setOutro] = useState(''), [busy, setBusy] = useState(false)
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onCancel])
  const final = motivo === 'Outro' ? (outro.trim() || 'Outro') : motivo
  return (
    <div className="fixed inset-0 z-[55] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div className="dialog-pop card w-full max-w-sm space-y-4 p-6" role="dialog" aria-label="Motivo da perda" onClick={e => e.stopPropagation()}>
        <div><h2 className="text-lg font-bold text-slate-900">Por que {nome} não avançou?</h2><p className="mt-1 text-sm text-slate-500">Isso ajuda a ver o que não está funcionando.</p></div>
        <select className="inp" value={motivo} onChange={e => setMotivo(e.target.value)} autoFocus>{MOTIVOS_PERDA.map(m => <option key={m}>{m}</option>)}</select>
        {motivo === 'Outro' && <input className="inp" placeholder="Qual foi o motivo?" value={outro} onChange={e => setOutro(e.target.value)} />}
        <div className="grid grid-cols-2 gap-2">
          <button className="btn !py-2.5" onClick={onCancel} disabled={busy}>Cancelar</button>
          <button className="btn-p !py-2.5" disabled={busy} onClick={async () => { setBusy(true); await onConfirm(final); setBusy(false) }}>{busy ? 'Salvando…' : 'Confirmar'}</button>
        </div>
      </div>
    </div>
  )
}
