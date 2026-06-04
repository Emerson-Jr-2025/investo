'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { verifySession } from '@/lib/dal'

export async function createTransaction(formData: FormData) {
  await verifySession()

  await prisma.transaction.create({
    data: {
      date: new Date(formData.get('date') as string),
      type: formData.get('type') as string,
      method: formData.get('method') as string,
      amount: parseFloat(formData.get('amount') as string),
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      account: formData.get('account') as string,
      status: formData.get('status') as string,
      notes: (formData.get('notes') as string) || null,
    },
  })

  revalidatePath('/')
  redirect('/')
}
