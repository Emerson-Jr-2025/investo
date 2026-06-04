'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { verifySession } from '@/lib/dal'

// Calcula a próxima data de vencimento com base na recorrência
function proximoVencimento(dueDate: Date, recurrence: string): Date {
  const d = new Date(dueDate)
  switch (recurrence) {
    case 'semanal':
      d.setDate(d.getDate() + 7)
      break
    case 'mensal':
      d.setMonth(d.getMonth() + 1)
      break
    case 'anual':
      d.setFullYear(d.getFullYear() + 1)
      break
  }
  return d
}

export async function createBill(formData: FormData) {
  await verifySession()

  await prisma.bill.create({
    data: {
      description: formData.get('description') as string,
      amount: parseFloat(formData.get('amount') as string),
      dueDate: new Date((formData.get('dueDate') as string) + 'T12:00:00'),
      type: formData.get('type') as string,
      status: 'pendente',
      category: formData.get('category') as string,
      account: formData.get('account') as string,
      recurrence: formData.get('recurrence') as string,
      notes: (formData.get('notes') as string) || null,
    },
  })

  revalidatePath('/contas')
  redirect('/contas')
}

export async function quitarConta(billId: string) {
  await verifySession()

  const bill = await prisma.bill.findUnique({ where: { id: billId } })
  if (!bill || bill.status === 'quitado') return

  const now = new Date()

  // Marca a conta como quitada e gera a transação correspondente
  await prisma.$transaction([
    prisma.bill.update({
      where: { id: billId },
      data: { status: 'quitado', paidAt: now },
    }),
    prisma.transaction.create({
      data: {
        date: now,
        type: bill.type === 'pagar' ? 'saida' : 'entrada',
        method: 'Transferência',
        amount: bill.amount,
        description: bill.description,
        category: bill.category,
        account: bill.account,
        status: 'confirmado',
        notes: `Gerado ao quitar conta #${bill.id.slice(-6)}`,
      },
    }),
  ])

  // Se for recorrente, cria a próxima ocorrência automaticamente
  if (bill.recurrence !== 'unica') {
    await prisma.bill.create({
      data: {
        description: bill.description,
        amount: bill.amount,
        dueDate: proximoVencimento(bill.dueDate, bill.recurrence),
        type: bill.type,
        status: 'pendente',
        category: bill.category,
        account: bill.account,
        recurrence: bill.recurrence,
        notes: bill.notes,
      },
    })
  }

  revalidatePath('/contas')
  revalidatePath('/')
}

export async function deleteBill(billId: string) {
  await verifySession()
  await prisma.bill.delete({ where: { id: billId } })
  revalidatePath('/contas')
}
