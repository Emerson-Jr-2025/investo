'use server'
import Anthropic from '@anthropic-ai/sdk'
import { revalidatePath } from 'next/cache'
import { verifySession } from '@/lib/dal'
import prisma from '@/lib/prisma'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type TransacaoParsed = {
  date: string
  description: string
  amount: number
  type: 'entrada' | 'saida'
  category: string
  method: string
}

export async function analisarExtrato(
  texto: string
): Promise<{ transactions?: TransacaoParsed[]; error?: string }> {
  await verifySession()

  if (!texto.trim()) {
    return { error: 'Cole o texto do extrato antes de analisar.' }
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `Analise o extrato bancário abaixo e extraia todas as transações.

Retorne SOMENTE um JSON array válido, sem texto antes ou depois, no formato:
[
  {
    "date": "YYYY-MM-DD",
    "description": "descrição limpa da transação",
    "amount": 123.45,
    "type": "entrada",
    "category": "Salário",
    "method": "TED/DOC"
  }
]

Regras:
- "type" é "entrada" quando dinheiro ENTROU na conta (depósito, PIX recebido, salário, estorno, crédito)
- "type" é "saida" quando dinheiro SAIU da conta (pagamento, compra, saque, débito, PIX enviado)
- "amount" sempre positivo, sem símbolo de moeda
- "date" no formato YYYY-MM-DD. Se o ano não estiver no extrato, use ${new Date().getFullYear()}
- Para "category" use apenas: Alimentação, Transporte, Moradia, Saúde, Lazer, Educação, Vestuário, Serviços, Salário, Freelance, Investimentos, Outros
- Para "method" use apenas: PIX, Cartão de Crédito, Cartão de Débito, Dinheiro, TED/DOC, Boleto, Transferência
- Ignore linhas de saldo, totais, cabeçalhos e rodapés

Extrato:
${texto}`,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      return { error: 'Resposta inesperada da IA. Tente novamente.' }
    }

    const jsonMatch = content.text.trim().match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return {
        error: 'Não encontrei transações no texto. Certifique-se de colar um extrato bancário real.',
      }
    }

    const transactions = JSON.parse(jsonMatch[0]) as TransacaoParsed[]

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return { error: 'Nenhuma transação encontrada no extrato.' }
    }

    return { transactions }
  } catch (err) {
    console.error('Erro ao analisar extrato:', err)
    return { error: 'Erro ao processar com IA. Verifique sua chave Anthropic e tente novamente.' }
  }
}

export async function salvarTransacoes(
  transactions: (TransacaoParsed & { account: string; status: string })[]
): Promise<{ saved: number; error?: string }> {
  await verifySession()

  try {
    await prisma.transaction.createMany({
      data: transactions.map((t) => ({
        date: new Date(t.date + 'T12:00:00'),
        type: t.type,
        method: t.method,
        amount: t.amount,
        description: t.description,
        category: t.category,
        account: t.account,
        status: t.status,
      })),
    })

    revalidatePath('/')
    return { saved: transactions.length }
  } catch (err) {
    console.error('Erro ao salvar transações:', err)
    return { saved: 0, error: 'Erro ao salvar. Tente novamente.' }
  }
}
