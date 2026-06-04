import { verifySession } from '@/lib/dal'
import prisma from '@/lib/prisma'
import Link from 'next/link'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
}

export default async function DashboardPage() {
  await verifySession()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const em7dias = new Date(now)
  em7dias.setDate(em7dias.getDate() + 7)

  const [totalEntradas, totalSaidas, entradasMes, saidasMes, transactions, contasAlerta] =
    await Promise.all([
      prisma.transaction.aggregate({
        where: { type: 'entrada', status: 'confirmado' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { type: 'saida', status: 'confirmado' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { type: 'entrada', status: 'confirmado', date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { type: 'saida', status: 'confirmado', date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.transaction.findMany({ orderBy: { date: 'desc' }, take: 10 }),
      prisma.bill.findMany({
        where: { status: 'pendente', dueDate: { lte: em7dias } },
        orderBy: { dueDate: 'asc' },
        take: 5,
      }),
    ])

  const saldoTotal =
    Number(totalEntradas._sum.amount ?? 0) - Number(totalSaidas._sum.amount ?? 0)
  const receitasMes = Number(entradasMes._sum.amount ?? 0)
  const despesasMes = Number(saidasMes._sum.amount ?? 0)

  return (
    <div className="space-y-5">
      {/* Saldo Total */}
      <div className="bg-emerald-600 text-white rounded-2xl p-6 shadow-sm">
        <p className="text-emerald-100 text-sm font-medium">Saldo Total</p>
        <p className="text-4xl font-bold mt-1 tabular-nums">{formatCurrency(saldoTotal)}</p>
        <p className="text-emerald-200 text-xs mt-2">Somente transações confirmadas</p>
      </div>

      {/* Receitas e Despesas do mês */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">Receitas</p>
          <p className="text-emerald-600 text-xl font-bold mt-1 tabular-nums">
            {formatCurrency(receitasMes)}
          </p>
          <p className="text-gray-400 text-xs mt-1">Este mês</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">Despesas</p>
          <p className="text-red-500 text-xl font-bold mt-1 tabular-nums">
            {formatCurrency(despesasMes)}
          </p>
          <p className="text-gray-400 text-xs mt-1">Este mês</p>
        </div>
      </div>

      {/* Alertas de contas */}
      {contasAlerta.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-orange-800 text-sm font-semibold">
              ⚠️ {contasAlerta.length} conta{contasAlerta.length > 1 ? 's' : ''} vencendo em breve
            </p>
            <Link href="/contas" className="text-orange-600 text-xs hover:underline font-medium">
              Ver todas →
            </Link>
          </div>
          <ul className="space-y-1">
            {contasAlerta.map((b) => {
              const hoje = new Date(); hoje.setHours(0,0,0,0)
              const venc = new Date(b.dueDate); venc.setHours(0,0,0,0)
              const diff = Math.ceil((venc.getTime() - hoje.getTime()) / 86400000)
              return (
                <li key={b.id} className="flex items-center justify-between text-sm">
                  <span className="text-orange-700 truncate">{b.description}</span>
                  <span className={`text-xs font-medium ml-2 flex-shrink-0 ${diff < 0 ? 'text-red-600' : 'text-orange-600'}`}>
                    {diff < 0 ? `vencida há ${Math.abs(diff)}d` : diff === 0 ? 'hoje!' : `em ${diff}d`}
                    {' · '}
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(b.amount))}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Ações rápidas */}
      <div className="grid grid-cols-3 gap-3">
        <Link
          href="/transacoes/nova"
          className="flex flex-col items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl transition text-xs text-center"
        >
          <span className="text-lg">✏️</span>
          Nova Transação
        </Link>
        <Link
          href="/extrato"
          className="flex flex-col items-center justify-center gap-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium py-3 rounded-xl transition text-xs text-center shadow-sm"
        >
          <span className="text-lg">📄</span>
          Importar Extrato
        </Link>
        <Link
          href="/contas"
          className="flex flex-col items-center justify-center gap-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium py-3 rounded-xl transition text-xs text-center shadow-sm"
        >
          <span className="text-lg">📅</span>
          Contas
        </Link>
      </div>

      {/* Transações Recentes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Transações Recentes</h2>
          <Link
            href="/transacoes/nova"
            className="text-emerald-600 hover:text-emerald-700 text-sm font-medium transition"
          >
            + Nova
          </Link>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-14 px-4">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-gray-500 text-sm font-medium">Nenhuma transação ainda</p>
            <p className="text-gray-400 text-sm mt-1">
              Clique em{' '}
              <Link href="/transacoes/nova" className="text-emerald-600 hover:underline font-medium">
                + Nova
              </Link>{' '}
              para começar
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {transactions.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 ${
                    t.type === 'entrada'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-red-100 text-red-500'
                  }`}
                >
                  {t.type === 'entrada' ? '↑' : '↓'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{t.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(t.date)} · {t.category}
                    {t.status === 'pendente' && (
                      <span className="ml-1 text-amber-500 font-medium">· pendente</span>
                    )}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold tabular-nums flex-shrink-0 ${
                    t.type === 'entrada' ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {t.type === 'entrada' ? '+' : '-'}
                  {formatCurrency(Number(t.amount))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
