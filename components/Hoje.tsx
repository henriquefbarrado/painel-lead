'use client'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarCheck, ExternalLink, MessageCircle, Phone } from 'lucide-react'
import PageHeader from './PageHeader'
import { ChipRetorno, dataBr } from './LeadCard'
import { useToast } from './Toast'
import { supabase } from '@/lib/supabase/client'
import { todosLeads } from '@/lib/leads-api'
import { expirarContatosSemResposta } from '@/lib/leads-acoes'
import { ativo, dataHoje, situacaoFollowUp } from '@/lib/metricas'
import { STATUS, STATUS_COR, naoAbordado, type Lead } from '@/lib/types'
import { temMensagem, whatsappLink, whatsappNumber } from '@/lib/message-template'
import { mensagemDoLead } from '@/lib/templates'
import { useUsuario } from '@/lib/useUsuario'

const maisDias = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return dataHoje(d) }

export default function Hoje() {
  const [leads, setLeads] = useState<Lead[]>([]), [loading, setLoading] = useState(true)
  const { toast, aviso } = useToast(), usuario = useUsuario()
  const carregar = useCallback(async () => {
    const exp = await expirarContatosSemResposta()
    if (exp.movidos > 0) toast(`${exp.movidos} lead${exp.movidos > 1 ? 's' : ''} sem resposta há +48h → Sem interesse`, 'ok')
    const r = await todosLeads()
    if (r.error) toast('Erro ao carregar leads: ' + r.error, 'erro')
    setLeads(r.data); setLoading(false)
  }, [toast])
  useEffect(() => { carregar() }, [carregar])

  const hoje = dataHoje()
  const { atrasados, deHoje, semData } = useMemo(() => {
    const vivos = leads.filter(l => ativo(l.status))
    const por = (s: string) => vivos.filter(l => situacaoFollowUp(l.proximo_contato, hoje) === s).sort((a, b) => (a.proximo_contato || '').localeCompare(b.proximo_contato || ''))
    return { atrasados: por('atrasado'), deHoje: por('hoje'), semData: vivos.filter(l => !naoAbordado(l.status) && !l.proximo_contato) }
  }, [leads, hoje])

  async function reagendar(l: Lead, data: string) {
    const { error } = await supabase().from('leads').update({ proximo_contato: data }).eq('id', l.id)
    if (error) return toast('Erro ao reagendar: ' + error.message, 'erro')
    toast(`${l.nome_loja}: retorno em ${dataBr(data)}`, 'ok'); carregar()
  }
  function whats(l: Lead) {
    const num = whatsappNumber(l.whatsapp)
    if (!num) return toast('Este lead não tem WhatsApp válido', 'erro')
    window.open(whatsappLink(num, mensagemDoLead(l, usuario.nome)), '_blank', 'noopener')
  }
  const linha = (l: Lead) => (
    <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0 space-y-1">
        <p className="flex flex-wrap items-center gap-2"><Link href={`/leads/${l.id}`} className="font-semibold hover:underline">{l.nome_loja}</Link><span className={`lh-chip ${STATUS_COR[l.status]}`}>{STATUS[l.status]}</span><ChipRetorno lead={l} /></p>
        <p className="flex flex-wrap items-center gap-x-3 text-sm text-slate-500">{l.whatsapp && <span className="inline-flex items-center gap-1"><Phone size={12} />{l.whatsapp}</span>}{l.proxima_acao && <span>Ação: {l.proxima_acao}</span>}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {temMensagem(l.status) && <button className="btn-wa !px-3 !py-1.5" onClick={() => whats(l)}><MessageCircle size={14} />Chamar</button>}
        <select className="inp !w-auto !py-1.5 text-sm" value="" onChange={e => e.target.value && reagendar(l, maisDias(Number(e.target.value)))} aria-label={`Reagendar ${l.nome_loja}`}>
          <option value="">Reagendar…</option><option value="1">Amanhã</option><option value="3">Em 3 dias</option><option value="7">Em 1 semana</option></select>
        <Link href={`/leads/${l.id}`} className="btn !px-3 !py-1.5" aria-label="Abrir ficha"><ExternalLink size={14} /></Link>
      </div>
    </li>)
  const bloco = (titulo: string, itens: Lead[], vazio: string, cor = '') => (
    <section className="card p-5"><h2 className={`mb-1 font-semibold ${cor}`}>{titulo} ({itens.length})</h2>
      {itens.length === 0 ? <p className="py-3 text-sm text-slate-500">{vazio}</p> : <ul className="divide-y divide-slate-200">{itens.map(linha)}</ul>}</section>)

  return (
    <div className="space-y-6">
      <PageHeader titulo="Hoje" sub="Quem você precisa chamar agora. O dinheiro está no follow-up." icone={<CalendarCheck size={24} />} />
      {loading ? <div className="space-y-4" aria-busy="true"><div className="skeleton h-40" /><div className="skeleton h-40" /></div> : <>
        {bloco('Atrasados', atrasados, 'Nada atrasado. 👏', 'text-rose-600')}
        {bloco('Para hoje', deHoje, 'Nenhum retorno marcado para hoje. Agende em “Abrir ficha” ou no card do lead.')}
        {semData.length > 0 && bloco('Em andamento sem data de retorno', semData.slice(0, 30), '')}
      </>}
      {aviso}
    </div>
  )
}
