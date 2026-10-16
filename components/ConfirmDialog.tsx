'use client'
import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'

export default function ConfirmDialog({ titulo, texto, confirmar = 'Excluir', onConfirm, onCancel }: {
  titulo: string; texto: string; confirmar?: string; onConfirm: () => Promise<void> | void; onCancel: () => void }) {
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onCancel])
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div className="dialog-pop card w-full max-w-sm space-y-4 p-6 text-center" onClick={e => e.stopPropagation()}>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-100 text-rose-600"><Trash2 size={26} /></div>
        <div><h2 className="text-lg font-bold text-slate-900">{titulo}</h2><p className="mt-1 text-sm text-slate-500">{texto}</p></div>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn !py-2.5" onClick={onCancel} disabled={busy}>Cancelar</button>
          <button className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500 disabled:opacity-60"
            disabled={busy} onClick={async () => { setBusy(true); await onConfirm(); setBusy(false) }}>{busy ? 'Excluindo…' : confirmar}</button>
        </div>
      </div>
    </div>
  )
}
