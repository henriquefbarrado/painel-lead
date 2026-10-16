'use client'
import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { History, MapPinned } from 'lucide-react'
import type { LayerGroup, Map as MapaLeaflet } from 'leaflet'
import PageHeader from './PageHeader'
import HistoricoContato from './HistoricoContato'
import { todosLeads } from '@/lib/leads-api'
import { STATUS, type Lead, type Status } from '@/lib/types'

type Leaflet = typeof import('leaflet')
const COR: Record<Status, string> = {
  novo: '#0ea5e9', contato_realizado: '#8b5cf6', interessado: '#f59e0b',
  sem_interesse: '#94a3b8', negociacao: '#f97316', convertido: '#10b981',
}
const texto = (tag: string, t: string, cls?: string) => { const e = document.createElement(tag); e.textContent = t; if (cls) e.className = cls; return e }

export default function MapaLeads() {
  const el = useRef<HTMLDivElement>(null)
  const mapa = useRef<MapaLeaflet | null>(null), camada = useRef<LayerGroup | null>(null), L = useRef<Leaflet | null>(null)
  const [pronto, setPronto] = useState(false)
  const [leads, setLeads] = useState<Lead[]>([]), [loading, setLoading] = useState(true), [erro, setErro] = useState('')
  const [busca, setBusca] = useState(''), [fStatus, setFStatus] = useState<'' | Status>('')
  const [historico, setHistorico] = useState<Lead | null>(null)

  useEffect(() => { todosLeads().then(r => { setLeads(r.data); setErro(r.error ? 'Erro ao carregar leads: ' + r.error : ''); setLoading(false) }) }, [])

  useEffect(() => {
    let cancelado = false
    import('leaflet').then(mod => {
      if (cancelado || !el.current) return
      const lib = ((mod as unknown as { default?: Leaflet }).default ?? mod) as Leaflet
      L.current = lib
      const m = lib.map(el.current).setView([-14.2, -51.9], 4)
      lib.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m)
      mapa.current = m; camada.current = lib.layerGroup().addTo(m); setPronto(true)
    })
    return () => { cancelado = true; mapa.current?.remove(); mapa.current = null; camada.current = null; setPronto(false) }
  }, [])

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase().trim()
    return leads.filter(l => (!fStatus || l.status === fStatus) &&
      (!q || l.nome_loja.toLowerCase().includes(q) || (l.cidade || '').toLowerCase().includes(q)))
  }, [leads, busca, fStatus])
  const comLocal = useMemo(() => filtrados.filter(l => l.latitude != null && l.longitude != null), [filtrados])
  const semLocal = filtrados.length - comLocal.length

  useEffect(() => {
    const lib = L.current, g = camada.current, m = mapa.current
    if (!pronto || !lib || !g || !m) return
    g.clearLayers()
    comLocal.forEach(l => {
      const balao = document.createElement('div'); balao.className = 'lh-balao'
      balao.append(texto('strong', l.nome_loja), texto('div', STATUS[l.status]))
      const end = [l.endereco, [l.cidade, l.estado].filter(Boolean).join('/')].filter(Boolean).join(' — ')
      if (end) balao.append(texto('div', end))
      if (l.whatsapp) balao.append(texto('div', l.whatsapp))
      const b = texto('button', 'Abrir histórico', 'lh-balao-btn'); b.onclick = () => setHistorico(l); balao.append(b)
      lib.circleMarker([l.latitude!, l.longitude!], { radius: 8, color: '#ffffff', weight: 2, fillColor: COR[l.status], fillOpacity: 0.95 })
        .bindPopup(balao).addTo(g)
    })
    if (comLocal.length) m.fitBounds(comLocal.map(l => [l.latitude!, l.longitude!] as [number, number]), { padding: [40, 40], maxZoom: 14 })
  }, [pronto, comLocal])

  return (
    <div className="space-y-6">
      <PageHeader titulo="Mapa de leads" sub="Veja onde estão seus leads e abra o histórico de contato direto no mapa." icone={<MapPinned size={24} />} />
      <div className="card space-y-3 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="inp" placeholder="Buscar por loja ou cidade" value={busca} onChange={e => setBusca(e.target.value)} />
          <select className="inp" value={fStatus} onChange={e => setFStatus(e.target.value as Status | '')}>
            <option value="">Todos os status</option>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          {(Object.keys(STATUS) as Status[]).map(s => <span key={s} className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: COR[s] }} />{STATUS[s]}</span>)}
        </div>
      </div>
      {erro && <p className="card border-red-200 bg-red-50 p-4 text-sm text-red-700">{erro}</p>}
      <p className="text-sm text-slate-600">{loading ? 'Carregando leads…' : <><b>{comLocal.length}</b> no mapa{semLocal > 0 && <> · {semLocal} sem localização</>}</>}</p>
      <div ref={el} className="lh-mapa" />
      {semLocal > 0 && (
        <details className="card p-4">
          <summary className="cursor-pointer text-sm font-medium">Leads sem localização ({semLocal})</summary>
          <p className="mt-2 text-xs text-slate-500">Preencha latitude e longitude no lead (Editar &gt; Coordenadas) para ele aparecer no mapa.</p>
          <ul className="mt-3 divide-y divide-slate-200 text-sm">
            {filtrados.filter(l => l.latitude == null || l.longitude == null).slice(0, 100).map(l => (
              <li key={l.id} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0 truncate">{l.nome_loja}<span className="text-slate-400"> · {[l.cidade, l.estado].filter(Boolean).join('/') || 'sem cidade'}</span></span>
                <button className="btn !px-2.5 !py-1.5" onClick={() => setHistorico(l)}><History size={14} />Histórico</button>
              </li>))}
          </ul>
          {semLocal > 100 && <p className="pt-2 text-xs text-slate-500">Mostrando 100 de {semLocal}. Use a busca para refinar.</p>}
        </details>)}
      {historico && <HistoricoContato lead={historico} onClose={() => setHistorico(null)} />}
    </div>
  )
}
