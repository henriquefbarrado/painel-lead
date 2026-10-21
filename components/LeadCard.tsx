'use client'
import { useState } from 'react'
import Link from 'next/link'
import { CalendarClock, Copy, ExternalLink, MapPin, MessageCircle, Phone, Ruler, StickyNote } from 'lucide-react'
import { SEGMENTOS, SOLUCOES } from '@/lib/segmentos'
import { STATUS, STATUS_COR, type Lead } from '@/lib/types'
import { temMensagem, whatsappLink, whatsappNumber } from '@/lib/message-template'
import { mensagemDoLead } from '@/lib/templates'
import { situacaoFollowUp } from '@/lib/metricas'

export const dataBr = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')
export function ChipRetorno({ lead }: { lead: Pick<Lead, 'proximo_contato' | 'status'> }) {
  const s = lead.status === 'convertido' || lead.status === 'sem_interesse' ? null : situacaoFollowUp(lead.proximo_contato)
  if (!s || !lead.proximo_contato) return null
  const cor = s === 'atrasado' ? 'bg-rose-100 text-rose-700' : s === 'hoje' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
  return <span className={`lh-chip gap-1 ${cor}`}><CalendarClock size={12} />{s === 'atrasado' ? 'Retorno atrasado' : s === 'hoje' ? 'Retornar hoje' : 'Retorno ' + dataBr(lead.proximo_contato)}</span>
}

export default function LeadCard({ lead, dist, temRef, seuNome, selecionando, selecionado, onSelect, onEdit, onDelete, toast }: {
  lead: Lead; dist: number | null; temRef: boolean; seuNome: string
  selecionando?: boolean; selecionado?: boolean; onSelect?: () => void
  onEdit: () => void; onDelete: () => void; toast: (m: string) => void }) {
  const [msg, setMsg] = useState(() => mensagemDoLead(lead, seuNome))
  const [aberto, setAberto] = useState(false), [verMsg, setVerMsg] = useState(false)
  const tem = temMensagem(lead.status)
  const nota = lead.status === 'convertido'
    ? 'Cliente fechado. Nenhuma mensagem de venda necessária.'
    : lead.status === 'sem_interesse'
      ? 'Lead marcado como sem interesse. Não enviar novas mensagens.'
      : 'Esta etapa é uma etiqueta do funil. A mensagem padrão fica disponível no primeiro contato.'
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
    <div className={`card card-hover space-y-3.5 p-4 ${selecionado ? 'ring-2 ring-indigo-500' : ''}`}>
      <div className="flex items-start gap-3">
        {selecionando
          ? <input type="checkbox" className="mt-3 h-5 w-5 shrink-0 accent-indigo-600" checked={!!selecionado} onChange={onSelect} aria-label={`Selecionar ${lead.nome_loja}`} />
          : <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-500/10 text-base font-semibold text-indigo-600">{lead.nome_loja[0]?.toUpperCase()}</div>}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold"><Link href={`/leads/${lead.id}`} className="hover:underline">{lead.nome_loja}</Link></h3>
          <p className="truncate text-sm text-slate-500">{lead.responsavel || lead.categoria || '—'}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COR[lead.status]}`}>{STATUS[lead.status]}</span>
      </div>
      <div className="space-y-1.5">
        <p className={linha}><Phone size={15} className="mt-0.5 shrink-0 text-slate-400" />{lead.whatsapp || <i className="text-slate-400">sem telefone</i>}</p>
        <p className={linha}><MapPin size={15} className="mt-0.5 shrink-0 text-slate-400" />{[lead.endereco, [lead.cidade, lead.estado].filter(Boolean).join('/')].filter(Boolean).join(' — ') || '—'}</p>
        {temRef && <p className={linha}><Ruler size={15} className="mt-0.5 shrink-0 text-slate-400" />{semLoc ? <i className="text-amber-600">Localização precisa ser preenchida</i> : <b className="text-indigo-600">{dist!.toFixed(1)} km</b>}</p>}
        {lead.observacoes && <p className={linha}><StickyNote size={15} className="mt-0.5 shrink-0 text-slate-400" />{lead.observacoes}</p>}
        {lead.status === 'sem_interesse' && lead.motivo_perda && <p className="text-xs text-slate-500">Motivo: {lead.motivo_perda}</p>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <ChipRetorno lead={lead} />
        {lead.segmento && SEGMENTOS[lead.segmento] && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{SEGMENTOS[lead.segmento].nome}</span>}
        {(lead.solucoes || []).map(s => <span key={s} className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700">{SOLUCOES[s] ?? s}</span>)}
      </div>
      {tem ? (verMsg && <textarea className="inp !bg-slate-50 text-slate-600" rows={4} value={msg} onChange={e => setMsg(e.target.value)} aria-label="Mensagem" />) : <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">{nota}</p>}
      <div className="flex flex-wrap gap-2">
        {tem && <>
          <button className="btn-wa" onClick={enviar}><MessageCircle size={15} />WhatsApp</button>
          <button className="btn" onClick={copiar}><Copy size={15} />Copiar</button>
          <button className="btn" onClick={() => setVerMsg(!verMsg)} aria-expanded={verMsg}>{verMsg ? 'Ocultar mensagem' : 'Ver mensagem'}</button>
        </>}
        <Link href={`/leads/${lead.id}`} className="btn"><ExternalLink size={15} />Ficha</Link>
        <button className="btn" onClick={() => setAberto(!aberto)}>{aberto ? 'Ocultar' : 'Mais'}</button>
      </div>
      {aberto && (
        <div className="space-y-1 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
          <p>Categoria: {lead.categoria || '—'}</p>
          <p>CEP: {lead.cep || '—'}</p>
          <p>Coordenadas: {semLoc ? '—' : `${lead.latitude}, ${lead.longitude}`}</p>
          <p>Próxima ação: {lead.proxima_acao || '—'}</p>
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
