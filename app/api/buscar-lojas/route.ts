import { NextResponse } from 'next/server'

// Redes sociais e links de contato não contam como "site".
const NAO_SITE = /(instagram|facebook|linktr\.ee|wa\.me|whatsapp|linkin\.bio|beacons\.ai)/i
const MASK = 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.location,places.googleMapsUri,nextPageToken'

export async function POST(req: Request) {
  const key = process.env.GOOGLE_MAPS_API_KEY
  if (!key) return NextResponse.json({ erro: 'Falta a GOOGLE_MAPS_API_KEY no .env.local (veja as instruções).' }, { status: 500 })
  const { segmento, local } = await req.json()
  if (!segmento || !local) return NextResponse.json({ erro: 'Informe o segmento e o local.' }, { status: 400 })
  const lojas: Record<string, unknown>[] = []
  let total = 0, token: string | undefined
  for (let i = 0; i < 3; i++) {
    const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': MASK },
      body: JSON.stringify({ textQuery: `${segmento} em ${local}`, languageCode: 'pt-BR', regionCode: 'BR', pageSize: 20, ...(token ? { pageToken: token } : {}) }),
    })
    const j = await r.json()
    if (!r.ok) return NextResponse.json({ erro: j.error?.message || 'Erro na API do Google' }, { status: 502 })
    for (const p of j.places || []) {
      total++
      if (p.websiteUri && !NAO_SITE.test(p.websiteUri)) continue
      lojas.push({ id: p.id, nome: p.displayName?.text, endereco: p.formattedAddress, telefone: p.nationalPhoneNumber || null,
        lat: p.location?.latitude ?? null, lng: p.location?.longitude ?? null, maps: p.googleMapsUri, social: p.websiteUri || null })
    }
    token = j.nextPageToken
    if (!token) break
  }
  return NextResponse.json({ total, lojas })
}
