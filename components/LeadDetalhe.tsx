'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CalendarClock, Copy, Mail, MapPin, MessageCircle, Phone, StickyNote, Trash2, Users, Wallet } from 'lucide-react'
import ConfirmDialog from './ConfirmDialog'
import LeadForm from './LeadForm'
import MotivoPerdaDialog from './MotivoPerdaDialog'
import { useVenda } from './VendaDialog'
import { ChipRetorno, dataBr } from './LeadCard'
import { useToast } from './Toast'
import { supabase } from '@/lib/supabase/client'
import { atualizarStatus } from '@/lib/leads-acoes'
import { TIPOS_CONTATO, type Contato, type TipoContato } from '@/lib/contatos'
import { SEGMENTOS, SOLUCOES } from '@/lib/segmentos'
import { FUNIL, STATUS, STATUS_COR, naoAbordado, type Lead, type LeadInput, type Status } from '@/lib/types'
import { temMensagem, whatsappLink, whatsappNumber } from '@/lib/message-template'
import { mensagemDoLead } from '@/lib/templates'
import { useTemplates } from '@/lib/useTemplates'
import { useUsuario } from '@/lib/useUsuario'
import { dataHoje } from '@/lib/metricas'

const ICONES: Record<TipoContato, typeof Phone> = { whatsapp: MessageCircle, ligacao: Phone, email: Mail, visita: MapPin, reuniao: Users, outro: StickyNote }
const agoraLocal = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16) }
const fmt = (iso: string) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
const maisDias = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return dataHoje(d) }
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function LeadDetalhe({ id }: { id: string }) {
  const router = useRouter(), usuario = useUsuario(), { templates } = useTemplates(), { toast, aviso } = useToast(), { pedirVenda, vendaDialog } = useVenda()
  const [lead, setLead] = useState<Lead | null>(null), [loading, setLoading] = useState(true), [meuId, setMeuId] = useState('')
  const [contatos, setContatos] = useState<Contato[]>([]), [receitas, setReceitas] = useState<{ id: string; descricao: string; valor: number; situacao?: string }[]>([])
  const [msg, setMsg] = useState(''), [proximo, setProximo] = useState(''), [acao, setAcao] = useState('')
  const [tipo, setTipo] = useState<TipoContato>('whatsapp'), [quando, setQuando] = useState(agoraLocal()), [nota, setNota] = useState(''), [salvando, setSalvando] = useState(false)
  const [editar, setEditar] = useState(false), [apagar, setApagar] = useState(false), [perdendo, setPerdendo] = useState(false), [apagarC, setApagarC] = useState<Contato | null>(null)

  const carregar = useCallback(async () => {
    const [l, c, f] = await Promise.all([
      supabase().from('leads').select('*').eq('id', id).maybeSingle(),
      supabase().from('contatos').select('*').eq('lead_id', id).order('contatado_em', { ascending: false }),
      supabase().from('financeiro').select('id,descricao,valor,situacao').eq('lead_id', id).eq('tipo', 'receita'),
    ])
    setLead((l.data as Lead) ?? null); setContatos((c.data as Contato[]) || [])
    setReceitas(((f.data || []) as { id: string; descricao: string; valor: number; situacao?: string }[]).map(r => ({ ...r, valor: Number(r.valor) })))
    if (l.data) { setProximo((l.data as Lead).proximo_contato ?? ''); setAcao((l.data as Lead).proxima_acao ?? '') }
    setLoading(false)
  }, [id])
  useEffect(() => { carregar() }, [carregar])
  useEffect(() => { supabase().auth.getUser().then(({ data }) => setMeuId(data.user?.id ?? '')) }, [])
  const msgInicial = useMemo(() => (lead && usuario ? mensagemDoLead(lead, usuario.nome, templates) : ''), [lead, usuario, templates])
  useEffect(() => { setMsg(msgInicial) }, [msgInicial])

  async function mudarStatus(s: Status, motivo?: string) {
    if (!lead) return
    const erro = await atualizarStatus([lead.id], s, motivo)
    if (erro) return toast('Erro ao atualizar status: ' + erro, 'erro')
    toast(s === 'convertido' ? 'Fechou! 🎉' : 'Status atualizado', 'ok'); carregar()
    if (s === 'convertido' && lead.status !== 'convertido') pedirVenda([lead], carregar)
  }
  async function salvarRetorno(data = proximo) {
    const { error } = await supabase().from('leads').update({ proximo_contato: data || null, proxima_acao: acao.trim() || null }).eq('id', id)
    if (error) return toast('Erro ao salvar: ' + error.message, 'erro')
    setProximo(data); toast('Follow-up salvo', 'ok'); carregar()
  }
  async function registrar(t: TipoContato, n: string, q: string, avancar = false) {
    if (!usuario || !lead) return
    setSalvando(true)
    const iso = new Date(q).toISOString()
    const { error } = await supabase().from('contatos').insert({ lead_id: id, user_nome: usuario.nome, user_email: usuario.email, tipo: t, nota: n.trim() || null, contatado_em: iso })
    if (error) { setSalvando(false); return toast('Erro ao registrar: ' + error.message, 'erro') }
    await supabase().from('leads').update({ ultimo_contato: iso }).eq('id', id) // ignora erro se a migração ainda não rodou
    if (avancar && naoAbordado(lead.status)) await atualizarStatus([id], 'contato_realizado')
    setSalvando(false); setNota(''); setQuando(agoraLocal()); toast('Contato registrado', 'ok'); carregar()
  }
  function abrirWhats() {
    const num = whatsappNumber(lead?.whatsapp ?? null)
    if (!num) return toast('Preencha um número de WhatsApp válido', 'erro')
    window.open(whatsappLink(num, msg), '_blank', 'noopener')
  }
  async function salvarLead(d: LeadInput) {
    const { error } = await supabase().from('leads').update(d).eq('id', id)
    if (error) return toast('Erro ao salvar: ' + error.message, 'erro')
    if (lead && d.status === 'convertido' && lead.status !== 'convertido') pedirVenda([lead], carregar)
    toast('Lead salvo', 'ok'); setEditar(false); carregar()
  }
  async function excluirContato(c: Contato) {
    const { error } = await supabase().from('contatos').delete().eq('id', c.id)
    if (error) return toast('Erro ao excluir: ' + error.message, 'erro'); toast('Registro excluído', 'ok'); carregar()
  }

  if (loading) return <div className="space-y-4" aria-busy="true"><div className="skeleton h-24" /><div className="skeleton h-64" /></div>
  if (!lead) return <div className="card p-10 text-center text-slate-500">Lead não encontrado. <Link href="/leads" className="text-indigo-600 underline">Voltar para os leads</Link></div>
  const l = lead, tem = temMensagem(l.status), linha = 'flex items-start gap-2 text-sm text-slate-600'
  const totalReceitas = receitas.reduce((s, r) => s + r.valor, 0)

  return (
    <div className="space-y-6">
      <Link href="/leads" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft size={15} />Leads</Link>
      <div className="card flex flex-wrap items-start justify-between gap-4 p-5">
        <div className="min-w-0 space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{l.nome_loja}</h1>
          <div className="flex flex-wrap items-center gap-2"><span className={`lh-chip ${STATUS_COR[l.status]}`}>{STATUS[l.status]}</span><ChipRetorno lead={l} />
            {l.segmento && SEGMENTOS[l.segmento] && <span className="lh-chip bg-slate-100 text-slate-600">{SEGMENTOS[l.segmento].nome}</span>}
            {(l.solucoes || []).map(s => <span key={s} className="lh-chip bg-indigo-100 text-indigo-700">{SOLUCOES[s] ?? s}</span>)}</div>
          <p className="text-xs text-slate-500">Cadastro em {new Date(l.created_at).toLocaleDateString('pt-BR')} · Último contato: {l.ultimo_contato ? fmt(l.ultimo_contato) : 'nenhum'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select className="inp !w-auto" value={l.status} onChange={e => { const s = e.target.value as Status; if (s === 'sem_interesse') setPerdendo(true); else mudarStatus(s) }} aria-label="Status">
            {FUNIL.map(k => <option key={k} value={k}>{STATUS[k]}</option>)}</select>
          <button className="btn" onClick={() => setEditar(true)}>Editar</button>
          <button className="btn text-red-600" onClick={() => setApagar(true)} aria-label="Excluir lead"><Trash2 size={15} /></button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <div className="card space-y-2 p-5">
            <h2 className="font-semibold">Dados</h2>
            <p className={linha}><Users size={15} className="mt-0.5 text-slate-400" />{l.responsavel || '—'}</p>
            <p className={linha}><Phone size={15} className="mt-0.5 text-slate-400" />{l.whatsapp || '—'}</p>
            <p className={linha}><MapPin size={15} className="mt-0.5 text-slate-400" />{[l.endereco, [l.cidade, l.estado].filter(Boolean).join('/'), l.cep].filter(Boolean).join(' — ') || '—'}</p>
            {l.observacoes && <p className={linha}><StickyNote size={15} className="mt-0.5 text-slate-400" />{l.observacoes}</p>}
            {l.status === 'sem_interesse' && <p className="text-sm text-slate-500">Motivo da perda: {l.motivo_perda || 'não informado'}</p>}
          </div>
          <div className="card space-y-3 p-5">
            <h2 className="flex items-center gap-2 font-semibold"><CalendarClock size={16} />Follow-up</h2>
            <label className="block text-sm">Próximo contato em<input type="date" className="inp mt-1" value={proximo} min={dataHoje()} onChange={e => setProximo(e.target.value)} /></label>
            <label className="block text-sm">Próxima ação<input className="inp mt-1" placeholder="Ex.: mandar exemplo de página" value={acao} onChange={e => setAcao(e.target.value)} /></label>
            <div className="flex flex-wrap gap-1.5">{[['Amanhã', 1], ['3 dias', 3], ['1 semana', 7]].map(([n, d]) => <button key={n} type="button" className="btn !px-2.5 !py-1.5 text-xs" onClick={() => salvarRetorno(maisDias(d as number))}>{n}</button>)}</div>
            <div className="flex gap-2"><button className="btn-p flex-1" onClick={() => salvarRetorno()}>Salvar</button>{l.proximo_contato && <button className="btn" onClick={() => { setAcao(''); setProximo(''); supabase().from('leads').update({ proximo_contato: null, proxima_acao: null }).eq('id', id).then(() => { toast('Follow-up removido', 'ok'); carregar() }) }}>Limpar</button>}</div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-2">
          {tem && (
            <div className="card space-y-3 p-5">
              <h2 className="font-semibold">Mensagem</h2>
              <textarea className="inp !bg-slate-50 text-slate-600" rows={5} value={msg} onChange={e => setMsg(e.target.value)} aria-label="Mensagem" />
              <div className="flex flex-wrap gap-2">
                <button className="btn-wa" onClick={abrirWhats}><MessageCircle size={15} />Abrir WhatsApp</button>
                <button className="btn" onClick={async () => { try { await navigator.clipboard.writeText(msg); toast('Mensagem copiada', 'ok') } catch { toast('Não foi possível copiar', 'erro') } }}><Copy size={15} />Copiar</button>
                <button className="btn" disabled={salvando} onClick={() => registrar('whatsapp', 'Mensagem enviada', agoraLocal(), true)}>Marcar como enviada</button>
              </div>
            </div>)}

          <div className="card space-y-3 p-5">
            <h2 className="flex items-center gap-2 font-semibold"><Wallet size={16} />Receitas deste lead</h2>
            {receitas.length === 0 ? <p className="text-sm text-slate-500">Nenhuma receita vinculada ainda.</p> :
              <ul className="divide-y divide-slate-200 text-sm">{receitas.map(r => <li key={r.id} className="flex justify-between py-2"><span>{r.descricao}{r.situacao === 'pendente' && <span className="lh-chip ml-2 bg-amber-100 text-amber-700">a receber</span>}</span><b>{brl(r.valor)}</b></li>)}
                <li className="flex justify-between py-2 font-semibold"><span>Total</span><span>{brl(totalReceitas)}</span></li></ul>}
            <Link href={`/financeiro?lead=${l.id}`} className="btn inline-flex">Registrar receita</Link>
          </div>

          <div className="card space-y-4 p-5">
            <h2 className="font-semibold">Histórico e notas ({contatos.length})</h2>
            <form onSubmit={e => { e.preventDefault(); registrar(tipo, nota, quando) }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">Tipo<select className="inp mt-1" value={tipo} onChange={e => setTipo(e.target.value as TipoContato)}>{Object.entries(TIPOS_CONTATO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
                <label className="block text-sm">Data e hora<input type="datetime-local" required className="inp mt-1" value={quando} onChange={e => setQuando(e.target.value)} /></label>
              </div>
              <textarea className="inp" rows={3} placeholder="O que foi conversado, próximo passo…" value={nota} onChange={e => setNota(e.target.value)} aria-label="Anotação" />
              <button className="btn-p w-full" disabled={salvando || !usuario}>{salvando ? 'Salvando…' : 'Registrar contato'}</button>
            </form>
            {contatos.length === 0 ? <p className="text-sm text-slate-500">Nenhum contato registrado ainda.</p> : (
              <ul className="lh-linha-tempo">{contatos.map(c => { const I = ICONES[c.tipo] ?? StickyNote; return (
                <li key={c.id} className="lh-evento">
                  <div className="flex items-start justify-between gap-2"><p className="flex items-center gap-1.5 text-sm font-semibold"><I size={14} />{TIPOS_CONTATO[c.tipo] ?? c.tipo}</p>
                    {c.user_id === meuId && <button className="text-slate-400 hover:text-rose-600" onClick={() => setApagarC(c)} aria-label="Excluir registro"><Trash2 size={14} /></button>}</div>
                  <p className="text-xs text-slate-500">{fmt(c.contatado_em)} · por {c.user_nome}</p>
                  {c.nota && <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{c.nota}</p>}
                </li>) })}</ul>)}
          </div>
        </div>
      </div>

      {vendaDialog}
      {editar && <LeadForm lead={l} onSave={salvarLead} onCancel={() => setEditar(false)} />}
      {apagar && <ConfirmDialog titulo="Excluir lead?" texto={`"${l.nome_loja}" e o histórico de contato serão removidos. Essa ação não pode ser desfeita.`} onCancel={() => setApagar(false)}
        onConfirm={async () => { const { error } = await supabase().from('leads').delete().eq('id', id); if (error) { toast('Erro ao excluir: ' + error.message, 'erro'); setApagar(false) } else router.push('/leads') }} />}
      {apagarC && <ConfirmDialog titulo="Excluir registro?" texto="Este registro será removido do histórico." onCancel={() => setApagarC(null)} onConfirm={async () => { await excluirContato(apagarC); setApagarC(null) }} />}
      {perdendo && <MotivoPerdaDialog nome={l.nome_loja} onCancel={() => setPerdendo(false)} onConfirm={async m => { await mudarStatus('sem_interesse', m); setPerdendo(false) }} />}
      {aviso}
    </div>
  )
}
