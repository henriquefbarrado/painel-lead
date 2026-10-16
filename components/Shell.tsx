'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LogOut, Menu, Moon, Search, Store, Sun, Users, Wallet, X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useUsuario } from '@/lib/useUsuario'

const LINKS = [['/', 'Leads', Users], ['/buscar', 'Buscar lojas', Search], ['/financeiro', 'Financeiro', Wallet]] as const

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname(), router = useRouter()
  const [open, setOpen] = useState(false), [escuro, setEscuro] = useState(true)
  const u = useUsuario()
  useEffect(() => { setEscuro(document.documentElement.classList.contains('dark')) }, [])
  function tema() { const d = document.documentElement.classList.toggle('dark'); setEscuro(d); localStorage.setItem('tema', d ? 'escuro' : 'claro') }
  async function sair() { await supabase().auth.signOut(); router.push('/login'); router.refresh() }
  const marca = (
    <div className="flex items-center gap-3">
      <div className="relative">
        <span className="absolute inset-0 animate-ping rounded-xl bg-indigo-500/40 [animation-duration:2.6s]" />
        <div className="logo-float relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-lg shadow-indigo-900/40"><Store size={20} /></div>
      </div>
      <div className="leading-tight"><p className="font-bold text-white">Painel de Leads</p><p className="text-xs text-slate-400">Prospecção & vendas</p></div>
    </div>
  )
  return (
    <div className="min-h-screen md:flex">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-3 md:hidden">
        {marca}<button className="rounded-lg bg-white/10 p-2 text-white" onClick={() => setOpen(!open)}>{open ? <X size={18} /> : <Menu size={18} />}</button>
      </div>
      <aside className={`${open ? 'flex' : 'hidden'} flex-col bg-gradient-to-b from-slate-900 to-slate-950 p-4 text-slate-300 md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0`}>
        <div className="mb-8 hidden px-1 pt-2 md:block">{marca}</div>
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Menu</p>
        <nav className="space-y-1">
          {LINKS.map(([href, label, Icon]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${path === href ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-900/40' : 'hover:bg-white/10 hover:text-white'}`}>
              <Icon size={18} />{label}</Link>))}
        </nav>
        <div className="mt-auto space-y-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-400 to-fuchsia-400 text-sm font-bold text-white">{(u?.nome[0] || '?').toUpperCase()}</div>
            <div className="min-w-0 leading-tight"><p className="truncate text-sm font-medium text-white">{u?.nome ?? '…'}</p><p className="truncate text-[11px] text-slate-400">{u?.email}</p></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="flex items-center justify-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/10" onClick={tema}>{escuro ? <Sun size={15} /> : <Moon size={15} />}{escuro ? 'Claro' : 'Escuro'}</button>
            <button className="flex items-center justify-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/10" onClick={sair}><LogOut size={15} />Sair</button>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 space-y-6 p-4 md:p-8">{children}</main>
    </div>
  )
}
