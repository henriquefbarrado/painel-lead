'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Store } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function Login() {
  const [email, setEmail] = useState(''), [senha, setSenha] = useState('')
  const [erro, setErro] = useState(''), [loading, setLoading] = useState(false)
  const router = useRouter()
  async function entrar(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErro('')
    const { error } = await supabase().auth.signInWithPassword({ email, password: senha })
    if (error) { setErro(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message); setLoading(false); return }
    router.push('/'); router.refresh()
  }
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-600/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-fuchsia-600/30 blur-3xl" />
      <form onSubmit={entrar} className="relative w-full max-w-sm space-y-4 rounded-3xl bg-white p-8 shadow-2xl">
        <div className="logo-float mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-lg"><Store size={26} /></div>
        <div className="text-center"><h1 className="text-2xl font-bold tracking-tight">Painel de Leads</h1><p className="text-sm text-slate-500">Entre para continuar</p></div>
        <input className="inp" type="email" placeholder="E-mail" required value={email} onChange={e => setEmail(e.target.value)} />
        <input className="inp" type="password" placeholder="Senha" required value={senha} onChange={e => setSenha(e.target.value)} />
        {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erro}</p>}
        <button className="btn-p w-full !py-3" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
      </form>
    </main>
  )
}
