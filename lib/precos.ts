// Preço de cada solução (guardado na tabela config, chave "precos_solucoes"). Só valores > 0 contam.
export type Precos = Record<string, number>
export const CHAVE_PRECOS = 'precos_solucoes'

export function lerPrecos(valor: unknown): Precos {
  const out: Precos = {}
  if (valor && typeof valor === 'object') for (const [k, x] of Object.entries(valor as Record<string, unknown>)) { const n = Number(x); if (n > 0) out[k] = n }
  return out
}

// Soma o preço das soluções marcadas no lead. 0 = não há preço configurado, então o painel pergunta o valor.
export const totalDaVenda = (l: { solucoes?: string[] | null }, p: Precos) => (l.solucoes || []).reduce((s, id) => s + (p[id] ?? 0), 0)
