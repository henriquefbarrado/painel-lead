import { NextResponse } from 'next/server'

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

export async function POST(req: Request) {
  const ow = process.env.OPENWEBNINJA_API_KEY, google = process.env.GOOGLE_MAPS_API_KEY
  if (!ow && !google) return NextResponse.json({ erro: 'Falta a chave da busca no .env.local: OPENWEBNINJA_API_KEY (grátis) ou GOOGLE_MAPS_API_KEY.' }, { status: 500 })
  const { segmento, local, quantidade } = await req.json()
  if (!segmento || !local) return NextResponse.json({ erro: 'Informe o segmento e o local.' }, { status: 400 })
  const qtd = Math.min(60, Math.max(5, Number(quantidade) || 20)) // limite para proteger a cota
  const res = ow ? await viaOpenWebNinja(ow, segmento, local, qtd) : await viaGoogle(google!, segmento, local)
  if ('erro' in res) return NextResponse.json(res, { status: 502 })
  return NextResponse.json(res)
}
