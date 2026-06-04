import { verifySession } from '@/lib/dal'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { quitarConta, deleteBill } from '@/app/actions/contas'
import type { Bill } from '@prisma/client'

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const formatDate = (d: Date) =>
  new Intl.DateTimeFormat('pt-BR').format(new Date(d))

function statusVencimento(dueDate: Date, status: string) {
  if (status === 'quitado') return { label: 'Quitado', cor: 'bg-gray-100 text-gray-500' }
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const venc = new Date(dueDate)
  venc.setHours(0, 0, 0, 0)
  const diff = Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return { label: `Vencida há ${Math.abs(diff)}d`, cor: 'bg-red-100 text-red-600' }
  if (diff === 0) return { label: 'Vence hoje!', cor: 'bg-orange-100 text-orange-600' }
  if (diff <= 3) return { label: `Vence em ${diff}d`, cor: 'bg-yellow-100 text-yellow-700' }
  return { label: `${diff} dias`, cor: 'bg-blue-50 text-blue-600' }
}

const recurrenceLabel: Record<string, string> = {
  unica: 'Única',
  semanal: 'Semanal',
  mensal: 'Mensal',
  anual: 'Anual',
}

export default async function ContasPage() {
  await verifySession()

  const bills = await prisma.bill.findMany({
    orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
  })

  const pendentes = bills.filter((b: Bill) => b.status === 'pendente')
  const quitadas = bills.filter((b: Bill) => b.status === 'quitado')

  const totalPagar = pendentes
    .filter((b: Bill) => b.type === 'pagar')
    .reduce((s: number, b: Bill) => s + Number(b.amount), 0)

  const totalReceber = pendentes
    .filter((b: Bill) => b.type === 'receber')
    .reduce((s: number, b: Bill) => s + Number(b.amount), 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Contas</h1>
        <Link
          href="/contas/nova"
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition"
        >
          + Nova Conta
        </Link>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">A Pagar</p>
          <p className="text-red-500 text-xl font-bold mt-1 tabular-nums">
            {formatCurrency(totalPagar)}
          </p>
          <p className="text-gray-400 text-xs mt-1">{pendentes.filter((b) => b.type === 'pagar').length} pendente(s)</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">A Receber</p>
          <p className="text-emerald-600 text-xl font-bold mt-1 tabular-nums">
            {formatCurrency(totalReceber)}
          </p>
          <p className="text-gray-400 text-xs mt-1">{pendentes.filter((b) => b.type === 'receber').length} pendente(s)</p>
        </div>
      </div>

      {/* Pendentes */}
      {pendentes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 text-center py-12 px-4">
          <p className="text-3xl mb-2">🎉</p>
          <p className="text-gray-500 text-sm font-medium">Nenhuma conta pendente!</p>
          <Link href="/contas/nova" className="text-emerald-600 text-sm hover:underline mt-1 block">
            Adicionar uma conta
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-700">Pendentes</p>
          </div>
          <ul className="divide-y divide-gray-50">
            {pendentes.map((bill) => {
              const { label, cor } = statusVencimento(bill.dueDate, bill.status)
              return (
                <li key={bill.id} className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                        bill.type === 'receber'
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-red-100 text-red-500'
                      }`}
                    >
                      {bill.type === 'receber' ? '↑' : '↓'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {bill.description}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cor}`}>
                          {label}
                        </span>
                        {bill.recurrence !== 'unica' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 font-medium">
                            🔄 {recurrenceLabel[bill.recurrence]}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Vence {formatDate(bill.dueDate)} · {bill.category} · {bill.account}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span
                        className={`text-sm font-semibold tabular-nums ${
                          bill.type === 'receber' ? 'text-emerald-600' : 'text-red-500'
                        }`}
                      >
                        {formatCurrency(Number(bill.amount))}
                      </span>
                      <form action={quitarConta.bind(null, bill.id)}>
                        <button
                          type="submit"
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg font-medium transition"
                        >
                          ✓ Quitar
                        </button>
                      </form>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Quitadas (últimas 5) */}
      {quitadas.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-500">Quitadas recentemente</p>
          </div>
          <ul className="divide-y divide-gray-50">
            {quitadas.slice(0, 5).map((bill) => (
              <li key={bill.id} className="px-4 py-3 flex items-center gap-3 opacity-60">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm flex-shrink-0">
                  ✓
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{bill.description}</p>
                  <p className="text-xs text-gray-400">
                    Quitada em {bill.paidAt ? formatDate(bill.paidAt) : '—'} · {bill.category}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-semibold text-gray-500 tabular-nums">
                    {formatCurrency(Number(bill.amount))}
                  </span>
                  <form action={deleteBill.bind(null, bill.id)}>
                    <button
                      type="submit"
                      className="text-xs text-gray-400 hover:text-red-500 transition px-1"
                      title="Remover"
                    >
                      ✕
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
