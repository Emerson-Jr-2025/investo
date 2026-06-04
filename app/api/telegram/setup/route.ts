import { NextRequest, NextResponse } from 'next/server'
import { setWebhook } from '@/lib/telegram'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/jwt'

export async function GET(req: NextRequest) {
  // Exige sessão ativa (só o dono pode ativar)
  const cookie = req.cookies.get('session')?.value
  const session = await decrypt(cookie)
  if (!session?.userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const host = req.headers.get('host') || req.nextUrl.host
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const webhookUrl = `${protocol}://${host}/api/telegram`

  const result = await setWebhook(webhookUrl)

  return NextResponse.json({
    ok: result.ok,
    description: result.description,
    webhookUrl,
  })
}
