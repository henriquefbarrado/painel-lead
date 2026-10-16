'use client'
import { useState } from 'react'
import { STATUS, type Lead, type LeadInput, type Status } from '@/lib/types'

const vazio: LeadInput = { nome_loja: '', responsavel: '', whatsapp: '', endereco: '', cidade: '', estado: '',
  cep: '', latitude: null, longitude: null, categoria: '', status: 'novo', observacoes: '' }

export default function LeadForm({ lead, onSave, onCancel }: {
  lead: Lead | null; onSave: (d: LeadInput) => Promise<void>; onCancel: () => void }) {
  const [f, setF] = useState<LeadInput>(lead ? { ...vazio, ...lead } : vazio)
  const [busy, setBusy] = useState(false)
  const set = (k: keyof LeadInput, v: string) => setF(p => ({ ...p, [k]: v }))
  const num = (v: string) => (v.trim() === '' ? null : Number(v.replace(',', '.')))
  const t = (k: keyof LeadInput, label: string, ph = '') => (
    <label className="block text-sm">{label}
      <input className="inp mt-1" placeholder={ph} value={(f[k] as string) ?? ''} onChange={e => set(k, e.target.value)} />
    </label>)
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true)
    const clean = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v === '' ? null : v])) as unknown as LeadInput
    clean.nome_loja = f.nome_loja
    await onSave(clean); setBusy(false)
  }
  return (
    <div className="fixed inset-0 z-20 flex items-start justify-center overflow-y-auto bg-slate-900/50 backdrop-blur-sm p-4">
      <form onSubmit={submit} className="w-full max-w-2xl space-y-3 rounded-2xl bg-white p-5 shadow-2xl">
        <h2 className="text-lg font-semibold">{lead ? 'Editar lead' : 'Novo lead'}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">Nome da loja *
            <input required className="inp mt-1" value={f.nome_loja} onChange={e => set('nome_loja', e.target.value)} /></label>
          {t('responsavel', 'Responsável')}
          {t('whatsapp', 'WhatsApp', '(31) 99999-9999')}
          {t('categoria', 'Categoria / segmento')}
          {t('endereco', 'Endereço')}
          {t('cep', 'CEP')}
          {t('cidade', 'Cidade')}
          {t('estado', 'Estado (UF)')}
          <details className="rounded-xl border border-slate-200 p-3 text-sm sm:col-span-2"><summary className="cursor-pointer text-slate-500">Coordenadas (opcional, só para o filtro de distância)</summary><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="block text-sm">Latitude
            <input className="inp mt-1" placeholder="-19.9167" value={f.latitude ?? ''} onChange={e => setF(p => ({ ...p, latitude: num(e.target.value) }))} /></label>
          <label className="block text-sm">Longitude
            <input className="inp mt-1" placeholder="-43.9345" value={f.longitude ?? ''} onChange={e => setF(p => ({ ...p, longitude: num(e.target.value) }))} /></label></div></details>
          <label className="block text-sm">Status
            <select className="inp mt-1" value={f.status} onChange={e => set('status', e.target.value as Status)}>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        </div>
        <label className="block text-sm">Observações
          <textarea className="inp mt-1" rows={3} value={f.observacoes ?? ''} onChange={e => set('observacoes', e.target.value)} /></label>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
          <button className="btn-p" disabled={busy}>{busy ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </form>
    </div>
  )
}
