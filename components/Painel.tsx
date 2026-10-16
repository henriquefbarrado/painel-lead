'use client'
import PageHeader from './PageHeader'
import ConfirmDialog from './ConfirmDialog'
import { SEGMENTOS, SOLUCOES } from '@/lib/segmentos'
import { useUsuario } from '@/lib/useUsuario'
import { Flame, Plus, Send, Sparkles, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { STATUS, type Lead, type LeadInput, type Status } from '@/lib/types'
import { RAIOS, distanceKm } from '@/lib/geo'
import LeadCard from './LeadCard'
import LeadForm from './LeadForm'

export default function Painel() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [fSeg, setFSeg] = useState(''), [fSol, setFSol] = useState('')
  const [fStatus, setFStatus] = useState<'' | Status>('')
  const [raio, setRaio] = useState(0)
  const [refId, setRefId] = useState('')
  const [refLat, setRefLat] = useState(''), [refLng, setRefLng] = useState('')
  const usuario = useUsuario(), seuNome = usuario?.nome ?? ''
  const [form, setForm] = useState<{ lead: Lead | null } | null>(null)
  const [apagar, setApagar] = useState<Lead | null>(null)
  const [aviso, setAviso] = useState('')

  const toast = (m: string) => { setAviso(m); setTimeout(() => setAviso(''), 3000) }
  async function carregar() {
    const { data, error } = await supabase().from('leads').select('*').order('created_at', { ascending: false })
    if (error) toast('Erro ao carregar leads: ' + error.message)
    setLeads((data as Lead[]) || []); setLoading(false)
  }
  useEffect(() => { carregar() }, [])

  async function salvar(d: LeadInput) {
    const q = form?.lead ? supabase().from('leads').update(d).eq('id', form.lead.id) : supabase().from('leads').insert(d)
    const { error } = await q
    if (error) return toast('Erro ao salvar: ' + error.message)
    toast('Lead salvo'); setForm(null); carregar()
  }
  async function excluir(l: Lead) {
    const { error } = await supabase().from('leads').delete().eq('id', l.id)
    if (error) return toast('Erro ao excluir: ' + error.message)
    toast('Lead excluído'); carregar()
  }
  async function sair() { await supabase().auth.signOut(); router.push('/login'); router.refresh() }

  const ref = useMemo(() => {
    if (refId) {
      const l = leads.find(x => x.id === refId)
      if (l?.latitude != null && l?.longitude != null) return { lat: l.latitude, lng: l.longitude }
    }
    const a = parseFloat(refLat.replace(',', '.')), b = parseFloat(refLng.replace(',', '.'))
    return !isNaN(a) && !isNaN(b) ? { lat: a, lng: b } : null
  }, [refId, refLat, refLng, leads])

  const lista = useMemo(() => {
    const q = busca.toLowerCase().trim(), qd = busca.replace(/\D/g, '')
    return leads
      .map(l => ({ l, dist: ref && l.latitude != null && l.longitude != null ? distanceKm(ref.lat, ref.lng, l.latitude, l.longitude) : null }))
      .filter(({ l, dist }) =>
        (!fStatus || l.status === fStatus) && (!fSeg || l.segmento === fSeg) && (!fSol || (l.solucoes || []).includes(fSol)) &&
        (!q || l.nome_loja.toLowerCase().includes(q) || (l.cidade || '').toLowerCase().includes(q) ||
          (qd && (l.whatsapp || '').replace(/\D/g, '').includes(qd))) &&
        (!raio || !ref || (dist != null && dist <= raio)))
      .sort((a, b) => (ref ? (a.dist ?? 1e9) - (b.dist ?? 1e9) : 0))
  }, [leads, busca, fStatus, fSeg, fSol, raio, ref])

  const cont = (s: Status) => leads.filter(l => l.status === s).length
  const kpis = [['Total de leads', leads.length], ['Novos', cont('novo')],
    ['Contatados', cont('contato_realizado')], ['Interessados', cont('interessado')]]

  return (
    <div className="space-y-6">
        <PageHeader titulo="Leads" sub="Seus contatos e abordagens em um só lugar." icone={<Users size={24} />}>
          <button className="btn-w" onClick={() => setForm({ lead: null })}><Plus size={16} />Novo lead</button>
        </PageHeader>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map(([n, v], i) => { const I = [Users, Sparkles, Send, Flame][i]; return <div key={n as string} className="card card-hover flex items-center gap-4 p-4">
            <div className={`grid h-12 w-12 place-items-center rounded-2xl ${['bg-indigo-100 text-indigo-600', 'bg-sky-100 text-sky-600', 'bg-violet-100 text-violet-600', 'bg-amber-100 text-amber-600'][i]}`}><I size={22} /></div>
            <div><p className="text-sm text-slate-500">{n}</p><p className="text-3xl font-bold leading-tight">{v}</p></div></div> })}
        </div>
        <div className="space-y-3 card p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="inp" placeholder="Buscar por loja, cidade ou telefone" value={busca} onChange={e => setBusca(e.target.value)} />
            <select className="inp" value={fStatus} onChange={e => setFStatus(e.target.value as Status | '')}>
              <option value="">Todos os status</option>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <select className="inp" value={refId} onChange={e => setRefId(e.target.value)}>
              <option value="">Distância a partir de… (escolha uma loja)</option>
              {leads.filter(l => l.latitude != null && l.longitude != null).map(l => <option key={l.id} value={l.id}>{l.nome_loja}</option>)}</select>
            <select className="inp" value={raio} onChange={e => setRaio(Number(e.target.value))}>
              <option value={0}>Raio de distância: todos</option>
              {RAIOS.map(r => <option key={r} value={r}>{r} km</option>)}</select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <select className="inp" value={fSeg} onChange={e => { setFSeg(e.target.value); setFSol('') }}>
              <option value="">Todos os segmentos</option>
              {Object.entries(SEGMENTOS).map(([k, v]) => <option key={k} value={k}>{v.nome}</option>)}</select>
            <select className="inp" value={fSol} onChange={e => setFSol(e.target.value)}>
              <option value="">Todas as soluções</option>
              {(fSeg ? SEGMENTOS[fSeg].solucoes : Object.keys(SOLUCOES)).map(s => <option key={s} value={s}>{SOLUCOES[s]}</option>)}</select>
          </div>
          {raio > 0 && !ref && <p className="text-sm text-amber-600">Escolha uma loja de referência para filtrar por raio.</p>}
        </div>
        {loading || !usuario ? <p className="text-slate-500">Carregando…</p> : lista.length === 0 ? <div className="card p-10 text-center text-slate-500"><Users className="mx-auto mb-2 text-slate-300" size={36} />Nenhum lead encontrado.<br /><span className="text-sm">Cadastre um lead ou use a aba Buscar lojas.</span></div> : (
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {lista.map(({ l, dist }) => <LeadCard key={l.id + l.status} lead={l} dist={dist} temRef={!!ref} seuNome={seuNome}
              onEdit={() => setForm({ lead: l })} onDelete={() => setApagar(l)} toast={toast} />)}
          </div>)}
            {apagar && <ConfirmDialog titulo="Excluir lead?" texto={`"${apagar.nome_loja}" será removido e essa ação não pode ser desfeita.`}
        onCancel={() => setApagar(null)} onConfirm={async () => { await excluir(apagar); setApagar(null) }} />}
      {form && <LeadForm lead={form.lead} onSave={salvar} onCancel={() => setForm(null)} />}
      {aviso && <div className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-md bg-slate-900 px-4 py-2 text-sm text-white">{aviso}</div>}
    </div>
  )
}
