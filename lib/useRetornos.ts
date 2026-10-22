'use client'
import { useCallback, useEffect, useState } from 'react'
import { todosLeads } from './leads-api'
import { ativo, dataHoje, situacaoFollowUp } from './metricas'

export type ContagemRetornos = {
  atrasados: number
  deHoje: number
  /** atrasados + de hoje (leads vivos com retorno devido) */
  total: number
  carregando: boolean
  recarregar: () => void
}

/**
 * Conta leads ativos com próximo contato atrasado ou de hoje.
 * Usado no badge do menu e no lembrete do dashboard.
 */
export function useRetornos(): ContagemRetornos {
  const [atrasados, setAtrasados] = useState(0)
  const [deHoje, setDeHoje] = useState(0)
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    const { data } = await todosLeads()
    const hoje = dataHoje()
    let a = 0, h = 0
    for (const l of data) {
      if (!ativo(l.status)) continue
      const s = situacaoFollowUp(l.proximo_contato, hoje)
      if (s === 'atrasado') a++
      else if (s === 'hoje') h++
    }
    setAtrasados(a)
    setDeHoje(h)
    setCarregando(false)
  }, [])

  useEffect(() => {
    carregar()
    // Atualiza ao voltar para a aba (útil depois de reagendar na tela Hoje)
    const onFocus = () => { carregar() }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [carregar])

  return {
    atrasados,
    deHoje,
    total: atrasados + deHoje,
    carregando,
    recarregar: carregar,
  }
}
