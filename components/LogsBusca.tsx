'use client'
import { useEffect, useMemo, useState } from 'react'
import { ScrollText } from 'lucide-react'
import PageHeader from './PageHeader'
import EstadoVazio from './EstadoVazio'
import { supabase } from '@/lib/supabase/client'
import { useUsuario } from '@/lib/useUsuario'
import { ehAdmin, nomeDoEmail } from '@/lib/usuarios'
import { dataHoje } from '@/lib/metricas'

type Log = { id: string; created_at: string; usuario: string | null; segmento: string; local: string; qtd_pedida: number | null; resultados: number | null; sem_site: number | null; cota_gasta: number; do_cache: boolean; erro: string | null }

export default function LogsBusca() {
  const u = useUsuario(), admin = ehAdmin(u?.email)
  const [logs, setLogs] = useState<Log[]>([]), [loading, setLoading] = useState(true), [erro, setErro] = useState(''), [quem, setQuem] = useState('')
  useEffect(() => {
    if (!u) return
    if (!admin) { setLoading(false); return }
    supabase().from('logs_busca').select('*').order('created_at', { ascending: false }).limit(500).then(({ data, error }) => {
      if (error) setErro(/relation|schema|does not exist/i.test(error.message) ? 'Rode o supabase/logs-busca.sql no SQL Editor do Supabase.' : error.message)
      setLogs((data as Log[]) || []); setLoading(false)
    })
  }, [u, admin])

  const lista = useMemo(() => logs.filter(l => !quem || l.usuario === quem), [logs, quem])
  const usuarios = useMemo(() => Array.from(new Set(logs.map(l => l.usuario).filter(Boolean))) as string[], [logs])
  const mes = dataHoje().slice(0, 7), doMes = lista.filter(l => dataHoje(new Date(l.created_at)).startsWith(mes))
  const kpis: [string, string | number][] = [['Buscas no mês', doMes.length], ['Lojas consumidas no mês', doMes.reduce((s, l) => s + l.cota_gasta, 0)],
    ['Vieram do cache', doMes.filter(l => l.do_cache).length], ['Com erro', doMes.filter(l => l.erro).length]]

  if (u && !admin) return <EstadoVazio icone={<ScrollText size={32} />} titulo="Sem acesso" texto="Os logs de busca são visíveis apenas para o administrador." />
  return (
    <div className="space-y-6">
      <PageHeader titulo="Logs de busca" sub="Histórico de todas as buscas de lojas feitas no painel (visível só para você)." icone={<ScrollText size={24} />}>
        {usuarios.length > 1 && <select className="rounded-xl bg-white/95 px-3 py-2 text-sm font-medium text-[#1e293b] focus:outline-none" value={quem} onChange={e => setQuem(e.target.value)}>
          <option value="">Todos os usuários</option>{usuarios.map(x => <option key={x} value={x}>{nomeDoEmail(x)}</option>)}</select>}
      </PageHeader>
      {erro && <p className="card border-red-200 bg-red-50 p-4 text-sm text-red-700">{erro}</p>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map(([n, v]) => <div key={n} className="card p-4"><p className="text-sm text-slate-500">{n}</p><p className="text-2xl font-bold">{v}</p></div>)}
      </div>
      {loading ? <p className="text-slate-500">Carregando…</p> : lista.length === 0 ? (
        <EstadoVazio icone={<ScrollText size={32} />} titulo="Nenhuma busca registrada" texto="As próximas buscas de lojas aparecem aqui." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500"><tr>
              {['Data', 'Usuário', 'Segmento', 'Local', 'Pedidas', 'Achadas', 'Sem site', 'Cota', 'Origem'].map(h => <th key={h} className="whitespace-nowrap p-3">{h}</th>)}</tr></thead>
            <tbody>
              {lista.map(l => (
                <tr key={l.id} className="border-t align-top">
                  <td className="whitespace-nowrap p-3">{new Date(l.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td className="p-3">{nomeDoEmail(l.usuario ?? '') || '—'}</td><td className="p-3">{l.segmento}</td><td className="p-3">{l.local}</td>
                  <td className="p-3">{l.qtd_pedida ?? '—'}</td><td className="p-3">{l.resultados ?? '—'}</td><td className="p-3">{l.sem_site ?? '—'}</td><td className="p-3">{l.cota_gasta}</td>
                  <td className="p-3">{l.erro ? <span className="text-rose-600" title={l.erro}>Erro: {l.erro}</span> : l.do_cache ? 'Cache' : 'API'}</td>
                </tr>))}
            </tbody>
          </table>
        </div>)}
    </div>
  )
}
