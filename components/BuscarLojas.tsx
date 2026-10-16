'use client'
import PageHeader from './PageHeader'
import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

type Loja = { id: string; nome: string; endereco: string; telefone: string | null; lat: number | null; lng: number | null; maps: string; social: string | null }

export default function BuscarLojas() {
  const [segmento, setSegmento] = useState(''), [local, setLocal] = useState('')
  const [lojas, setLojas] = useState<Loja[]>([]), [total, setTotal] = useState(0)
  const [busy, setBusy] = useState(false), [erro, setErro] = useState(''), [feito, setFeito] = useState(false)
  const [salvos, setSalvos] = useState<Set<string>>(new Set()), [aviso, setAviso] = useState('')
  const chave = (n: string, e: string) => (n + '|' + e).toLowerCase()

  useEffect(() => {
    supabase().from('leads').select('nome_loja,endereco').then(({ data }) =>
      setSalvos(new Set((data || []).map(l => chave(l.nome_loja, l.endereco || '')))))
  }, [])

  async function buscar(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErro(''); setFeito(false)
    const r = await fetch('/api/buscar-lojas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ segmento, local }) })
    const j = await r.json().catch(() => ({ erro: 'Resposta inválida do servidor' }))
    if (!r.ok) setErro(j.erro || 'Erro na busca'); else { setLojas(j.lojas); setTotal(j.total); setFeito(true) }
    setBusy(false)
  }
  async function adicionar(l: Loja) {
    const { error } = await supabase().from('leads').insert({
      nome_loja: l.nome, whatsapp: l.telefone, endereco: l.endereco, cidade: local, categoria: segmento,
      latitude: l.lat, longitude: l.lng, status: 'novo',
      observacoes: l.social ? `Sem site (só rede social: ${l.social})` : 'Sem site (achado na busca)' })
    if (error) return setAviso('Erro: ' + error.message)
    setSalvos(new Set(salvos).add(chave(l.nome, l.endereco))); setAviso('Adicionado aos leads'); setTimeout(() => setAviso(''), 2500)
  }

  return (
    <div className="space-y-6">
      <PageHeader titulo="Buscar lojas sem site" sub="Encontre negócios da sua região que ainda não têm site." icone={<Search size={24} />} />
      <form onSubmit={buscar} className="card grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto]">
        <input className="inp" required placeholder="Segmento (ex.: loja de roupas)" value={segmento} onChange={e => setSegmento(e.target.value)} />
        <input className="inp" required placeholder="Cidade ou bairro (ex.: Savassi, Belo Horizonte)" value={local} onChange={e => setLocal(e.target.value)} />
        <button className="btn-p" disabled={busy}>{busy ? 'Buscando…' : 'Buscar'}</button>
      </form>
      {erro && <p className="card border-red-200 bg-red-50 p-4 text-sm text-red-700">{erro}</p>}
      {feito && <p className="text-sm text-slate-600">{total} lojas encontradas, <b>{lojas.length}</b> sem site.</p>}
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {lojas.map(l => (
          <div key={l.id} className="card card-hover space-y-2 p-4">
            <h3 className="font-semibold">{l.nome}</h3>
            <p className="text-sm text-slate-600">📍 {l.endereco}</p>
            <p className="text-sm text-slate-600">📞 {l.telefone || <i className="text-slate-400">sem telefone</i>}</p>
            {l.social && <p className="text-xs text-amber-700">Só tem rede social: {l.social}</p>}
            <div className="flex gap-2 pt-1">
              <a className="btn" href={l.maps} target="_blank" rel="noopener noreferrer">Ver no mapa</a>
              {salvos.has(chave(l.nome, l.endereco)) ? <span className="px-2 py-2 text-sm text-emerald-600">✓ Já nos leads</span>
                : <button className="btn-p" onClick={() => adicionar(l)}>Adicionar aos leads</button>}
            </div>
          </div>))}
      </div>
      {aviso && <div className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2 text-sm text-white">{aviso}</div>}
    </div>
  )
}
