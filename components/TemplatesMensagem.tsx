'use client'
import { useMemo, useRef, useState } from 'react'
import { FileText, Pencil, Plus, Trash2 } from 'lucide-react'
import PageHeader from './PageHeader'
import ConfirmDialog from './ConfirmDialog'
import { useToast } from './Toast'
import { supabase } from '@/lib/supabase/client'
import { MESSAGES } from '@/lib/message-template'
import { SEGMENTOS } from '@/lib/segmentos'
import { STATUS, type Status } from '@/lib/types'
import { VARIAVEIS, aplicarVariaveis, type Template } from '@/lib/templates'
import { useTemplates } from '@/lib/useTemplates'
import { useUsuario } from '@/lib/useUsuario'

const STATUS_COM_MENSAGEM = Object.keys(MESSAGES) as Status[]
const vazio = { id: '', nome: '', status: 'novo' as Status, segmento: '', texto: '' }

export default function TemplatesMensagem() {
  const { templates, pronto, recarregar } = useTemplates(), usuario = useUsuario(), { toast, aviso } = useToast()
  const [f, setF] = useState<typeof vazio | null>(null), [apagar, setApagar] = useState<Template | null>(null), [busy, setBusy] = useState(false)
  const area = useRef<HTMLTextAreaElement>(null)

  const previa = useMemo(() => f ? aplicarVariaveis(f.texto, { nomeLoja: 'Padaria Central', seuNome: usuario.nome || 'Seu Nome', responsavel: 'Ana', cidade: 'Belo Horizonte' }) : '', [f, usuario])
  function inserir(v: string) {
    const el = area.current; if (!el || !f) return
    const a = el.selectionStart ?? f.texto.length, b = el.selectionEnd ?? a
    setF({ ...f, texto: f.texto.slice(0, a) + v + f.texto.slice(b) })
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + v.length, a + v.length) })
  }
  async function salvar(e: React.FormEvent) {
    e.preventDefault(); if (!f) return
    setBusy(true)
    const dados = { nome: f.nome.trim(), status: f.status, segmento: f.segmento || null, texto: f.texto.trim() }
    const { error } = f.id ? await supabase().from('templates').update(dados).eq('id', f.id) : await supabase().from('templates').insert(dados)
    setBusy(false)
    if (error) return toast(error.message.includes('templates') ? 'Erro: rode o arquivo supabase/melhorias.sql no Supabase.' : 'Erro ao salvar: ' + error.message, 'erro')
    toast('Template salvo', 'ok'); setF(null); recarregar()
  }
  async function excluir(t: Template) {
    const { error } = await supabase().from('templates').delete().eq('id', t.id)
    if (error) return toast('Erro ao excluir: ' + error.message, 'erro')
    toast('Template excluído', 'ok'); recarregar()
  }

  return (
    <div className="space-y-6">
      <PageHeader titulo="Mensagens" sub="Abordagens por etapa e por segmento, com variáveis." icone={<FileText size={24} />}>
        <button className="btn-w" onClick={() => setF({ ...vazio, texto: MESSAGES.novo! })}><Plus size={16} />Novo template</button>
      </PageHeader>
      <p className="text-sm text-slate-500">O sistema usa o template do <b>segmento do lead</b>; se não houver, o template geral da etapa; se também não houver, o texto padrão. Variáveis: {VARIAVEIS.map(v => <code key={v} className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs">{v}</code>)}</p>

      {!pronto ? <div className="skeleton h-40" /> : STATUS_COM_MENSAGEM.map(st => {
        const doStatus = templates.filter(t => t.status === st)
        return (
          <section key={st} className="card space-y-3 p-5">
            <div className="flex items-center justify-between"><h2 className="font-semibold">{STATUS[st]}</h2>
              <button className="btn !py-1.5 text-xs" onClick={() => setF({ ...vazio, status: st, texto: MESSAGES[st]! })}><Plus size={13} />Adicionar</button></div>
            {doStatus.length === 0 && <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500"><b>Texto padrão em uso:</b> {MESSAGES[st]}</p>}
            {doStatus.map(t => (
              <div key={t.id} className="space-y-2 rounded-xl border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{t.nome} <span className="lh-chip ml-1 bg-slate-100 text-slate-600">{t.segmento ? SEGMENTOS[t.segmento]?.nome ?? t.segmento : 'Todos os segmentos'}</span></p>
                  <div className="flex gap-1"><button className="btn !p-2" onClick={() => setF({ id: t.id, nome: t.nome, status: t.status, segmento: t.segmento ?? '', texto: t.texto })} aria-label="Editar"><Pencil size={14} /></button>
                    <button className="btn !p-2 text-red-600" onClick={() => setApagar(t)} aria-label="Excluir"><Trash2 size={14} /></button></div>
                </div>
                <p className="whitespace-pre-line text-sm text-slate-600">{t.texto}</p>
              </div>))}
          </section>) })}

      {f && (
        <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
          <form onSubmit={salvar} className="card my-4 w-full max-w-2xl space-y-3 p-5">
            <h2 className="text-lg font-semibold">{f.id ? 'Editar template' : 'Novo template'}</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-sm">Nome<input required className="inp mt-1" placeholder="Ex.: Barbearia – primeiro contato" value={f.nome} onChange={e => setF({ ...f, nome: e.target.value })} /></label>
              <label className="block text-sm">Etapa<select className="inp mt-1" value={f.status} onChange={e => setF({ ...f, status: e.target.value as Status })}>{STATUS_COM_MENSAGEM.map(s => <option key={s} value={s}>{STATUS[s]}</option>)}</select></label>
              <label className="block text-sm">Segmento<select className="inp mt-1" value={f.segmento} onChange={e => setF({ ...f, segmento: e.target.value })}><option value="">Todos</option>{Object.entries(SEGMENTOS).map(([k, v]) => <option key={k} value={k}>{v.nome}</option>)}</select></label>
            </div>
            <div className="flex flex-wrap gap-1.5">{VARIAVEIS.map(v => <button type="button" key={v} className="btn !px-2 !py-1 text-xs" onClick={() => inserir(v)}>{v}</button>)}</div>
            <textarea ref={area} required rows={6} className="inp" value={f.texto} onChange={e => setF({ ...f, texto: e.target.value })} aria-label="Texto do template" />
            <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600"><p className="mb-1 text-xs font-semibold uppercase text-slate-500">Prévia</p><p className="whitespace-pre-line">{previa || '—'}</p></div>
            <div className="flex justify-end gap-2"><button type="button" className="btn" onClick={() => setF(null)}>Cancelar</button><button className="btn-p" disabled={busy}>{busy ? 'Salvando…' : 'Salvar'}</button></div>
          </form>
        </div>)}
      {apagar && <ConfirmDialog titulo="Excluir template?" texto={`"${apagar.nome}" será removido. A etapa volta a usar outro template ou o texto padrão.`} onCancel={() => setApagar(null)} onConfirm={async () => { await excluir(apagar); setApagar(null) }} />}
      {aviso}
    </div>
  )
}
