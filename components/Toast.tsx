'use client'
import { useCallback, useRef, useState } from 'react'

// Aviso curto de sucesso/erro. Uso: const { toast, aviso } = useToast(); toast('Salvo', 'ok'); ... {aviso}
export function useToast() {
  const [t, setT] = useState<{ msg: string; tipo: 'ok' | 'erro' } | null>(null), timer = useRef<ReturnType<typeof setTimeout>>()
  const toast = useCallback((msg: string, tipo?: 'ok' | 'erro') => {
    clearTimeout(timer.current)
    setT({ msg, tipo: tipo ?? (/^erro|falha|inválid|não foi/i.test(msg) ? 'erro' : 'ok') })
    timer.current = setTimeout(() => setT(null), 3500)
  }, [])
  const aviso = t && (
    <div role="status" aria-live="polite" className={`fixed bottom-20 left-1/2 z-[60] max-w-[92vw] -translate-x-1/2 rounded-xl px-4 py-2 text-sm font-medium text-white shadow-lg md:bottom-4 ${t.tipo === 'erro' ? 'bg-rose-600' : 'bg-slate-900'}`}>{t.msg}</div>)
  return { toast, aviso }
}
