'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { verifySession } from '@/lib/dal'

export async function addInvestment(formData: FormData) {
  await verifySession()

  const ticker = (formData.get('ticker') as string)?.toUpperCase().trim() || null
  const type = formData.get('type') as string

  await prisma.investment.create({
    data: {
      ticker: ticker || null,
      name: formData.get('name') as string,
      type,
      quantity: parseFloat(formData.get('quantity') as string),
      avgPrice: parseFloat(formData.get('avgPrice') as string),
    },
  })

  revalidatePath('/investimentos')
  redirect('/investimentos')
}

export async function removeInvestment(id: string) {
  await verifySession()
  await prisma.investment.delete({ where: { id } })
  revalidatePath('/investimentos')
}
