import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import prisma from '@/lib/prisma'
import { sendMessage, answerCallbackQuery, editMessageText } from '@/lib/telegram'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const ALLOWED_ID = process.env.TELEGRAM_ALLOWED_USER_ID!
const DEFAULT_ACCOUNT = process.env.TELEGRAM_DEFAULT_ACCOUNT || 'Conta Principal'

const formatBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const formatDate = (d: string) =>
  new Intl.DateTimeFormat('pt-BR').format(new Date(d + 'T12:00:00'))

async function interpretarMensagem(texto: string) {
  const hoje = new Date().toISOString().split('T')[0]

  const res = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `Interprete como transação financeira e retorne SOMENTE JSON.

Se for transação:
{"type":"saida","amount":50.00,"description":"Uber","category":"Transporte","method":"PIX","date":"${hoje}"}

Se não for transação:
{"error":"motivo"}

Regras:
- type: "entrada" (recebeu) ou "saida" (pagou/gastou)
- amount: número positivo
- date: use ${hoje} se não mencionar data
- category: Alimentação|Transporte|Moradia|Saúde|Lazer|Educação|Vestuário|Serviços|Salário|Freelance|Investimentos|Outros
- method: PIX|Cartão de Crédito|Cartão de Débito|Dinheiro|TED/DOC|Boleto|Transferência (deduza se não informado)

Mensagem: "${texto}"`,
      },
    ],
  })

  const content = res.content[0]
  if (content.type !== 'text') return { error: 'Erro na IA' }
  const match = content.text.match(/\{[\s\S]*\}/)
  if (!match) return { error: 'Sem resposta' }
  return JSON.parse(match[0])
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // ── Botão pressionado (confirmar / cancelar) ──
    if (body.callback_query) {
      const { id, from, data, message } = body.callback_query

      if (String(from.id) !== ALLOWED_ID) {
        await answerCallbackQuery(id, '⛔ Não autorizado')
        return NextResponse.json({ ok: true })
      }

      const [acao, draftId] = (data as string).split(':')

      if (acao === 'confirmar') {
        const draft = await prisma.telegramDraft.findUnique({ where: { id: draftId } })

        if (!draft) {
          await answerCallbackQuery(id, 'Rascunho expirado. Envie a mensagem novamente.')
          return NextResponse.json({ ok: true })
        }

        await prisma.$transaction([
          prisma.transaction.create({
            data: {
              date: new Date(draft.date + 'T12:00:00'),
              type: draft.type,
              method: draft.method,
              amount: draft.amount,
              description: draft.description,
              category: draft.category,
              account: DEFAULT_ACCOUNT,
              status: 'confirmado',
              notes: 'Registrado via Telegram',
            },
          }),
          prisma.telegramDraft.delete({ where: { id: draftId } }),
        ])

        await answerCallbackQuery(id, '✅ Salvo!')
        await editMessageText(
          message.chat.id,
          message.message_id,
          `✅ *Salvo com sucesso!*\n\n${draft.type === 'saida' ? '↓ Saída' : '↑ Entrada'} — *${formatBRL(draft.amount)}*\n📝 ${draft.description}\n📂 ${draft.category}`
        )
      }

      if (acao === 'cancelar') {
        await prisma.telegramDraft.deleteMany({ where: { id: draftId } })
        await answerCallbackQuery(id, '❌ Cancelado')
        await editMessageText(message.chat.id, message.message_id, '❌ Transação cancelada.')
      }

      return NextResponse.json({ ok: true })
    }

    // ── Mensagem de texto ──
    const msg = body.message
    if (!msg?.text) return NextResponse.json({ ok: true })

    const chatId = msg.chat.id
    const userId = String(msg.from.id)

    if (userId !== ALLOWED_ID) return NextResponse.json({ ok: true })

    const texto = msg.text as string

    // Comandos
    if (texto === '/start' || texto === '/ajuda') {
      await sendMessage(
        chatId,
        '💰 *Investo Bot*\n\nMe mande uma mensagem descrevendo sua transação:\n\n' +
          '• _"gastei 50 no uber"_\n' +
          '• _"paguei 89,90 na farmácia no cartão"_\n' +
          '• _"recebi 4500 de salário"_\n' +
          '• _"comprei 320 de mercado"_\n\n' +
          'Vou interpretar e pedir confirmação antes de salvar. ✅'
      )
      return NextResponse.json({ ok: true })
    }

    // Limpar rascunhos antigos do mesmo usuário (> 1h)
    await prisma.telegramDraft.deleteMany({
      where: {
        chatId: String(chatId),
        createdAt: { lt: new Date(Date.now() - 60 * 60 * 1000) },
      },
    })

    // Interpretar com IA
    const parsed = await interpretarMensagem(texto)

    if (parsed.error || !parsed.amount) {
      await sendMessage(
        chatId,
        '🤔 Não entendi como uma transação.\n\nTente algo como:\n• _"gastei 50 no uber"_\n• _"recebi 1000 de freela"_\n\nOu use /ajuda para ver exemplos.'
      )
      return NextResponse.json({ ok: true })
    }

    // Salvar rascunho
    const draft = await prisma.telegramDraft.create({
      data: {
        chatId: String(chatId),
        type: parsed.type,
        amount: parsed.amount,
        description: parsed.description,
        category: parsed.category,
        method: parsed.method,
        date: parsed.date,
      },
    })

    const icone = parsed.type === 'saida' ? '↓ Saída' : '↑ Entrada'

    await sendMessage(
      chatId,
      `💰 *Confirmar transação?*\n\n${icone} — *${formatBRL(parsed.amount)}*\n📝 ${parsed.description}\n📂 ${parsed.category}\n💳 ${parsed.method}\n📅 ${formatDate(parsed.date)}`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Confirmar', callback_data: `confirmar:${draft.id}` },
              { text: '❌ Cancelar', callback_data: `cancelar:${draft.id}` },
            ],
          ],
        },
      }
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Telegram webhook error:', err)
    return NextResponse.json({ ok: true })
  }
}
