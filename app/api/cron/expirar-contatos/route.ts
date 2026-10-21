import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { expirarContatosSemRespostaCom, HORAS_SEM_RESPOSTA } from '@/lib/expirar-contatos'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Cron automático: leads em "Contato realizado" há +48h → "Sem interesse" / "Não respondeu".
 *
 * Protegido por CRON_SECRET (header Authorization: Bearer … ou ?secret=…).
 * Vercel Cron envia Authorization: Bearer <CRON_SECRET> quando configurado.
 *
 * Manual: curl -H "Authorization: Bearer $CRON_SECRET" https://seu-app.vercel.app/api/cron/expirar-contatos
 */
function autorizado(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.get('authorization') || ''
  if (auth === `Bearer ${secret}`) return true
  // Fallback para teste manual com ?secret=
  if (req.nextUrl.searchParams.get('secret') === secret) return true
  return false
}

async function rodar(req: NextRequest) {
  if (!autorizado(req)) {
    return NextResponse.json({ ok: false, erro: 'Não autorizado' }, { status: 401 })
  }
  try {
    const resultado = await expirarContatosSemRespostaCom(supabaseAdmin())
    if (resultado.erro) {
      return NextResponse.json({ ok: false, ...resultado, horas: HORAS_SEM_RESPOSTA }, { status: 500 })
    }
    return NextResponse.json({
      ok: true,
      movidos: resultado.movidos,
      horas: HORAS_SEM_RESPOSTA,
      em: new Date().toISOString(),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, erro: msg }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return rodar(req)
}

export async function POST(req: NextRequest) {
  return rodar(req)
}
