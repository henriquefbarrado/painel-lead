// Fallback de nomes por e-mail (contas antigas). Novos usuários definem o nome no primeiro login
// e ele fica em user_metadata.nome no Supabase Auth.
export const NOMES: Record<string, string> = {
  'rick.fb4@gmail.com': 'Henrique',
  'richarddelim615@gmail.com': 'Richard',
}

// Administrador: único que enxerga a aba de logs de busca (a regra também existe no banco: supabase/logs-busca.sql)
export const ADMIN_EMAIL = 'rick.fb4@gmail.com'
export const ehAdmin = (email?: string | null) => (email ?? '').trim().toLowerCase() === ADMIN_EMAIL

/** Nome gravado no metadata do Auth, se existir. */
export function nomeDoMetadata(meta: Record<string, unknown> | null | undefined): string {
  if (!meta) return ''
  const n = meta.nome ?? meta.full_name ?? meta.name
  return typeof n === 'string' ? n.trim() : ''
}

/**
 * Resolve o nome para mensagens:
 * 1) user_metadata.nome (definido no primeiro login)
 * 2) mapa NOMES (contas antigas)
 * 3) parte antes do @ do e-mail
 */
export function nomeDoEmail(email: string, meta?: Record<string, unknown> | null) {
  const doMeta = nomeDoMetadata(meta)
  if (doMeta) return doMeta
  const e = email.trim().toLowerCase()
  if (NOMES[e]) return NOMES[e]
  const base = e.split('@')[0] || ''
  return base ? base[0].toUpperCase() + base.slice(1) : ''
}

/** Precisa pedir o nome se não tem no metadata e não está no mapa fixo. */
export function precisaDefinirNome(email: string, meta?: Record<string, unknown> | null) {
  if (nomeDoMetadata(meta)) return false
  const e = email.trim().toLowerCase()
  return !NOMES[e]
}
