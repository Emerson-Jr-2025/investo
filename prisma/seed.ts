import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

async function main() {
  const email = process.env.APP_ADMIN_EMAIL
  const password = process.env.APP_ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error('APP_ADMIN_EMAIL e APP_ADMIN_PASSWORD precisam estar no .env')
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hashedPassword },
    create: { email, password: hashedPassword },
  })

  console.log(`✅ Usuário criado: ${user.email}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
