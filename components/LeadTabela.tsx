'use client'
import Link from 'next/link'
import { ExternalLink, MessageCircle, Pencil, Trash2 } from 'lucide-react'
import { ChipRetorno } from './LeadCard'
import { STATUS, STATUS_COR, type Lead } from '@/lib/types'
import { temMensagem, whatsappLink, whatsappNumber } from '@/lib/message-template'
import { mensagemDoLead } from '@/lib/templates'

// Visão compacta dos leads: uma linha por lead, ideal para listas grandes.
export default function LeadTabela({ itens, temRef, seuNome, selecionando, sel, onSelect, onEdit, onDelete, toast }: {
  itens: { l: Lead; dist: number | null }[]; temRef: boolean; seuNome: string
  selecionando: boolean; sel: Set<string>; onSelect: (id: string) => void
  onEdit: (l: Lead) => void; onDelete: (l: Lead) => void; toast: (m: string, tipo?: 'ok' | 'erro') => void
}) {
  function whats(l: Lead) {
    const num = whatsappNumber(l.whatsapp)
    if (!num) return toast('Este lead não tem WhatsApp válido', 'erro')
    window.open(whatsappLink(num, mensagemDoLead(l, seuNome)), '_blank', 'noopener')
  }
  const th = 'px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500'
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead><tr className="border-b border-slate-200">
          {selecionando && <th className={th} />}<th className={th}>Loja</th><th className={th}>Cidade</th><th className={th}>Status</th><th className={th}>Retorno</th><th className={th}>Telefone</th>{temRef && <th className={th}>Dist.</th>}<th className={th + ' text-right'}>Ações</th>
        </tr></thead>
        <tbody>
          {itens.map(({ l, dist }) => (
            <tr key={l.id} className={`border-b border-slate-200 last:border-0 hover:bg-slate-50 ${sel.has(l.id) ? 'bg-indigo-500/5' : ''}`}>
              {selecionando && <td className="px-4 py-2.5"><input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={sel.has(l.id)} onChange={() => onSelect(l.id)} aria-label={`Selecionar ${l.nome_loja}`} /></td>}
              <td className="max-w-[240px] px-4 py-2.5"><Link href={`/leads/${l.id}`} className="block truncate font-medium hover:underline">{l.nome_loja}</Link><p className="truncate text-xs text-slate-500">{l.responsavel || l.categoria || ''}</p></td>
              <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">{[l.cidade, l.estado].filter(Boolean).join('/') || '—'}</td>
              <td className="px-4 py-2.5"><span className={`lh-chip whitespace-nowrap ${STATUS_COR[l.status]}`}>{STATUS[l.status]}</span></td>
              <td className="px-4 py-2.5"><ChipRetorno lead={l} /></td>
              <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">{l.whatsapp || <span className="text-slate-400">—</span>}</td>
              {temRef && <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">{dist == null ? '—' : dist.toFixed(1) + ' km'}</td>}
              <td className="px-4 py-2.5"><div className="flex items-center justify-end gap-1">
                {temMensagem(l.status) && <button className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-500/10" onClick={() => whats(l)} aria-label={`WhatsApp ${l.nome_loja}`} title="WhatsApp"><MessageCircle size={16} /></button>}
                <Link href={`/leads/${l.id}`} className="rounded-lg p-2 text-slate-500 hover:bg-slate-500/10" aria-label="Abrir ficha" title="Abrir ficha"><ExternalLink size={16} /></Link>
                <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-500/10" onClick={() => onEdit(l)} aria-label="Editar" title="Editar"><Pencil size={16} /></button>
                <button className="rounded-lg p-2 text-rose-500 hover:bg-rose-500/10" onClick={() => onDelete(l)} aria-label="Excluir" title="Excluir"><Trash2 size={16} /></button>
              </div></td>
            </tr>))}
        </tbody>
      </table>
    </div>
  )
}
