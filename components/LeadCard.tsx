'use client'
import { useState } from 'react'
import { Copy, MapPin, MessageCircle, Phone, Ruler, StickyNote } from 'lucide-react'
import { STATUS, STATUS_COR, type Lead } from '@/lib/types'
import { buildMessage, whatsappLink, whatsappNumber } from '@/lib/message-template'

export default function LeadCard({ lead, dist, temRef, seuNome, onEdit, onDelete, toast }: {
  lead: Lead; dist: number | null; temRef: boolean; seuNome: string
  onEdit: () => void; onDelete: () => void; toast: (m: string) => void }) {
  const [msg, setMsg] = useState(() => buildMessage(lead.nome_loja, seuNome))
  const [aberto, setAberto] = useState(false)
  const semLoc = lead.latitude == null || lead.longitude == null

  async function copiar() {
    try { await navigator.clipboard.writeText(msg); toast('Mensagem copiada') } catch { toast('Não foi possível copiar') }
  }
  function enviar() {
    const num = whatsappNumber(lead.whatsapp)
    if (!num) return toast('Preencha um número de WhatsApp válido antes de abrir o WhatsApp')
    window.open(whatsappLink(num, msg), '_blank', 'noopener')
  }
  const linha = 'flex items-start gap-2 text-sm text-slate-600'
  return (
    <div className="card card-hover space-y-4 p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-bold text-white">{lead.nome_loja[0]?.toUpperCase()}</div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{lead.nome_loja}</h3>
          <p className="truncate text-sm text-slate-500">{lead.responsavel || lead.categoria || '—'}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COR[lead.status]}`}>{STATUS[lead.status]}</span>
      </div>
      <div className="space-y-1.5">
        <p className={linha}><Phone size={15} className="mt-0.5 shrink-0 text-slate-400" />{lead.whatsapp || <i className="text-slate-400">sem telefone</i>}</p>
        <p className={linha}><MapPin size={15} className="mt-0.5 shrink-0 text-slate-400" />{[lead.endereco, [lead.cidade, lead.estado].filter(Boolean).join('/')].filter(Boolean).join(' — ') || '—'}</p>
        {temRef && <p className={linha}><Ruler size={15} className="mt-0.5 shrink-0 text-slate-400" />{semLoc ? <i className="text-amber-600">Localização precisa ser preenchida</i> : <b className="text-indigo-600">{dist!.toFixed(1)} km</b>}</p>}
        {lead.observacoes && <p className={linha}><StickyNote size={15} className="mt-0.5 shrink-0 text-slate-400" />{lead.observacoes}</p>}
      </div>
      <textarea className="inp !bg-slate-50 text-slate-600" rows={4} value={msg} onChange={e => setMsg(e.target.value)} />
      <div className="flex flex-wrap gap-2">
        <button className="btn-wa" onClick={enviar}><MessageCircle size={15} />WhatsApp</button>
        <button className="btn" onClick={copiar}><Copy size={15} />Copiar mensagem</button>
        <button className="btn" onClick={() => setAberto(!aberto)}>{aberto ? 'Ocultar' : 'Ver detalhes'}</button>
      </div>
      {aberto && (
        <div className="space-y-1 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
          <p>Categoria: {lead.categoria || '—'}</p>
          <p>CEP: {lead.cep || '—'}</p>
          <p>Coordenadas: {semLoc ? '—' : `${lead.latitude}, ${lead.longitude}`}</p>
          <p>Cadastro: {new Date(lead.created_at).toLocaleDateString('pt-BR')}</p>
          <div className="flex gap-2 pt-2">
            <button className="btn" onClick={onEdit}>Editar</button>
            <button className="btn text-red-600" onClick={onDelete}>Excluir</button>
          </div>
        </div>
      )}
    </div>
  )
}
