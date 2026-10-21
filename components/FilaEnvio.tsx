'use client'
import { useEffect, useState } from 'react'
import { MapPin, MessageCircle, Phone, SkipForward, X } from 'lucide-react'
import { STATUS, STATUS_COR, type Lead } from '@/lib/types'
import { whatsappLink, whatsappNumber } from '@/lib/message-template'
import { mensagemDoLead } from '@/lib/templates'

// Fila de envio: um lead por vez, com a mensagem pronta. O envio continua sendo manual no WhatsApp.
export default function FilaEnvio({ leads, seuNome, onSent, onClose }: {
  leads: Lead[]; seuNome: string; onSent: (l: Lead) => Promise<void> | void; onClose: () => void }) {
  const [i, setI] = useState(0), [enviados, setEnviados] = useState(0), [aberto, setAberto] = useState(false), [busy, setBusy] = useState(false)
  const l = leads[i]
  const [msg, setMsg] = useState(l ? mensagemDoLead(l, seuNome) : '')
  useEffect(() => { if (l) { setMsg(mensagemDoLead(l, seuNome)); setAberto(false) } }, [i]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose])

  function abrir() {
    const num = whatsappNumber(l.whatsapp)
    if (num) { window.open(whatsappLink(num, msg), '_blank', 'noopener'); setAberto(true) }
  }
  async function enviei() { setBusy(true); await onSent(l); setEnviados(n => n + 1); setBusy(false); setI(i + 1) }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="dialog-pop card w-full max-w-lg space-y-4 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Modo envio {l ? `· ${i + 1} de ${leads.length}` : ''}</p>
          <button className="rounded-lg p-1 text-slate-400 hover:text-slate-600" onClick={onClose} title="Fechar"><X size={18} /></button>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-indigo-500 transition-all" style={{ width: `${(Math.min(i, leads.length) / leads.length) * 100}%` }} /></div>
        {!l ? (
          <div className="space-y-3 py-6 text-center">
            <p className="text-lg font-bold">Fila concluída 🎉</p>
            <p className="text-sm text-slate-500">{enviados} {enviados === 1 ? 'lead marcado' : 'leads marcados'} como enviado.</p>
            <button className="btn-p" onClick={onClose}>Fechar</button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><h3 className="truncate text-lg font-semibold">{l.nome_loja}</h3>
                <p className="flex items-center gap-1.5 text-sm text-slate-500"><Phone size={14} />{l.whatsapp}</p>
                {l.endereco && <p className="flex items-center gap-1.5 truncate text-sm text-slate-500"><MapPin size={14} />{l.endereco}</p>}</div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COR[l.status]}`}>{STATUS[l.status]}</span>
            </div>
            <textarea className="inp !bg-slate-50 text-slate-600" rows={5} value={msg} onChange={e => setMsg(e.target.value)} />
            <div className="grid grid-cols-3 gap-2">
              <button className="btn-wa" onClick={abrir}><MessageCircle size={15} />Abrir WhatsApp</button>
              <button className="btn" onClick={() => setI(i + 1)} disabled={busy}><SkipForward size={15} />Pular</button>
              <button className={aberto ? 'btn-p' : 'btn'} onClick={enviei} disabled={busy}>{busy ? 'Salvando…' : 'Enviei, próximo'}</button>
            </div>
            <p className="text-xs text-slate-500">Abra o WhatsApp, envie a mensagem lá e volte para tocar em <b>Enviei, próximo</b>. Leads <b>Novos</b> passam para <b>Contato realizado</b> automaticamente.</p>
          </>
        )}
      </div>
    </div>
  )
}
