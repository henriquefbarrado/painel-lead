'use client'
import PageHeader from './PageHeader'
import { useToast } from './Toast'
import { AlertCircle, Database, Search, SearchX } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { todosLeads } from '@/lib/leads-api'
import { chavesDoLead } from '@/lib/importar'
import { SEGMENTOS } from '@/lib/segmentos'

type Loja = { id: string; nome: string; endereco: string; telefone: string | null; lat: number | null; lng: number | null; maps: string | null; social: string | null }
type Cota = { usado: number; limite: number; medido: boolean; provedor: string }

export default function BuscarLojas() {
  const [segmento, setSegmento] = useState(''), [local, setLocal] = useState(''), [qtd, setQtd] = useState(20), [segLead, setSegLead] = useState('')
  const [lojas, setLojas] = useState<Loja[]>([]), [total, setTotal] = useState(0), [doCache, setDoCache] = useState(false)
  const [busy, setBusy] = useState(false), [erro, setErro] = useState(''), [feito, setFeito] = useState(false)
  const [chaves, setChaves] = useState<Set<string>>(new Set()), [placeIds, setPlaceIds] = useState<Set<string>>(new Set())
  const [sel, setSel] = useState<Set<string>>(new Set()), [salvando, setSalvando] = useState(false)
  const [cota, setCota] = useState<Cota | null>(null)
  const { toast, aviso } = useToast()

  const carregarCota = useCallback(async () => {
    const r = await fetch('/api/buscar-lojas').catch(() => null)
    if (r?.ok) setCota(await r.json())
  }, [])
  const carregarExistentes = useCallback(async () => {
    const { data } = await todosLeads()
    const k = new Set<string>(), p = new Set<string>()
    data.forEach(l => { chavesDoLead(l.nome_loja, l.endereco, l.whatsapp).forEach(x => k.add(x)); if (l.place_id) p.add(l.place_id) })
    setChaves(k); setPlaceIds(p)
  }, [])
  useEffect(() => { carregarCota(); carregarExistentes() }, [carregarCota, carregarExistentes])

  const jaTem = useCallback((l: Loja) => placeIds.has(l.id) || chavesDoLead(l.nome, l.endereco, l.telefone).some(k => chaves.has(k)), [chaves, placeIds])
  const novas = useMemo(() => lojas.filter(l => !jaTem(l)), [lojas, jaTem])
  const resta = cota ? Math.max(0, cota.limite - cota.usado) : null
  const pct = cota ? Math.min(100, (cota.usado / cota.limite) * 100) : 0
  const limitado = cota?.provedor === 'openwebninja'

  async function buscar(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErro(''); setFeito(false); setSel(new Set()); setLojas([])
    try {
      const r = await fetch('/api/buscar-lojas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ segmento, local, quantidade: qtd }) })
      const j = await r.json().catch(() => ({ erro: 'Resposta inválida do servidor' }))
      if (!r.ok) setErro(j.erro || 'Erro na busca')
      else { setLojas(j.lojas); setTotal(j.total); setDoCache(!!j.cache); setFeito(true); setSel(new Set((j.lojas as Loja[]).filter(l => !jaTem(l)).map(l => l.id))) }
    } catch { setErro('Sem conexão com o servidor. Verifique a internet e tente de novo.') }
    setBusy(false); carregarCota()
  }

  const paraLead = (l: Loja) => ({
    nome_loja: l.nome, whatsapp: l.telefone, endereco: l.endereco, cidade: local, categoria: segmento, segmento: segLead || null,
    latitude: l.lat, longitude: l.lng, status: 'novo', place_id: l.id,
    observacoes: l.social ? `Sem site (só rede social: ${l.social})` : 'Sem site (achado na busca)',
  })
  async function adicionar(escolhidas: Loja[]) {
    const lista = escolhidas.filter(l => !jaTem(l))
    if (!lista.length) return toast('Nada novo para adicionar', 'erro')
    setSalvando(true)
    const { error } = await supabase().from('leads').insert(lista.map(paraLead))
    setSalvando(false)
    if (error) return toast(error.code === '23505' ? 'Erro: alguma loja já estava nos leads. Atualize a página e tente de novo.' : 'Erro ao salvar: ' + error.message, 'erro')
    toast(`${lista.length} ${lista.length === 1 ? 'lead adicionado' : 'leads adicionados'}`, 'ok'); setSel(new Set()); carregarExistentes()
  }
  const alternar = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  return (
    <div className="space-y-6">
      <PageHeader titulo="Buscar lojas sem site" sub="Encontre negócios da sua região que ainda não têm site." icone={<Search size={24} />} />

      {cota && (
        <div className="card space-y-2 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="flex items-center gap-2 font-medium"><Database size={16} />{limitado ? 'Cota do plano grátis (este mês)' : 'Consultas deste mês'}</p>
            <p className="text-slate-500">{limitado ? <><b className="text-slate-900">{cota.usado}</b> de {cota.limite} lojas · restam <b className="text-slate-900">{resta}</b></> : <><b className="text-slate-900">{cota.usado}</b> lojas consultadas</>}</p>
          </div>
          {limitado && <div className="h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={cota.usado} aria-valuemax={cota.limite}>
            <div className={`h-full transition-all ${pct > 90 ? 'bg-rose-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} /></div>}
          {!cota.medido && <p className="text-xs text-amber-600">Contador indisponível: rode o arquivo supabase/melhorias.sql no Supabase.</p>}
          <p className="text-xs text-slate-500">Cada busca gasta a quantidade escolhida (mesmo as lojas que têm site). Repetir a mesma busca em 24 h usa o cache e não gasta cota.</p>
        </div>)}

      <form onSubmit={buscar} className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto]">
        <input className="inp" required placeholder="Segmento (ex.: loja de roupas)" value={segmento} onChange={e => setSegmento(e.target.value)} />
        <input className="inp" required placeholder="Cidade ou bairro (ex.: Savassi, Belo Horizonte)" value={local} onChange={e => setLocal(e.target.value)} />
        <select className="inp !w-auto" value={qtd} onChange={e => setQtd(Number(e.target.value))} title="Quantas lojas consultar por busca">
          {[10, 20, 40, 60].map(n => <option key={n} value={n} disabled={limitado && resta !== null && n > resta}>{n} lojas</option>)}</select>
        <button className="btn-p" disabled={busy}>{busy ? 'Buscando…' : 'Buscar'}</button>
        <select className="inp sm:col-span-2 lg:col-span-4" value={segLead} onChange={e => setSegLead(e.target.value)} aria-label="Segmento dos leads salvos">
          <option value="">Segmento dos leads salvos: não definir</option>
          {Object.entries(SEGMENTOS).map(([k, v]) => <option key={k} value={k}>{v.nome}</option>)}</select>
      </form>

      {erro && <div role="alert" className="card flex items-start gap-3 border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle size={18} className="mt-0.5 shrink-0" /><div><p className="font-medium">Não foi possível buscar</p><p>{erro}</p></div></div>}

      {busy && <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3" aria-busy="true">{[0, 1, 2].map(i => <div key={i} className="card space-y-3 p-4"><div className="skeleton h-5 w-2/3" /><div className="skeleton h-4 w-full" /><div className="skeleton h-4 w-1/2" /><div className="skeleton h-9 w-40" /></div>)}</div>}

      {!busy && !erro && !feito && <div className="card p-10 text-center text-slate-500"><Search className="mx-auto mb-2 text-slate-300" size={36} />Digite um segmento e um local para começar.<br /><span className="text-sm">Ex.: “barbearia” em “Savassi, Belo Horizonte”.</span></div>}

      {feito && !busy && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">{total} lojas encontradas, <b>{lojas.length}</b> sem site{lojas.length - novas.length > 0 && <>, {lojas.length - novas.length} já nos seus leads</>}.{doCache && <span className="lh-chip ml-2 bg-sky-100 text-sky-700">do cache, sem gastar cota</span>}</p>
          {novas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button className="btn" onClick={() => setSel(sel.size === novas.length ? new Set() : new Set(novas.map(l => l.id)))}>{sel.size === novas.length ? 'Desmarcar todas' : 'Marcar todas'}</button>
              <button className="btn-p" disabled={!sel.size || salvando} onClick={() => adicionar(lojas.filter(l => sel.has(l.id)))}>{salvando ? 'Salvando…' : `Adicionar ${sel.size} selecionada${sel.size === 1 ? '' : 's'}`}</button>
            </div>)}
        </div>)}

      {feito && !busy && lojas.length === 0 && (
        <div className="card p-10 text-center text-slate-500"><SearchX className="mx-auto mb-2 text-slate-300" size={36} />Nenhuma loja sem site nesta busca.<br /><span className="text-sm">Tente outro bairro, outro segmento ou aumente a quantidade.</span></div>)}

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {lojas.map(l => { const ja = jaTem(l); return (
          <div key={l.id} className={`card card-hover space-y-2 p-4 ${ja ? 'opacity-70' : ''}`}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold">{l.nome}</h3>
              {!ja && <input type="checkbox" className="mt-1 h-5 w-5 accent-indigo-600" checked={sel.has(l.id)} onChange={() => alternar(l.id)} aria-label={`Selecionar ${l.nome}`} />}
            </div>
            <p className="text-sm text-slate-600">📍 {l.endereco}</p>
            <p className="text-sm text-slate-600">📞 {l.telefone || <i className="text-slate-400">sem telefone</i>}</p>
            {l.social && <p className="text-xs text-amber-700">Só tem rede social: {l.social}</p>}
            <div className="flex flex-wrap gap-2 pt-1">
              {l.maps && <a className="btn" href={l.maps} target="_blank" rel="noopener noreferrer">Ver no mapa</a>}
              {ja ? <span className="px-2 py-2 text-sm text-emerald-600">✓ Já nos leads</span> : <button className="btn-p" disabled={salvando} onClick={() => adicionar([l])}>Adicionar aos leads</button>}
            </div>
          </div>) })}
      </div>
      {aviso}
    </div>
  )
}
