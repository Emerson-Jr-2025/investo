import { configDotenv } from 'dotenv'
configDotenv({ path: '.env' })

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

const transacoes = [
  // Entradas de junho
  { date: new Date('2026-06-01'), type: 'entrada', method: 'TED/DOC', amount: 4500.00, description: 'Salário', category: 'Salário', account: 'Nubank', status: 'confirmado' },
  { date: new Date('2026-06-03'), type: 'entrada', method: 'PIX', amount: 850.00, description: 'Freela — site cliente', category: 'Freelance', account: 'Nubank', status: 'confirmado' },

  // Saídas de junho
  { date: new Date('2026-06-01'), type: 'saida', method: 'Transferência', amount: 1200.00, description: 'Aluguel', category: 'Moradia', account: 'Nubank', status: 'confirmado' },
  { date: new Date('2026-06-02'), type: 'saida', method: 'Cartão de Débito', amount: 312.50, description: 'Supermercado Extra', category: 'Alimentação', account: 'Nubank', status: 'confirmado' },
  { date: new Date('2026-06-02'), type: 'saida', method: 'Boleto', amount: 120.00, description: 'Conta de luz', category: 'Moradia', account: 'Nubank', status: 'confirmado' },
  { date: new Date('2026-06-03'), type: 'saida', method: 'Cartão de Crédito', amount: 39.90, description: 'Netflix', category: 'Lazer', account: 'Nubank', status: 'confirmado' },
  { date: new Date('2026-06-03'), type: 'saida', method: 'PIX', amount: 52.00, description: 'Farmácia Drogasil', category: 'Saúde', account: 'Carteira', status: 'confirmado' },
  { date: new Date('2026-06-04'), type: 'saida', method: 'Cartão de Crédito', amount: 67.80, description: 'Restaurante Almoço', category: 'Alimentação', account: 'Nubank', status: 'confirmado' },
  { date: new Date('2026-06-04'), type: 'saida', method: 'PIX', amount: 45.00, description: 'Uber', category: 'Transporte', account: 'Nubank', status: 'confirmado' },
  { date: new Date('2026-06-05'), type: 'saida', method: 'Boleto', amount: 99.90, description: 'Academia Smart Fit', category: 'Saúde', account: 'Nubank', status: 'pendente', notes: 'Vence dia 10' },

  // Maio (para o saldo total ficar mais interessante)
  { date: new Date('2026-05-01'), type: 'entrada', method: 'TED/DOC', amount: 4500.00, description: 'Salário', category: 'Salário', account: 'Nubank', status: 'confirmado' },
  { date: new Date('2026-05-02'), type: 'saida', method: 'Transferência', amount: 1200.00, description: 'Aluguel', category: 'Moradia', account: 'Nubank', status: 'confirmado' },
  { date: new Date('2026-05-05'), type: 'saida', method: 'Cartão de Débito', amount: 298.00, description: 'Supermercado', category: 'Alimentação', account: 'Nubank', status: 'confirmado' },
  { date: new Date('2026-05-10'), type: 'saida', method: 'Cartão de Crédito', amount: 189.90, description: 'Roupas Renner', category: 'Vestuário', account: 'Nubank', status: 'confirmado' },
  { date: new Date('2026-05-15'), type: 'entrada', method: 'PIX', amount: 500.00, description: 'Devolução empréstimo amigo', category: 'Outros', account: 'Nubank', status: 'confirmado' },
  { date: new Date('2026-05-20'), type: 'saida', method: 'PIX', amount: 75.00, description: 'Consulta médica', category: 'Saúde', account: 'Nubank', status: 'confirmado' },
]

async function main() {
  await prisma.transaction.deleteMany()
  await prisma.transaction.createMany({ data: transacoes })
  console.log(`✅ ${transacoes.length} transações de exemplo criadas!`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
