'use server'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { createSession, deleteSession } from '@/lib/session'

export async function login(
  prevState: { error?: string } | undefined,
  formData: FormData
) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { error: 'E-mail ou senha incorretos.' }
  }

  await createSession(user.id)
  redirect('/')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
