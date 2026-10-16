'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Mail, MapPin, MessageCircle, Phone, StickyNote, Trash2, Users, X } from 'lucide-react'
import ConfirmDialog from './ConfirmDialog'
import { supabase } from '@/lib/supabase/client'
import { useUsuario } from '@/lib/useUsuario'
import { TIPOS_CONTATO, type Contato, type TipoContato } from '@/lib/contatos'
import { STATUS, STATUS_COR, type Lead } from '@/lib/types'

const ICONES: Record<TipoContato, typeof Phone> = {
  whatsapp: MessageCircle, ligacao: Phone, email: Mail, visita: MapPin, reuniao: Users, outro: StickyNote,
}
const agoraLocal = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16) }
const fmt = (iso: string) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export default function HistoricoContato({ lead, onClose }: { lead: Pick<Lead, 'id' | 'nome_loja' | 'status'>; onClose: () => void }) {
  const usuario = useUsuario()
  const [meuId, setMeuId] = useState(''), [itens, setItens] = useState<Contato[]>([]), [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(''), [aviso, setAviso] = useState(''), [soMeus, setSoMeus] = useState(false)
  const [tipo, setTipo] = useState<TipoContato>('whatsapp'), [quando, setQuando] = useState(agoraLocal()), [nota, setNota] = useState('')
  const [salvando, setSalvando] = useState(false), [apagar, setApagar] = useState<Contato | null>(null)

  const carregar = useCallback(async () => {
    const { data, error } = await supabase().from('contatos').select('*').eq('lead_id', lead.id).order('contatado_em', { ascending: false })
    setErro(error ? (error.message.includes('contatos') ? 'A tabela "contatos" ainda não existe. Rode o arquivo supabase/contatos.sql no Supabase.' : error.message) : '')
    setItens((data as Contato[]) || []); setLoading(false)
  }, [lead.id])

  useEffect(() => { carregar() }, [carregar])
  useEffect(() => { supabase().auth.getUser().then(({ data }) => setMeuId(data.user?.id ?? '')) }, [])
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && !apagar) onClose() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose, apagar])

  const toast = (m: string) => { setAviso(m); setTimeout(() => setAviso(''), 2500) }
  const porPessoa = useMemo(() => {
    const m = new Map<string, number>()
    itens.forEach(c => m.set(c.user_nome, (m.get(c.user_nome) || 0) + 1))
    return Array.from(m.entries())
  }, [itens])
  const visiveis = soMeus ? itens.filter(c => c.user_id === meuId) : itens

  async function registrar(e: React.FormEvent) {
    e.preventDefault()
    if (!usuario) return
    setSalvando(true)
    const { error } = await supabase().from('contatos').insert({
      lead_id: lead.id, user_nome: usuario.nome, user_email: usuario.email, tipo,
      nota: nota.trim() || null, contatado_em: new Date(quando).toISOString(),
    })
    setSalvando(false)
    if (error) return toast('Erro ao registrar: ' + error.message)
    setNota(''); setQuando(agoraLocal()); toast('Contato registrado'); carregar()
  }
  async function excluir(c: Contato) {
    const { error } = await supabase().from('contatos').delete().eq('id', c.id)
    if (error) return toast('Erro ao excluir: ' + error.message)
    toast('Registro excluído'); carregar()
  }

  return (
    <>
      <div className="lh-fundo" onClick={onClose} />
      <aside className="lh-gaveta" role="dialog" aria-label={`Histórico de contato de ${lead.nome_loja}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold">{lead.nome_loja}</h2>
            <span className={`lh-chip mt-1 ${STATUS_COR[lead.status]}`}>{STATUS[lead.status]}</span>
          </div>
          <button className="btn !p-2" onClick={onClose} aria-label="Fechar"><X size={16} /></button>
        </div>

        <form onSubmit={registrar} className="card space-y-3 p-4">
          <p className="text-sm font-semibold">Registrar contato{usuario ? ` como ${usuario.nome}` : ''}</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">Tipo
              <select className="inp mt-1" value={tipo} onChange={e => setTipo(e.target.value as TipoContato)}>
                {Object.entries(TIPOS_CONTATO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label className="block text-sm">Data e hora
              <input type="datetime-local" required className="inp mt-1" value={quando} onChange={e => setQuando(e.target.value)} /></label>
          </div>
          <label className="block text-sm">Anotação
            <textarea className="inp mt-1" rows={3} placeholder="O que foi conversado, próximo passo…" value={nota} onChange={e => setNota(e.target.value)} /></label>
          <button className="btn-p w-full" disabled={salvando || !usuario}>{salvando ? 'Salvando…' : 'Registrar contato'}</button>
        </form>

        {erro && <p className="card border-red-200 bg-red-50 p-3 text-sm text-red-700">{erro}</p>}

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">Histórico ({visiveis.length})</h3>
            <div className="flex gap-1.5">
              <button type="button" className={soMeus ? 'btn' : 'btn-p'} onClick={() => setSoMeus(false)}>Todos</button>
              <button type="button" className={soMeus ? 'btn-p' : 'btn'} onClick={() => setSoMeus(true)}>Só meus</button>
            </div>
          </div>
          {porPessoa.length > 0 && (
            <div className="flex flex-wrap gap-1.5">{porPessoa.map(([n, q]) => <span key={n} className="lh-chip bg-indigo-100 text-indigo-700">{n}: {q}</span>)}</div>)}
          {loading ? <p className="text-sm text-slate-500">Carregando…</p> : visiveis.length === 0 ? (
            <p className="text-sm text-slate-500">{soMeus ? 'Você ainda não registrou contato com este lead.' : 'Nenhum contato registrado ainda. Use o formulário acima para o primeiro.'}</p>
          ) : (
            <ul className="lh-linha-tempo">
              {visiveis.map(c => { const I = ICONES[c.tipo] ?? StickyNote; return (
                <li key={c.id} className="lh-evento">
                  <div className="flex items-start justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-sm font-semibold"><I size={14} />{TIPOS_CONTATO[c.tipo] ?? c.tipo}</p>
                    {c.user_id === meuId && <button className="text-slate-400 hover:text-rose-600" onClick={() => setApagar(c)} aria-label="Excluir registro"><Trash2 size={14} /></button>}
                  </div>
                  <p className="text-xs text-slate-500">{fmt(c.contatado_em)} · por {c.user_nome}</p>
                  {c.nota && <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{c.nota}</p>}
                </li>) })}
            </ul>)}
        </div>
        {aviso && <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2 text-sm text-white">{aviso}</div>}
      </aside>
      {apagar && <ConfirmDialog titulo="Excluir registro?" texto="Este registro de contato será removido do histórico." onCancel={() => setApagar(null)}
        onConfirm={async () => { await excluir(apagar); setApagar(null) }} />}
    </>
  )
}
