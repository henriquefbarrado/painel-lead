'use client'
import PageHeader from './PageHeader'
import ConfirmDialog from './ConfirmDialog'
import FilaEnvio from './FilaEnvio'
import MotivoPerdaDialog from './MotivoPerdaDialog'
import LeadCard from './LeadCard'
import LeadTabela from './LeadTabela'
import EstadoVazio from './EstadoVazio'
import LeadForm from './LeadForm'
import { useToast } from './Toast'
import { temMensagem, whatsappNumber } from '@/lib/message-template'
import { SEGMENTOS, SOLUCOES } from '@/lib/segmentos'
import { useUsuario } from '@/lib/useUsuario'
import { useTemplates } from '@/lib/useTemplates'
import { mensagemDoLead } from '@/lib/templates'
import Link from 'next/link'
import { CheckSquare, Download, FileSpreadsheet, LayoutGrid, List, Plus, Search, SearchX, Send, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { todosLeads } from '@/lib/leads-api'
import { atualizarStatus } from '@/lib/leads-acoes'
import { baixar } from '@/lib/exportar'
import { leadsParaCsv } from '@/lib/leads-csv'
import { chavesDoLead } from '@/lib/importar'
import { situacaoFollowUp, dataHoje } from '@/lib/metricas'
import { FUNIL, STATUS, STATUS_PONTO, type Lead, type LeadInput, type Status } from '@/lib/types'
import { RAIOS, distanceKm } from '@/lib/geo'

const PAGINA = 24
const ORDENS = { recentes: 'Mais recentes', antigos: 'Mais antigos', nome: 'Nome (A–Z)', status: 'Etapa do funil', retorno: 'Próximo contato', distancia: 'Distância' } as const
type Ordem = keyof typeof ORDENS

export default function Painel() {
  const params = useSearchParams()
  const [leads, setLeads] = useState<Lead[]>([]), [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState(''), [fSeg, setFSeg] = useState(''), [fSol, setFSol] = useState('')
  const [fStatus, setFStatus] = useState<'' | Status>((params.get('status') as Status) || '')
  const [fRetorno, setFRetorno] = useState(params.get('retorno') || '')
  const [ordem, setOrdem] = useState<Ordem>('recentes'), [visiveis, setVisiveis] = useState(PAGINA)
  const [raio, setRaio] = useState(0), [refId, setRefId] = useState(''), [refLat, setRefLat] = useState(''), [refLng, setRefLng] = useState('')
  const usuario = useUsuario(), seuNome = usuario?.nome ?? ''
  const { templates, pronto: templatesProntos } = useTemplates()
  const [form, setForm] = useState<{ lead: Lead | null } | null>(null)
  const [fila, setFila] = useState<Lead[] | null>(null)
  const [apagar, setApagar] = useState<Lead[] | null>(null)
  const [selecionando, setSelecionando] = useState(false), [sel, setSel] = useState<Set<string>>(new Set())
  const [statusMassa, setStatusMassa] = useState<'' | Status>(''), [perdendo, setPerdendo] = useState<{ ids: string[]; nome: string } | null>(null)
  const { toast, aviso } = useToast()
  const [vista, setVista] = useState<'cards' | 'tabela'>('cards')
  useEffect(() => { try { if (localStorage.getItem('vista-leads') === 'tabela') setVista('tabela') } catch {} }, [])
  function trocarVista(v: 'cards' | 'tabela') { setVista(v); try { localStorage.setItem('vista-leads', v) } catch {} }

  const carregar = useCallback(async () => {
    const r = await todosLeads()
    if (r.error) toast('Erro ao carregar leads: ' + r.error, 'erro')
    setLeads(r.data); setLoading(false)
  }, [toast])
  useEffect(() => { carregar() }, [carregar])
  useEffect(() => { setVisiveis(PAGINA) }, [busca, fSeg, fSol, fStatus, fRetorno, raio, refId, ordem])

  async function salvar(d: LeadInput) {
    if (!form?.lead) { // lead novo: não deixa cadastrar duas vezes a mesma loja (telefone ou nome+endereço)
      const existentes = new Set(leads.flatMap(l => chavesDoLead(l.nome_loja, l.endereco, l.whatsapp)))
      if (chavesDoLead(d.nome_loja, d.endereco, d.whatsapp).some(k => existentes.has(k))) return toast('Erro: já existe um lead com esse telefone ou com esse nome e endereço.', 'erro')
    }
    const q = form?.lead ? supabase().from('leads').update(d).eq('id', form.lead.id) : supabase().from('leads').insert(d)
    const { error } = await q
    if (error) return toast('Erro ao salvar: ' + error.message, 'erro')
    toast('Lead salvo', 'ok'); setForm(null); carregar()
  }
  async function excluir(ls: Lead[]) {
    const { error } = await supabase().from('leads').delete().in('id', ls.map(l => l.id))
    if (error) return toast('Erro ao excluir: ' + error.message, 'erro')
    toast(ls.length === 1 ? 'Lead excluído' : `${ls.length} leads excluídos`, 'ok'); setSel(new Set()); carregar()
  }
  async function aplicarStatus(ids: string[], s: Status, motivo?: string) {
    const erro = await atualizarStatus(ids, s, motivo)
    if (erro) return toast('Erro ao atualizar status: ' + erro, 'erro')
    toast(ids.length === 1 ? 'Status atualizado' : `${ids.length} leads atualizados`, 'ok'); setSel(new Set()); setStatusMassa(''); carregar()
  }

  const ref = useMemo(() => {
    if (refId) {
      const l = leads.find(x => x.id === refId)
      if (l?.latitude != null && l?.longitude != null) return { lat: l.latitude, lng: l.longitude }
    }
    const a = parseFloat(refLat.replace(',', '.')), b = parseFloat(refLng.replace(',', '.'))
    return !isNaN(a) && !isNaN(b) ? { lat: a, lng: b } : null
  }, [refId, refLat, refLng, leads])

  const hoje = dataHoje()
  const lista = useMemo(() => {
    const q = busca.toLowerCase().trim(), qd = busca.replace(/\D/g, '')
    const f = leads
      .map(l => ({ l, dist: ref && l.latitude != null && l.longitude != null ? distanceKm(ref.lat, ref.lng, l.latitude, l.longitude) : null }))
      .filter(({ l, dist }) => {
        const fu = situacaoFollowUp(l.proximo_contato, hoje)
        return (!fStatus || l.status === fStatus) && (!fSeg || l.segmento === fSeg) && (!fSol || (l.solucoes || []).includes(fSol)) &&
          (!q || l.nome_loja.toLowerCase().includes(q) || (l.cidade || '').toLowerCase().includes(q) || (qd && (l.whatsapp || '').replace(/\D/g, '').includes(qd))) &&
          (!raio || !ref || (dist != null && dist <= raio)) &&
          (!fRetorno || (fRetorno === 'devidos' ? fu === 'hoje' || fu === 'atrasado' : fRetorno === 'sem' ? !l.proximo_contato : fu === fRetorno))
      })
    const ord = ordem === 'distancia' && !ref ? 'recentes' : ordem
    return f.sort((a, b) => {
      switch (ord) {
        case 'antigos': return a.l.created_at.localeCompare(b.l.created_at)
        case 'nome': return a.l.nome_loja.localeCompare(b.l.nome_loja, 'pt-BR')
        case 'status': return FUNIL.indexOf(a.l.status) - FUNIL.indexOf(b.l.status)
        case 'retorno': return (a.l.proximo_contato || '9999').localeCompare(b.l.proximo_contato || '9999')
        case 'distancia': return (a.dist ?? 1e9) - (b.dist ?? 1e9)
        default: return b.l.created_at.localeCompare(a.l.created_at)
      }
    })
  }, [leads, busca, fStatus, fSeg, fSol, fRetorno, raio, ref, ordem, hoje])

  function abrirFila() {
    const q = lista.map(x => x.l).filter(l => temMensagem(l.status) && whatsappNumber(l.whatsapp))
    if (!q.length) return toast('Nenhum lead com telefone válido e mensagem nos filtros atuais', 'erro')
    setFila(q)
  }
  async function marcarEnviado(l: Lead) {
    if (l.status !== 'novo') return
    const erro = await atualizarStatus([l.id], 'contato_realizado')
    if (erro) toast('Erro ao atualizar status: ' + erro, 'erro'); else carregar()
  }
  const exportar = (ls: Lead[]) => { baixar(`leads-${hoje}.csv`, leadsParaCsv(ls)); toast(`${ls.length} leads exportados`, 'ok') }
  const alternar = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const selecionados = leads.filter(l => sel.has(l.id))
  const devidos = leads.filter(l => { const s = situacaoFollowUp(l.proximo_contato, hoje); return (s === 'hoje' || s === 'atrasado') && l.status !== 'convertido' && l.status !== 'sem_interesse' }).length

  return (
    <div className="space-y-6">
      <PageHeader titulo="Leads" sub="Seus contatos e abordagens em um só lugar." icone={<Users size={24} />}>
        <button className="btn-w" onClick={() => { setSelecionando(!selecionando); setSel(new Set()) }}><CheckSquare size={16} />{selecionando ? 'Cancelar seleção' : 'Selecionar'}</button>
        <button className="btn-w" onClick={() => exportar(lista.map(x => x.l))} disabled={!lista.length}><Download size={16} />CSV</button>
        <button className="btn-w" onClick={abrirFila}><Send size={16} />Modo envio</button>
        <button className="btn-p" onClick={() => setForm({ lead: null })}><Plus size={16} />Novo lead</button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[{ k: '' as const, nome: 'Total' }, ...FUNIL.map(k => ({ k, nome: STATUS[k] }))].map(({ k, nome }) => {
          const v = k ? leads.filter(l => l.status === k).length : leads.length, on = fStatus === k
          return (
            <button key={nome} onClick={() => setFStatus(on && k ? '' : k)} aria-pressed={on}
              className={`card card-hover p-4 text-left ${on ? 'ring-2 ring-indigo-500' : ''}`}>
              <p className="flex items-center gap-2 text-sm text-slate-500">{k && <span className={`h-2 w-2 rounded-full ${STATUS_PONTO[k]}`} />}{nome}</p>
              <p className="mt-1 text-2xl font-semibold leading-tight tracking-tight">{v}</p>
            </button>) })}
      </div>

      {devidos > 0 && <button onClick={() => setFRetorno(fRetorno === 'devidos' ? '' : 'devidos')} className="card flex w-full items-center justify-between gap-3 border-amber-300/60 p-3 text-left text-sm">
        <span><b>{devidos}</b> {devidos === 1 ? 'retorno' : 'retornos'} para hoje ou atrasado{devidos === 1 ? '' : 's'}</span><span className="text-indigo-600">{fRetorno === 'devidos' ? 'Limpar filtro' : 'Filtrar'}</span></button>}

      <div className="space-y-3 card p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input className="inp" placeholder="Buscar por loja, cidade ou telefone" value={busca} onChange={e => setBusca(e.target.value)} aria-label="Buscar" />
          <select className="inp" value={fStatus} onChange={e => setFStatus(e.target.value as Status | '')} aria-label="Status">
            <option value="">Todos os status</option>
            {FUNIL.map(k => <option key={k} value={k}>{STATUS[k]}</option>)}</select>
          <select className="inp" value={ordem} onChange={e => setOrdem(e.target.value as Ordem)} aria-label="Ordenar">
            {(Object.keys(ORDENS) as Ordem[]).map(k => <option key={k} value={k}>Ordenar: {ORDENS[k]}</option>)}</select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select className="inp" value={refId} onChange={e => setRefId(e.target.value)}>
            <option value="">Distância a partir de… (escolha uma loja)</option>
            {leads.filter(l => l.latitude != null && l.longitude != null).map(l => <option key={l.id} value={l.id}>{l.nome_loja}</option>)}</select>
          <select className="inp" value={raio} onChange={e => setRaio(Number(e.target.value))}>
            <option value={0}>Raio de distância: todos</option>
            {RAIOS.map(r => <option key={r} value={r}>{r} km</option>)}</select>
          <select className="inp" value={fSeg} onChange={e => { setFSeg(e.target.value); setFSol('') }}>
            <option value="">Todos os segmentos</option>
            {Object.entries(SEGMENTOS).map(([k, v]) => <option key={k} value={k}>{v.nome}</option>)}</select>
          <select className="inp" value={fSol} onChange={e => setFSol(e.target.value)}>
            <option value="">Todas as soluções</option>
            {(fSeg ? SEGMENTOS[fSeg].solucoes : Object.keys(SOLUCOES)).map(s => <option key={s} value={s}>{SOLUCOES[s]}</option>)}</select>
        </div>
        <select className="inp sm:max-w-xs" value={fRetorno} onChange={e => setFRetorno(e.target.value)} aria-label="Retorno">
          <option value="">Retorno: todos</option><option value="devidos">Hoje ou atrasados</option><option value="atrasado">Atrasados</option><option value="hoje">Hoje</option><option value="futuro">Agendados</option><option value="sem">Sem data</option></select>
        {raio > 0 && !ref && <p className="text-sm text-amber-600">Escolha uma loja de referência para filtrar por raio.</p>}
        {ordem === 'distancia' && !ref && <p className="text-sm text-amber-600">Escolha uma loja de referência para ordenar por distância.</p>}
      </div>

      {selecionando && (
        <div className="card sticky top-2 z-20 flex flex-wrap items-center gap-2 border-indigo-400/50 p-3 text-sm">
          <b>{sel.size}</b> selecionado{sel.size === 1 ? '' : 's'}
          <button className="btn" onClick={() => setSel(sel.size === lista.length ? new Set() : new Set(lista.map(x => x.l.id)))}>{sel.size === lista.length ? 'Limpar' : `Marcar todos (${lista.length})`}</button>
          <select className="inp !w-auto" value={statusMassa} disabled={!sel.size} onChange={e => {
            const s = e.target.value as Status; if (!s) return
            if (s === 'sem_interesse') { setPerdendo({ ids: [...sel], nome: sel.size === 1 ? selecionados[0].nome_loja : `${sel.size} leads` }); return }
            aplicarStatus([...sel], s) }} aria-label="Mudar status dos selecionados">
            <option value="">Mudar status para…</option>{FUNIL.map(k => <option key={k} value={k}>{STATUS[k]}</option>)}</select>
          <button className="btn" disabled={!sel.size} onClick={() => exportar(selecionados)}><Download size={15} />Exportar</button>
          <button className="btn text-red-600" disabled={!sel.size} onClick={() => setApagar(selecionados)}>Excluir</button>
        </div>)}

      {loading || !usuario || !templatesProntos ? (
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3" aria-busy="true">{[0, 1, 2].map(i => <div key={i} className="card space-y-3 p-5"><div className="skeleton h-11 w-full" /><div className="skeleton h-4 w-3/4" /><div className="skeleton h-24 w-full" /></div>)}</div>
      ) : lista.length === 0 ? (
        leads.length === 0 ? (
          <EstadoVazio icone={<Users size={22} />} titulo="Você ainda não tem leads" texto="Busque lojas sem site, importe uma planilha ou cadastre o primeiro lead manualmente.">
            <Link href="/buscar" className="btn-p"><Search size={15} />Buscar lojas</Link>
            <Link href="/importar" className="btn"><FileSpreadsheet size={15} />Importar planilha</Link>
            <button className="btn" onClick={() => setForm({ lead: null })}><Plus size={15} />Novo lead</button>
          </EstadoVazio>
        ) : <EstadoVazio icone={<SearchX size={22} />} titulo="Nenhum lead com esses filtros" texto="Tente remover algum filtro ou mudar a busca." />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Mostrando {Math.min(visiveis, lista.length)} de {lista.length}</p>
            <div className="inline-flex rounded-lg border border-slate-300 p-0.5" role="group" aria-label="Modo de exibição">
              {([['cards', 'Cards', LayoutGrid], ['tabela', 'Tabela', List]] as const).map(([k, nome, Icon]) => (
                <button key={k} onClick={() => trocarVista(k)} aria-pressed={vista === k} title={nome}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${vista === k ? 'bg-indigo-500/10 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}><Icon size={14} />{nome}</button>))}
            </div>
          </div>
          {vista === 'tabela' ? (
            <LeadTabela itens={lista.slice(0, visiveis)} temRef={!!ref} seuNome={seuNome} templates={templates} selecionando={selecionando} sel={sel} onSelect={alternar}
              onEdit={l => setForm({ lead: l })} onDelete={l => setApagar([l])} toast={toast} />
          ) : (
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {lista.slice(0, visiveis).map(({ l, dist }) => <LeadCard key={l.id + l.status + templates.length} lead={l} dist={dist} temRef={!!ref} seuNome={seuNome} templates={templates}
              selecionando={selecionando} selecionado={sel.has(l.id)} onSelect={() => alternar(l.id)}
              onEdit={() => setForm({ lead: l })} onDelete={() => setApagar([l])} toast={toast} />)}
          </div>)}
          {visiveis < lista.length && <div className="text-center"><button className="btn" onClick={() => setVisiveis(v => v + PAGINA)}>Carregar mais ({lista.length - visiveis} restantes)</button></div>}
        </>)}

      {fila && <FilaEnvio leads={fila} seuNome={seuNome} templates={templates} onSent={marcarEnviado} onClose={() => setFila(null)} />}
      {apagar && <ConfirmDialog titulo={apagar.length === 1 ? 'Excluir lead?' : `Excluir ${apagar.length} leads?`}
        texto={apagar.length === 1 ? `"${apagar[0].nome_loja}" será removido e essa ação não pode ser desfeita.` : 'Eles serão removidos junto com o histórico de contato, e essa ação não pode ser desfeita. Dica: exporte o CSV antes.'}
        onCancel={() => setApagar(null)} onConfirm={async () => { await excluir(apagar); setApagar(null) }} />}
      {perdendo && <MotivoPerdaDialog nome={perdendo.nome} onCancel={() => { setPerdendo(null); setStatusMassa('') }}
        onConfirm={async m => { await aplicarStatus(perdendo.ids, 'sem_interesse', m); setPerdendo(null) }} />}
      {form && <LeadForm lead={form.lead} onSave={salvar} onCancel={() => setForm(null)} />}
      {aviso}
    </div>
  )
}
