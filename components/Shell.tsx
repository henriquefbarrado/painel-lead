'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { CalendarCheck, FileSpreadsheet, Kanban, LayoutDashboard, LogOut, Menu, Moon, ScrollText, PanelLeftClose, PanelLeftOpen, Search, Store, Sun, Users, Wallet, X, type LucideIcon } from 'lucide-react'
import CommandPalette from './CommandPalette'
import { supabase } from '@/lib/supabase/client'
import { useUsuario } from '@/lib/useUsuario'
import { ehAdmin } from '@/lib/usuarios'

const GRUPOS: { titulo: string; links: readonly (readonly [string, string, LucideIcon])[] }[] = [
  { titulo: '', links: [['/', 'Início', LayoutDashboard]] },
  { titulo: 'Vendas', links: [['/hoje', 'Hoje', CalendarCheck], ['/leads', 'Leads', Users], ['/pipeline', 'Pipeline', Kanban]] },
  { titulo: 'Captação', links: [['/buscar', 'Buscar lojas', Search], ['/importar', 'Importar', FileSpreadsheet]] },
  { titulo: 'Gestão', links: [['/financeiro', 'Financeiro', Wallet]] },
]
const LINKS = GRUPOS.flatMap(g => g.links)
const ABAS = LINKS.filter(([h]) => ['/', '/hoje', '/leads', '/pipeline'].includes(h))
const ativa = (path: string, href: string) => (href === '/' ? path === '/' : path === href || path.startsWith(href + '/'))
const NAV = 'bg-nav-bg'

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname(), router = useRouter()
  const [open, setOpen] = useState(false), [escuro, setEscuro] = useState(true), [compacto, setCompacto] = useState(false), [paleta, setPaleta] = useState(false)
  const u = useUsuario()
  const grupos = ehAdmin(u?.email) ? GRUPOS.map(g => g.titulo === 'Gestão' ? { ...g, links: [...g.links, ['/logs', 'Logs de busca', ScrollText] as const] } : g) : GRUPOS
  useEffect(() => { setEscuro(document.documentElement.classList.contains('dark')); try { setCompacto(localStorage.getItem('menu') === 'compacto') } catch {} }, [])
  const tema = useCallback(() => { const d = document.documentElement.classList.toggle('dark'); setEscuro(d); localStorage.setItem('tema', d ? 'escuro' : 'claro') }, [])
  function alternarMenu() { const c = !compacto; setCompacto(c); try { localStorage.setItem('menu', c ? 'compacto' : 'aberto') } catch {} }
  async function sair() { await supabase().auth.signOut(); router.push('/login'); router.refresh() }
  const alternarPaleta = useCallback(() => setPaleta(p => !p), [])
  const fecharPaleta = useCallback(() => setPaleta(false), [])
  const esc = compacto ? 'md:hidden' : ''   // some com o texto quando o menu está compacto

  const marca = (
    <div className="flex items-center gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-600 text-white"><Store size={18} /></div>
      <div className={`min-w-0 leading-tight ${esc}`}><p className="truncate whitespace-nowrap text-sm font-semibold text-nav-ink">Painel de Leads</p><p className="truncate whitespace-nowrap text-xs text-nav-ink3">Prospecção & vendas</p></div>
    </div>
  )
  return (
    <div className="min-h-screen md:flex">
      <div className={`flex items-center justify-between ${NAV} px-4 py-3 md:hidden`}>
        {marca}
        <div className="flex items-center gap-2">
          <button className="rounded-lg bg-nav-hover p-2 text-nav-ink" aria-label="Buscar" onClick={() => setPaleta(true)}><Search size={18} /></button>
          <button className="rounded-lg bg-nav-hover p-2 text-nav-ink" aria-label="Menu" onClick={() => setOpen(!open)}>{open ? <X size={18} /> : <Menu size={18} />}</button>
        </div>
      </div>
      <div className={`${open ? 'block' : 'hidden'} relative md:sticky md:top-0 md:z-20 md:block md:h-screen md:shrink-0 md:transition-[width] md:duration-200 ${compacto ? 'md:w-[72px]' : 'md:w-60'}`}>
        <aside className={`flex h-full flex-col ${NAV} p-3 text-nav-ink2 md:border-r md:border-nav-line`}>
          <div className={`mb-3 hidden shrink-0 px-1 pt-1 md:block ${compacto ? 'md:flex md:justify-center' : ''}`}>{marca}</div>
          <button onClick={() => { setPaleta(true); setOpen(false) }} title="Buscar (Ctrl+K)"
            className={`mb-2.5 flex w-full shrink-0 items-center gap-2 rounded-lg border border-nav-line bg-nav-field px-3 py-2 text-sm text-nav-ink2 transition hover:bg-nav-hover hover:text-nav-ink ${compacto ? 'md:justify-center md:px-0' : ''}`}>
            <Search size={15} className="shrink-0" /><span className={`flex-1 text-left ${esc}`}>Buscar…</span><span className={`rounded border border-nav-line-strong px-1 text-[10px] ${esc}`}>Ctrl K</span>
          </button>
          <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {grupos.map(g => (
              <div key={g.titulo || 'topo'} className="space-y-0.5">
                {g.titulo && <p className={`mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-nav-ink4 ${esc}`}>{g.titulo}</p>}
                {g.links.map(([href, label, Icon]) => {
                  const on = ativa(path, href)
                  return (
                    <Link key={href} href={href} title={label} onClick={() => setOpen(false)} aria-current={on ? 'page' : undefined}
                      className={`relative flex items-center gap-3 rounded-lg px-3 py-[7px] text-sm font-medium transition-colors ${compacto ? 'md:justify-center md:px-0' : ''} ${on ? 'bg-nav-active text-nav-ink' : 'hover:bg-nav-field hover:text-nav-ink'}`}>
                      {on && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-nav-accent" />}
                      <Icon size={18} className="shrink-0" /><span className={esc}>{label}</span></Link>)
                })}
              </div>))}
          </nav>
          <div className={`mt-3 shrink-0 space-y-2 rounded-xl bg-nav-field p-2.5 ring-1 ring-nav-line ${compacto ? 'md:mt-2 md:space-y-0.5 md:rounded-none md:border-t md:border-nav-line md:bg-transparent md:p-0 md:pt-2 md:ring-0' : ''}`}>
            <div className={`flex items-center gap-2.5 ${compacto ? 'md:justify-center' : ''}`}>
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-nav-avatar text-sm font-semibold text-nav-avatar-ink">{(u?.nome[0] || '?').toUpperCase()}</div>
              <div className={`min-w-0 leading-tight ${esc}`}><p className="truncate text-sm font-medium text-nav-ink">{u?.nome ?? '…'}</p><p className="truncate text-[11px] text-nav-ink3">{u?.email}</p></div>
            </div>
            <div className={`grid gap-1.5 ${compacto ? 'md:grid-cols-1 md:gap-0.5' : 'grid-cols-2'}`}>
              <button className={`flex h-9 items-center justify-center gap-2 rounded-lg bg-nav-field text-sm text-nav-ink2 transition hover:bg-nav-hover hover:text-nav-ink ${compacto ? 'md:h-8 md:bg-transparent md:text-nav-ink2' : ''}`} onClick={tema} title={escuro ? 'Tema claro' : 'Tema escuro'} aria-label={escuro ? 'Tema claro' : 'Tema escuro'}>{escuro ? <Sun size={17} className="shrink-0" /> : <Moon size={17} className="shrink-0" />}<span className={esc}>{escuro ? 'Claro' : 'Escuro'}</span></button>
              <button className={`flex h-9 items-center justify-center gap-2 rounded-lg bg-nav-field text-sm text-nav-ink2 transition hover:bg-nav-hover hover:text-nav-ink ${compacto ? 'md:h-8 md:bg-transparent md:text-nav-ink2' : ''}`} onClick={sair} title="Sair" aria-label="Sair"><LogOut size={17} className="shrink-0" /><span className={esc}>Sair</span></button>
            </div>
          </div>
        </aside>
        <button onClick={alternarMenu} aria-label={compacto ? 'Expandir menu' : 'Recolher menu'} title={compacto ? 'Expandir menu' : 'Recolher menu'}
          className="absolute -right-3 top-6 z-10 hidden h-6 w-6 place-items-center rounded-full border border-nav-line-strong bg-nav-pill text-nav-ink2 shadow-md transition hover:bg-indigo-600 hover:text-white md:grid">{compacto ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}</button>
      </div>
      <main className={`min-w-0 flex-1 p-4 pb-24 md:p-8 ${path === '/pipeline' ? 'overflow-hidden md:h-screen md:overflow-hidden' : ''}`}>
        <div className={`mx-auto w-full max-w-[1400px] ${path === '/pipeline' ? 'h-full' : 'space-y-6'}`}>{children}</div>
      </main>
      <nav aria-label="Navegação principal" className={`fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-nav-line bg-nav-blur pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden`}>
        {ABAS.map(([href, label, Icon]) => (
          <Link key={href} href={href} onClick={() => setOpen(false)} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${ativa(path, href) ? 'text-nav-accent-ink' : 'text-nav-ink3'}`}><Icon size={20} />{label}</Link>))}
        <button onClick={() => setOpen(!open)} className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-nav-ink3"><Menu size={20} />Mais</button>
      </nav>
      <CommandPalette aberto={paleta} onAlternar={alternarPaleta} onFechar={fecharPaleta} paginas={grupos.flatMap(g => g.links)} escuro={escuro} onTema={tema} />
    </div>
  )
}
