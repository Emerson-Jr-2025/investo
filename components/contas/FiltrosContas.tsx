'use client'
import { useRouter, useSearchParams } from 'next/navigation'

const tipoOpts = [
  { value: 'todas', label: 'Todas' },
  { value: 'pagar', label: '↓ A Pagar' },
  { value: 'receber', label: '↑ A Receber' },
]

const recOpts = [
  { value: 'todas', label: 'Qualquer recorrência' },
  { value: 'unica', label: '1× Única' },
  { value: 'semanal', label: '🔄 Semanal' },
  { value: 'mensal', label: '🔄 Mensal' },
  { value: 'anual', label: '🔄 Anual' },
]

const statusOpts = [
  { value: 'pendente', label: 'Pendentes' },
  { value: 'quitado', label: 'Quitadas' },
  { value: 'todas', label: 'Todas' },
]

export default function FiltrosContas() {
  const router = useRouter()
  const sp = useSearchParams()

  const tipo = sp.get('tipo') || 'todas'
  const rec = sp.get('recorrencia') || 'todas'
  const status = sp.get('status') || 'pendente'
  const dataInicio = sp.get('dataInicio') || ''
  const dataFim = sp.get('dataFim') || ''

  function set(key: string, value: string) {
    const params = new URLSearchParams(sp.toString())
    if (value === 'todas' || value === '') params.delete(key)
    else params.set(key, value)
    router.push(`/contas?${params.toString()}`)
  }

  function limpar() {
    router.push('/contas')
  }

  const temFiltro = tipo !== 'todas' || rec !== 'todas' || status !== 'pendente' || dataInicio || dataFim

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-4">
      {/* Status */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Status</p>
        <div className="flex gap-2 flex-wrap">
          {statusOpts.map((o) => (
            <button
              key={o.value}
              onClick={() => set('status', o.value)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                status === o.value
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tipo */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tipo</p>
        <div className="flex gap-2 flex-wrap">
          {tipoOpts.map((o) => (
            <button
              key={o.value}
              onClick={() => set('tipo', o.value)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                tipo === o.value
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recorrência */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recorrência</p>
        <select
          value={rec}
          onChange={(e) => set('recorrencia', e.target.value)}
          className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
        >
          {recOpts.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Período */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Período de vencimento</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">De</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => set('dataInicio', e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Até</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => set('dataFim', e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>
      </div>

      {temFiltro && (
        <button
          onClick={limpar}
          className="w-full text-xs text-slate-500 hover:text-red-500 transition py-1.5"
        >
          ✕ Limpar filtros
        </button>
      )}
    </div>
  )
}
