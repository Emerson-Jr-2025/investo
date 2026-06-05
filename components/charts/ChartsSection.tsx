'use client'
import MonthlyChart from './MonthlyChart'
import CategoryChart from './CategoryChart'

type Props = {
  monthlyData: { month: string; receitas: number; despesas: number }[]
  categoryData: { name: string; value: number }[]
}

export default function ChartsSection({ monthlyData, categoryData }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Receitas vs Despesas</h2>
          <p className="text-slate-400 text-xs mt-0.5">Últimos 6 meses</p>
        </div>
        <MonthlyChart data={monthlyData} />
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Despesas por Categoria</h2>
          <p className="text-slate-400 text-xs mt-0.5">Este mês</p>
        </div>
        <CategoryChart data={categoryData} />
      </div>
    </div>
  )
}
