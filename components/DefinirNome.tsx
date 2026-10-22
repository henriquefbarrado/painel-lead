'use client'
import { useState } from 'react'
import { Store, User } from 'lucide-react'

/** Tela obrigatória no primeiro login: grava o nome em user_metadata para usar nas mensagens. */
export default function DefinirNome({
  email,
  onSalvar,
}: {
  email: string
  onSalvar: (nome: string) => Promise<string | null>
}) {
  const [nome, setNome] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    const msg = await onSalvar(nome)
    if (msg) {
      setErro(msg)
      setLoading(false)
      return
    }
    // sucesso: o pai (Shell) tira esta tela porque precisaNome vira false
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0e17] p-4">
      <form onSubmit={enviar} className="relative w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-white p-8 shadow-2xl">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-indigo-600 text-white">
          <User size={26} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Como você se chama?</h1>
          <p className="mt-1 text-sm text-slate-500">
            Esse nome aparece nas mensagens do WhatsApp (ex.: “Aqui é o <b>João</b>…”).
          </p>
          {email && (
            <p className="mt-2 truncate text-xs text-slate-400">{email}</p>
          )}
        </div>
        <label className="block text-sm text-slate-600">
          Seu nome
          <input
            className="inp mt-1"
            type="text"
            placeholder="Ex.: João, Maria…"
            required
            autoFocus
            maxLength={40}
            value={nome}
            onChange={e => setNome(e.target.value)}
            autoComplete="name"
          />
        </label>
        {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erro}</p>}
        <button className="btn-p w-full !py-3" disabled={loading || !nome.trim()}>
          {loading ? 'Salvando…' : 'Continuar'}
        </button>
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
          <Store size={12} /> Painel de Leads
        </p>
      </form>
    </main>
  )
}
