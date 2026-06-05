import { verifySession } from '@/lib/dal'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import type { Bill } from '@prisma/client'
import ChartsSection from '@/components/charts/ChartsSection'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat('pt-BR').format(new Date(d))

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export default async function DashboardPage() {
  await verifySession()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
  const start6MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const em7dias = new Date(now); em7dias.setDate(em7dias.getDate() + 7)

  const [
    totalEntradas, totalSaidas,
    entradasMes, saidasMes,
    entradasMesAnterior, saidasMesAnterior,
    transactions,
    contasAlerta,
    txLast6Months,
    despesasPorCategoria,
  ] = await Promise.all([
    prisma.transaction.aggregate({ where: { type: 'entrada', status: 'confirmado' }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: 'saida', status: 'confirmado' }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: 'entrada', status: 'confirmado', date: { gte: startOfMonth } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: 'saida', status: 'confirmado', date: { gte: startOfMonth } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: 'entrada', status: 'confirmado', date: { gte: startOfLastMonth, lte: endOfLastMonth } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: 'saida', status: 'confirmado', date: { gte: startOfLastMonth, lte: endOfLastMonth } }, _sum: { amount: true } }),
    prisma.transaction.findMany({ orderBy: { date: 'desc' }, take: 8 }),
    prisma.bill.findMany({ where: { status: 'pendente', dueDate: { lte: em7dias } }, orderBy: { dueDate: 'asc' }, take: 5 }),
    prisma.transaction.findMany({ where: { status: 'confirmado', date: { gte: start6MonthsAgo } }, select: { date: true, type: true, amount: true } }),
    prisma.transaction.groupBy({
      by: ['category'],
      where: { type: 'saida', status: 'confirmado', date: { gte: startOfMonth } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 7,
    }),
  ])

  const saldoTotal = Number(totalEntradas._sum.amount ?? 0) - Number(totalSaidas._sum.amount ?? 0)
  const receitasMes = Number(entradasMes._sum.amount ?? 0)
  const despesasMes = Number(saidasMes._sum.amount ?? 0)
  const receitasMesPassado = Number(entradasMesAnterior._sum.amount ?? 0)
  const despesasMesPassado = Number(saidasMesAnterior._sum.amount ?? 0)

  const pctReceitas = receitasMesPassado > 0 ? ((receitasMes - receitasMesPassado) / receitasMesPassado) * 100 : 0
  const pctDespesas = despesasMesPassado > 0 ? ((despesasMes - despesasMesPassado) / despesasMesPassado) * 100 : 0

  // Dados do gráfico mensal (últimos 6 meses)
  const monthlyMap: Record<string, { receitas: number; despesas: number }> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    monthlyMap[key] = { receitas: 0, despesas: 0 }
  }
  for (const tx of txLast6Months) {
    const d = new Date(tx.date)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (monthlyMap[key]) {
      if (tx.type === 'entrada') monthlyMap[key].receitas += Number(tx.amount)
      else monthlyMap[key].despesas += Number(tx.amount)
    }
  }
  const chartData = Object.entries(monthlyMap).map(([key, val]) => {
    const [year, month] = key.split('-').map(Number)
    return { month: MONTH_NAMES[month], ...val }
  })

  // Dados do gráfico de categoria
  const categoryData = despesasPorCategoria.map((c) => ({
    name: c.category,
    value: Number(c._sum.amount ?? 0),
  }))

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* ── Cabeçalho da página ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(now)}
          </p>
        </div>
        <Link
          href="/transacoes/nova"
          className="hidden md:flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2.5 rounded-xl font-medium transition shadow-sm"
        >
          <span>＋</span> Nova Transação
        </Link>
      </div>

      {/* ── KPI Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Saldo Total */}
        <div className="col-span-2 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-5 text-white shadow-sm">
          <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Saldo Total</p>
          <p className="text-3xl font-bold mt-2 tabular-nums">{fmt(saldoTotal)}</p>
          <p className="text-emerald-200 text-xs mt-2">Somente transações confirmadas</p>
        </div>

        {/* Receitas */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Receitas</p>
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <span className="text-emerald-600 text-sm">↑</span>
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 tabular-nums">{fmt(receitasMes)}</p>
          <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${pctReceitas >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            <span>{pctReceitas >= 0 ? '▲' : '▼'}</span>
            <span>{Math.abs(pctReceitas).toFixed(1)}% vs mês anterior</span>
          </div>
        </div>

        {/* Despesas */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Despesas</p>
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
              <span className="text-red-500 text-sm">↓</span>
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 tabular-nums">{fmt(despesasMes)}</p>
          <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${pctDespesas <= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            <span>{pctDespesas >= 0 ? '▲' : '▼'}</span>
            <span>{Math.abs(pctDespesas).toFixed(1)}% vs mês anterior</span>
          </div>
        </div>
      </div>

      {/* ── Gráficos ─── */}
      <ChartsSection monthlyData={chartData} categoryData={categoryData} />

      {/* ── Linha inferior: transações + alertas ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Transações Recentes */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Transações Recentes</h2>
            <Link href="/transacoes/nova" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
              + Nova →
            </Link>
          </div>
          {transactions.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">Nenhuma transação</div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {transactions.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${t.type === 'entrada' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
                    {t.type === 'entrada' ? '↑' : '↓'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{t.description}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{fmtDate(t.date)} · {t.category}{t.status === 'pendente' && <span className="ml-1 text-amber-500 font-medium">· pendente</span>}</p>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums flex-shrink-0 ${t.type === 'entrada' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {t.type === 'entrada' ? '+' : '-'}{fmt(Number(t.amount))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Painel lateral: alertas + ações */}
        <div className="space-y-4">

          {/* Ações rápidas */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Ações Rápidas</p>
            <div className="space-y-2">
              {[
                { href: '/extrato', label: 'Importar Extrato', desc: 'Via IA', color: 'bg-violet-50 text-violet-700' },
                { href: '/contas', label: 'Contas', desc: 'A pagar/receber', color: 'bg-blue-50 text-blue-700' },
                { href: '/investimentos', label: 'Investimentos', desc: 'Carteira', color: 'bg-amber-50 text-amber-700' },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition group">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${item.color}`}>
                    →
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 group-hover:text-emerald-600 transition">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Alertas de contas */}
          {contasAlerta.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider">⚠ Contas Urgentes</p>
                <Link href="/contas" className="text-xs text-orange-500 hover:underline">Ver todas</Link>
              </div>
              <ul className="space-y-2">
                {contasAlerta.map((b: Bill) => {
                  const hoje = new Date(); hoje.setHours(0,0,0,0)
                  const venc = new Date(b.dueDate); venc.setHours(0,0,0,0)
                  const diff = Math.ceil((venc.getTime() - hoje.getTime()) / 86400000)
                  return (
                    <li key={b.id} className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate">{b.description}</p>
                        <p className={`text-xs ${diff < 0 ? 'text-red-500' : 'text-orange-500'}`}>
                          {diff < 0 ? `Vencida há ${Math.abs(diff)}d` : diff === 0 ? 'Vence hoje!' : `Vence em ${diff}d`}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-slate-700 tabular-nums ml-2 flex-shrink-0">
                        {fmt(Number(b.amount))}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
