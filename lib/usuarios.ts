// Nome usado nas mensagens, de acordo com o e-mail do login.
// Para adicionar alguém, inclua uma linha aqui (e-mail em minúsculas).
export const NOMES: Record<string, string> = {
  'rick.fb4@gmail.com': 'Henrique',
  'richarddelim615@gmail.com': 'Richard',
}

// Administrador: único que enxerga a aba de logs de busca (a regra também existe no banco: supabase/logs-busca.sql)
export const ADMIN_EMAIL = 'rick.fb4@gmail.com'
export const ehAdmin = (email?: string | null) => (email ?? '').trim().toLowerCase() === ADMIN_EMAIL

export function nomeDoEmail(email: string) {
  const e = email.trim().toLowerCase()
  if (NOMES[e]) return NOMES[e]
  const base = e.split('@')[0] || ''
  return base ? base[0].toUpperCase() + base.slice(1) : ''
}
