import { NextResponse } from 'next/server'
import { supabaseServidor } from '@/lib/supabase/server'
import { BUSCAS_POR_MINUTO, CACHE_HORAS, LIMITE_MES, chaveBusca, inicioDoMesUtc } from '@/lib/cota'

// Redes sociais e links de contato não contam como "site".
const NAO_SITE = /(instagram|facebook|linktr\.ee|wa\.me|whatsapp|linkin\.bio|beacons\.ai)/i
type Loja = { id: string; nome: string; endereco: string; telefone: string | null; lat: number | null; lng: number | null; maps: string | null; social: string | null }
type Resultado = { erro: string } | { total: number; lojas: Loja[] }

// Provedor 1: OpenWeb Ninja (plano grátis, sem cartão). Cobra por loja retornada.
async function viaOpenWebNinja(key: string, segmento: string, local: string, qtd: number): Promise<Resultado> {
  const url = new URL('https://api.openwebninja.com/local-business-data/search')
  url.search = new URLSearchParams({ query: `${segmento} em ${local}`, limit: String(qtd), language: 'pt', region: 'br' }).toString()
  const r = await fetch(url, { headers: { 'x-api-key': key } })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) {
    const msg = r.status === 401 || r.status === 403 ? 'Chave do OpenWeb Ninja inválida.' : r.status === 429 ? 'Limite do plano grátis atingido.' : `Erro ${r.status} no OpenWeb Ninja`
    return { erro: j.error?.message || j.message || msg }
  }
  const lojas: Loja[] = []
  const lista = j.data || []
  for (const p of lista) {
    if (p.website && !NAO_SITE.test(p.website)) continue
    lojas.push({ id: p.place_id || p.business_id || p.name, nome: p.name, endereco: p.full_address || '', telefone: p.phone_number || null,
      lat: p.latitude ?? null, lng: p.longitude ?? null,
      maps: p.place_id ? `https://www.google.com/maps/place/?q=place_id:${p.place_id}` : null, social: p.website || null })
  }
  return { total: lista.length, lojas }
}

// Provedor 2: Google Places (New). Exige faturamento ativo no Google Cloud.
async function viaGoogle(key: string, segmento: string, local: string): Promise<Resultado> {
  const mask = 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.location,places.googleMapsUri,nextPageToken'
  const lojas: Loja[] = []
  let total = 0, token: string | undefined
  for (let i = 0; i < 3; i++) {
    const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': mask },
      body: JSON.stringify({ textQuery: `${segmento} em ${local}`, languageCode: 'pt-BR', regionCode: 'BR', pageSize: 20, ...(token ? { pageToken: token } : {}) }),
    })
    const j = await r.json()
    if (!r.ok) return { erro: j.error?.message || 'Erro na API do Google' }
    for (const p of j.places || []) {
      total++
      if (p.websiteUri && !NAO_SITE.test(p.websiteUri)) continue
      lojas.push({ id: p.id, nome: p.displayName?.text, endereco: p.formattedAddress, telefone: p.nationalPhoneNumber || null,
        lat: p.location?.latitude ?? null, lng: p.location?.longitude ?? null, maps: p.googleMapsUri || null, social: p.websiteUri || null })
    }
    token = j.nextPageToken
    if (!token) break
  }
  return { total, lojas }
}

// Quanto da cota do mês já foi usado (soma de todos os usuários, porque a chave da API é uma só).
async function usoDoMes(db: ReturnType<typeof supabaseServidor>) {
  const { data, error } = await db.from('buscas').select('qtd').gte('created_at', inicioDoMesUtc())
  if (error) return { usado: 0, ok: false }
  return { usado: (data || []).reduce((s, r) => s + (r.qtd as number), 0), ok: true }
}

type LogBusca = { segmento: string; local: string; qtd_pedida: number; resultados?: number | null; sem_site?: number | null; cota_gasta?: number; do_cache?: boolean; erro?: string }
// Registra a busca em logs_busca (só o administrador consegue ler). Falha de log nunca derruba a busca.
async function registrarLog(db: ReturnType<typeof supabaseServidor>, email: string | undefined, l: LogBusca) {
  try { await db.from('logs_busca').insert({ usuario: email ?? null, ...l }) } catch {}
}

// GET: devolve o consumo do mês para o contador da tela.
export async function GET() {
  const db = supabaseServidor()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ erro: 'Faça login novamente.' }, { status: 401 })
  const { usado, ok } = await usoDoMes(db)
  return NextResponse.json({ usado, limite: LIMITE_MES, medido: ok, provedor: process.env.OPENWEBNINJA_API_KEY ? 'openwebninja' : 'google' })
}

export async function POST(req: Request) {
  const db = supabaseServidor()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ erro: 'Faça login novamente.' }, { status: 401 })

  const ow = process.env.OPENWEBNINJA_API_KEY, google = process.env.GOOGLE_MAPS_API_KEY
  if (!ow && !google) return NextResponse.json({ erro: 'Falta a chave da busca no .env.local: OPENWEBNINJA_API_KEY (grátis) ou GOOGLE_MAPS_API_KEY.' }, { status: 500 })
  const corpo = await req.json().catch(() => ({}))
  const segmento = String(corpo.segmento || '').trim().slice(0, 80), local = String(corpo.local || '').trim().slice(0, 120)
  if (!segmento || !local) return NextResponse.json({ erro: 'Informe o segmento e o local.' }, { status: 400 })
  const qtd = Math.min(60, Math.max(5, Number(corpo.quantidade) || 20)) // limite para proteger a cota
  const chave = chaveBusca(segmento, local, qtd)
  const { usado } = await usoDoMes(db)

  // 1) Cache: a mesma consulta nas últimas 24 h não gasta cota.
  const desde = new Date(Date.now() - CACHE_HORAS * 3600_000).toISOString()
  const { data: emCache } = await db.from('busca_cache').select('resultado,created_at').eq('chave', chave).gte('created_at', desde).maybeSingle()
  if (emCache) {
    await db.from('buscas').insert({ consulta: chave, qtd: 0, do_cache: true })
    const rc = emCache.resultado as { total?: number; lojas?: unknown[] }
    await registrarLog(db, user.email, { segmento, local, qtd_pedida: qtd, resultados: rc.total ?? null, sem_site: rc.lojas?.length ?? null, cota_gasta: 0, do_cache: true })
    return NextResponse.json({ ...(emCache.resultado as object), cache: true, cacheEm: emCache.created_at, usado, limite: LIMITE_MES })
  }

  // 2) Limite de frequência (evita clique repetido queimando a cota).
  const { count } = await db.from('buscas').select('id', { count: 'exact', head: true })
    .eq('user_id', user.id).eq('do_cache', false).gte('created_at', new Date(Date.now() - 60_000).toISOString())
  if ((count ?? 0) >= BUSCAS_POR_MINUTO) { await registrarLog(db, user.email, { segmento, local, qtd_pedida: qtd, erro: 'Limite de buscas por minuto' }); return NextResponse.json({ erro: 'Muitas buscas em sequência. Aguarde um minuto e tente de novo.' }, { status: 429 }) }

  // 3) Cota mensal do plano grátis.
  if (ow && usado + qtd > LIMITE_MES) {
    const resta = Math.max(0, LIMITE_MES - usado)
    await registrarLog(db, user.email, { segmento, local, qtd_pedida: qtd, erro: `Cota insuficiente (restam ${resta})` })
    return NextResponse.json({ erro: `Sua cota do mês não comporta ${qtd} lojas (restam ${resta} de ${LIMITE_MES}). Escolha uma quantidade menor.`, usado, limite: LIMITE_MES }, { status: 429 })
  }

  const res = ow ? await viaOpenWebNinja(ow, segmento, local, qtd) : await viaGoogle(google!, segmento, local)
  if ('erro' in res) { await registrarLog(db, user.email, { segmento, local, qtd_pedida: qtd, erro: res.erro }); return NextResponse.json(res, { status: 502 }) }
  await db.from('buscas').insert({ consulta: chave, qtd: res.total, do_cache: false })
  await registrarLog(db, user.email, { segmento, local, qtd_pedida: qtd, resultados: res.total, sem_site: res.lojas.length, cota_gasta: res.total, do_cache: false })
  await db.from('busca_cache').upsert({ chave, resultado: res, created_at: new Date().toISOString() })
  return NextResponse.json({ ...res, cache: false, usado: usado + res.total, limite: LIMITE_MES })
}
