'use client'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Kanban, MessageCircle, Phone } from 'lucide-react'
import PageHeader from './PageHeader'
import MotivoPerdaDialog from './MotivoPerdaDialog'
import { ChipRetorno } from './LeadCard'
import { useToast } from './Toast'
import { todosLeads } from '@/lib/leads-api'
import { atualizarStatus } from '@/lib/leads-acoes'
import { SEGMENTOS } from '@/lib/segmentos'
import { FUNIL, STATUS, STATUS_COR, type Lead, type Status } from '@/lib/types'
import { temMensagem, whatsappLink, whatsappNumber } from '@/lib/message-template'
import { mensagemDoLead } from '@/lib/templates'
import { useTemplates } from '@/lib/useTemplates'
import { useUsuario } from '@/lib/useUsuario'

const POR_COLUNA = 30
const BORDA: Record<Status, string> = { novo: 'border-sky-400', contato_realizado: 'border-violet-400', interessado: 'border-amber-400', negociacao: 'border-orange-400', convertido: 'border-emerald-400', sem_interesse: 'border-slate-400' }

export default function Pipeline() {
  const [leads, setLeads] = useState<Lead[]>([]), [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState(''), [fSeg, setFSeg] = useState('')
  const [arrastando, setArrastando] = useState<string | null>(null), [sobre, setSobre] = useState<Status | null>(null)
  const [perdendo, setPerdendo] = useState<Lead | null>(null), [mais, setMais] = useState<Set<Status>>(new Set())
  const { toast, aviso } = useToast(), usuario = useUsuario(), { templates } = useTemplates()

  const carregar = useCallback(async () => {
    const r = await todosLeads()
    if (r.error) toast('Erro ao carregar leads: ' + r.error, 'erro')
    setLeads(r.data); setLoading(false)
  }, [toast])
  useEffect(() => { carregar() }, [carregar])

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase().trim()
    return leads.filter(l => (!fSeg || l.segmento === fSeg) && (!q || l.nome_loja.toLowerCase().includes(q) || (l.cidade || '').toLowerCase().includes(q)))
  }, [leads, busca, fSeg])

  async function mover(l: Lead, para: Status, motivo?: string) {
    if (l.status === para) return
    const antes = leads
    setLeads(ls => ls.map(x => x.id === l.id ? { ...x, status: para, motivo_perda: para === 'sem_interesse' ? motivo ?? null : null } : x)) // otimista
    const erro = await atualizarStatus([l.id], para, motivo)
    if (erro) { setLeads(antes); return toast('Erro ao mover: ' + erro, 'erro') }
    toast(para === 'convertido' ? `${l.nome_loja} fechou! Registre a receita no Financeiro.` : `${l.nome_loja} → ${STATUS[para]}`, 'ok')
  }
  function pedirMover(l: Lead, para: Status) { if (para === 'sem_interesse' && l.status !== para) setPerdendo(l); else mover(l, para) }
  function whats(l: Lead) {
    const num = whatsappNumber(l.whatsapp)
    if (!num) return toast('Este lead não tem WhatsApp válido', 'erro')
    window.open(whatsappLink(num, mensagemDoLead(l, usuario?.nome ?? '', templates)), '_blank', 'noopener')
  }

  return (
    <div className="space-y-6">
      <PageHeader titulo="Pipeline" sub="Arraste os cards entre as etapas (no celular, use “Mover para”)." icone={<Kanban size={24} />} />
      <div className="card grid gap-3 p-4 sm:grid-cols-2">
        <input className="inp" placeholder="Buscar por loja ou cidade" value={busca} onChange={e => setBusca(e.target.value)} aria-label="Buscar" />
        <select className="inp" value={fSeg} onChange={e => setFSeg(e.target.value)} aria-label="Segmento"><option value="">Todos os segmentos</option>{Object.entries(SEGMENTOS).map(([k, v]) => <option key={k} value={k}>{v.nome}</option>)}</select>
      </div>
      {loading ? <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">{FUNIL.map(s => <div key={s} className="skeleton h-64" />)}</div> : (
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0">
          {FUNIL.map(st => {
            const itens = filtrados.filter(l => l.status === st), vis = mais.has(st) ? itens : itens.slice(0, POR_COLUNA)
            return (
              <section key={st} aria-label={STATUS[st]}
                onDragOver={e => { e.preventDefault(); setSobre(st) }} onDragLeave={() => setSobre(s => (s === st ? null : s))}
                onDrop={e => { e.preventDefault(); setSobre(null); const l = leads.find(x => x.id === arrastando); setArrastando(null); if (l) pedirMover(l, st) }}
                className={`card flex w-72 shrink-0 flex-col gap-3 border-t-4 p-3 ${BORDA[st]} ${sobre === st ? 'ring-2 ring-indigo-500' : ''}`}>
                <header className="flex items-center justify-between"><span className={`lh-chip ${STATUS_COR[st]}`}>{STATUS[st]}</span><span className="text-sm font-semibold text-slate-500">{itens.length}</span></header>
                <div className="flex max-h-[65vh] flex-col gap-2 overflow-y-auto">
                  {vis.map(l => (
                    <article key={l.id} draggable onDragStart={() => setArrastando(l.id)} onDragEnd={() => { setArrastando(null); setSobre(null) }}
                      className={`cursor-grab space-y-2 rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm active:cursor-grabbing ${arrastando === l.id ? 'opacity-40' : ''}`}>
                      <Link href={`/leads/${l.id}`} className="block truncate font-semibold hover:underline">{l.nome_loja}</Link>
                      {l.whatsapp && <p className="flex items-center gap-1.5 text-xs text-slate-500"><Phone size={12} />{l.whatsapp}</p>}
                      <ChipRetorno lead={l} />
                      <div className="flex items-center gap-2">
                        {temMensagem(l.status) && <button className="btn-wa !px-2.5 !py-1.5 text-xs" onClick={() => whats(l)} aria-label={`WhatsApp ${l.nome_loja}`}><MessageCircle size={13} />Chamar</button>}
                        <select className="inp !w-full !py-1.5 text-xs" value="" onChange={e => e.target.value && pedirMover(l, e.target.value as Status)} aria-label={`Mover ${l.nome_loja}`}>
                          <option value="">Mover para…</option>{FUNIL.filter(s => s !== l.status).map(s => <option key={s} value={s}>{STATUS[s]}</option>)}</select>
                      </div>
                    </article>))}
                  {itens.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">Solte um lead aqui</p>}
                  {itens.length > vis.length && <button className="btn !py-1.5 text-xs" onClick={() => setMais(m => new Set(m).add(st))}>Mostrar mais {itens.length - vis.length}</button>}
                </div>
              </section>) })}
        </div>)}
      {perdendo && <MotivoPerdaDialog nome={perdendo.nome_loja} onCancel={() => setPerdendo(null)} onConfirm={async m => { await mover(perdendo, 'sem_interesse', m); setPerdendo(null) }} />}
      {aviso}
    </div>
  )
}
