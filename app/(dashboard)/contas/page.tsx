import { verifySession } from '@/lib/dal'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { quitarConta, deleteBill } from '@/app/actions/contas'
import type { Bill } from '@prisma/client'
import FiltrosContas from '@/components/contas/FiltrosContas'
import { Suspense } from 'react'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat('pt-BR').format(new Date(d))

function badgeVencimento(dueDate: Date, status: string) {
  if (status === 'quitado') return { label: 'Quitado', cor: 'bg-slate-100 text-slate-500' }
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const venc = new Date(dueDate); venc.setHours(0, 0, 0, 0)
  const diff = Math.ceil((venc.getTime() - hoje.getTime()) / 86400000)
  if (diff < 0)  return { label: `Vencida há ${Math.abs(diff)}d`, cor: 'bg-red-100 text-red-600' }
  if (diff === 0) return { label: 'Vence hoje!', cor: 'bg-orange-100 text-orange-600' }
  if (diff <= 3)  return { label: `Vence em ${diff}d`, cor: 'bg-yellow-100 text-yellow-700' }
  return { label: `${formatDate(venc)}`, cor: 'bg-blue-50 text-blue-600' }
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat('pt-BR').format(d)
}

const recurrenceLabel: Record<string, string> = {
  unica: 'Única', semanal: 'Semanal', mensal: 'Mensal', anual: 'Anual',
}

export default async function ContasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  await verifySession()
  const params = await searchParams

  const tipo = params.tipo
  const recorrencia = params.recorrencia
  const statusFiltro = params.status || 'pendente'
  const dataInicio = params.dataInicio ? new Date(params.dataInicio + 'T00:00:00') : undefined
  const dataFim = params.dataFim ? new Date(params.dataFim + 'T23:59:59') : undefined

  // Monta o filtro dinamicamente
  const where: Parameters<typeof prisma.bill.findMany>[0]['where'] = {}
  if (statusFiltro !== 'todas') where.status = statusFiltro
  if (tipo && tipo !== 'todas') where.type = tipo
  if (recorrencia && recorrencia !== 'todas') where.recurrence = recorrencia
  if (dataInicio || dataFim) {
    where.dueDate = {
      ...(dataInicio ? { gte: dataInicio } : {}),
      ...(dataFim ? { lte: dataFim } : {}),
    }
  }

  const bills = await prisma.bill.findMany({
    where,
    orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
  })

  // Resumo apenas das pendentes (sem filtro de data para o resumo)
  const [resumoPagar, resumoReceber] = await Promise.all([
    prisma.bill.aggregate({ where: { status: 'pendente', type: 'pagar' }, _sum: { amount: true }, _count: true }),
    prisma.bill.aggregate({ where: { status: 'pendente', type: 'receber' }, _sum: { amount: true }, _count: true }),
  ])

  const totalPagar = Number(resumoPagar._sum.amount ?? 0)
  const totalReceber = Number(resumoReceber._sum.amount ?? 0)

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contas</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gerencie pagamentos e recebimentos</p>
        </div>
        <Link
          href="/contas/nova"
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2.5 rounded-xl font-medium transition shadow-sm"
        >
          + Nova Conta
        </Link>
      </div>

      {/* Resumo geral */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total a Pagar</p>
          <p className="text-red-500 text-2xl font-bold mt-1 tabular-nums">{fmt(totalPagar)}</p>
          <p className="text-slate-400 text-xs mt-1">{resumoPagar._count} conta(s) pendente(s)</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total a Receber</p>
          <p className="text-emerald-600 text-2xl font-bold mt-1 tabular-nums">{fmt(totalReceber)}</p>
          <p className="text-slate-400 text-xs mt-1">{resumoReceber._count} conta(s) pendente(s)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* Filtros */}
        <div className="lg:col-span-1">
          <Suspense>
            <FiltrosContas />
          </Suspense>
        </div>

        {/* Lista */}
        <div className="lg:col-span-3">
          {bills.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 text-center py-16 px-4">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-slate-500 font-medium">Nenhuma conta encontrada</p>
              <p className="text-slate-400 text-sm mt-1">Ajuste os filtros ou adicione uma nova conta</p>
              <Link href="/contas/nova" className="text-emerald-600 text-sm hover:underline mt-3 block">
                + Nova Conta
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">
                  {bills.length} conta{bills.length !== 1 ? 's' : ''} encontrada{bills.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-slate-400">
                  {statusFiltro === 'pendente' ? 'Pendentes' : statusFiltro === 'quitado' ? 'Quitadas' : 'Todas'}
                </p>
              </div>

              <ul className="divide-y divide-slate-50">
                {bills.map((bill: Bill) => {
                  const { label, cor } = badgeVencimento(bill.dueDate, bill.status)
                  const isPendente = bill.status === 'pendente'

                  return (
                    <li key={bill.id} className="px-5 py-4 hover:bg-slate-50 transition">
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                          bill.type === 'receber' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'
                        }`}>
                          {bill.type === 'receber' ? '↑' : '↓'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-slate-800">{bill.description}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cor}`}>
                              {label}
                            </span>
                            {bill.recurrence !== 'unica' && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 font-medium">
                                🔄 {recurrenceLabel[bill.recurrence]}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {isPendente ? `Vence: ${fmtDate(bill.dueDate)}` : `Quitada: ${bill.paidAt ? fmtDate(bill.paidAt) : '—'}`}
                            {' · '}{bill.category}{' · '}{bill.account}
                          </p>
                          {bill.notes && (
                            <p className="text-xs text-slate-400 mt-0.5 italic">{bill.notes}</p>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span className={`text-sm font-bold tabular-nums ${
                            bill.type === 'receber' ? 'text-emerald-600' : 'text-red-500'
                          }`}>
                            {fmt(Number(bill.amount))}
                          </span>

                          <div className="flex items-center gap-1">
                            {isPendente && (
                              <form action={quitarConta.bind(null, bill.id)}>
                                <button
                                  type="submit"
                                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg font-medium transition"
                                >
                                  ✓ Quitar
                                </button>
                              </form>
                            )}
                            <form action={deleteBill.bind(null, bill.id)}>
                              <button
                                type="submit"
                                title="Excluir conta"
                                className="text-xs text-slate-300 hover:text-red-500 transition px-2 py-1 rounded-lg hover:bg-red-50"
                                onClick={(e) => {
                                  if (!confirm('Excluir esta conta?')) e.preventDefault()
                                }}
                              >
                                🗑
                              </button>
                            </form>
                          </div>
                        </div>
                      </div>
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
