'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CornerDownLeft, Moon, Search, Sun, User, type LucideIcon } from 'lucide-react'
import { todosLeads } from '@/lib/leads-api'
import { STATUS, type Lead } from '@/lib/types'

type Item = { id: string; grupo: string; rotulo: string; sub?: string; Icone: LucideIcon; executar: () => void }
const sem = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

// Busca rápida (Ctrl+K / ⌘K): ir para uma página, trocar o tema ou abrir a ficha de um lead.
export default function CommandPalette({ aberto, onAlternar, onFechar, paginas, escuro, onTema }: {
  aberto: boolean; onAlternar: () => void; onFechar: () => void
  paginas: ReadonlyArray<readonly [string, string, LucideIcon]>; escuro: boolean; onTema: () => void
}) {
  const router = useRouter()
  const [q, setQ] = useState(''), [idx, setIdx] = useState(0), [leads, setLeads] = useState<Lead[]>([])
  const carregou = useRef(false), input = useRef<HTMLInputElement>(null), lista = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); onAlternar() }
      else if (e.key === 'Escape' && aberto) onFechar()
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [aberto, onAlternar, onFechar])

  useEffect(() => {
    if (!aberto) return
    setQ(''); setIdx(0); setTimeout(() => input.current?.focus(), 0)
    if (!carregou.current) { carregou.current = true; todosLeads().then(r => setLeads(r.data || [])) }
  }, [aberto])

  const itens = useMemo<Item[]>(() => {
    const t = sem(q.trim()), digitos = q.replace(/\D/g, '')
    const ir = (href: string) => () => { onFechar(); router.push(href) }
    const paginasF: Item[] = paginas.filter(([, nome]) => !t || sem(nome).includes(t))
      .map(([href, nome, Icone]) => ({ id: 'p' + href, grupo: 'Ir para', rotulo: nome, Icone, executar: ir(href) }))
    const acoes: Item[] = !t || sem('alternar tema claro escuro').includes(t) || 'tema'.startsWith(t)
      ? [{ id: 'tema', grupo: 'Ações', rotulo: escuro ? 'Mudar para o tema claro' : 'Mudar para o tema escuro', Icone: escuro ? Sun : Moon, executar: () => { onTema(); onFechar() } }] : []
    const achados: Item[] = t ? leads.filter(l => sem(l.nome_loja).includes(t) || sem(l.cidade || '').includes(t) || (digitos.length >= 3 && (l.whatsapp || '').replace(/\D/g, '').includes(digitos)))
      .slice(0, 8).map(l => ({ id: 'l' + l.id, grupo: 'Leads', rotulo: l.nome_loja, sub: [STATUS[l.status], l.cidade].filter(Boolean).join(' · '), Icone: User, executar: ir(`/leads/${l.id}`) })) : []
    return [...achados, ...paginasF, ...acoes]
  }, [q, leads, paginas, escuro, onTema, onFechar, router])

  useEffect(() => { setIdx(0) }, [q])
  useEffect(() => { lista.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }) }, [idx])

  function teclas(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, itens.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); itens[idx]?.executar() }
  }
  if (!aberto) return null
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-slate-950/60 p-4 pt-[12vh] backdrop-blur-sm" onMouseDown={onFechar}>
      <div role="dialog" aria-modal="true" aria-label="Busca rápida" className="dialog-pop card w-full max-w-lg overflow-hidden shadow-2xl" onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-slate-200 px-4">
          <Search size={16} className="shrink-0 text-slate-400" />
          <input ref={input} value={q} onChange={e => setQ(e.target.value)} onKeyDown={teclas} placeholder="Buscar lead, página ou ação…" aria-label="Buscar"
            className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-slate-500" />
          <span className="kbd">Esc</span>
        </div>
        <div ref={lista} className="max-h-80 overflow-y-auto p-2" role="listbox">
          {itens.length === 0 && <p className="px-3 py-8 text-center text-sm text-slate-500">Nada encontrado para “{q}”.</p>}
          {itens.map((it, i) => (
            <div key={it.id}>
              {(i === 0 || itens[i - 1].grupo !== it.grupo) && <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{it.grupo}</p>}
              <button role="option" aria-selected={i === idx} onMouseMove={() => setIdx(i)} onClick={it.executar}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${i === idx ? 'bg-indigo-500/10 text-indigo-600' : 'text-slate-700'}`}>
                <it.Icone size={16} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate">{it.rotulo}{it.sub && <span className="ml-2 text-xs text-slate-500">{it.sub}</span>}</span>
                {i === idx && <CornerDownLeft size={14} className="shrink-0 opacity-60" />}
              </button>
            </div>))}
        </div>
        <div className="flex items-center gap-3 border-t border-slate-200 px-4 py-2 text-[11px] text-slate-500">
          <span className="flex items-center gap-1"><span className="kbd">↑</span><span className="kbd">↓</span>navegar</span>
          <span className="flex items-center gap-1"><span className="kbd">↵</span>abrir</span>
        </div>
      </div>
    </div>
  )
}
