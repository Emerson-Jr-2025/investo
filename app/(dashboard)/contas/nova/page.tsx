import { createBill } from '@/app/actions/contas'
import { verifySession } from '@/lib/dal'
import Link from 'next/link'

const categorias = [
  'Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Lazer',
  'Educação', 'Vestuário', 'Serviços', 'Salário', 'Freelance',
  'Investimentos', 'Outros',
]

export default async function NovaContaPage() {
  await verifySession()

  const hoje = new Date().toISOString().split('T')[0]

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/contas" className="text-gray-400 hover:text-gray-600 transition">
          ← Voltar
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Nova Conta</h1>
      </div>

      <form action={createBill} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-5">
        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 border-2 rounded-xl px-4 py-3 cursor-pointer transition has-[:checked]:border-red-500 has-[:checked]:bg-red-50 border-gray-200">
              <input type="radio" name="type" value="pagar" className="accent-red-500" required />
              <span className="text-sm font-medium text-gray-700">↓ A Pagar</span>
            </label>
            <label className="flex items-center gap-2 border-2 rounded-xl px-4 py-3 cursor-pointer transition has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 border-gray-200">
              <input type="radio" name="type" value="receber" className="accent-emerald-600" />
              <span className="text-sm font-medium text-gray-700">↑ A Receber</span>
            </label>
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Descrição *
          </label>
          <input
            id="description"
            name="description"
            type="text"
            required
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            placeholder="Ex: Aluguel, Fatura Cartão, Salário..."
          />
        </div>

        {/* Valor */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Valor (R$) *
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-lg"
            placeholder="0.00"
          />
        </div>

        {/* Vencimento */}
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
            Data de Vencimento *
          </label>
          <input
            id="dueDate"
            name="dueDate"
            type="date"
            required
            defaultValue={hoje}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
          />
        </div>

        {/* Recorrência */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Recorrência *</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'unica', label: '1x Única' },
              { value: 'semanal', label: '🔄 Semanal' },
              { value: 'mensal', label: '🔄 Mensal' },
              { value: 'anual', label: '🔄 Anual' },
            ].map((r) => (
              <label
                key={r.value}
                className="flex items-center gap-2 border-2 rounded-xl px-3 py-2.5 cursor-pointer transition has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 border-gray-200"
              >
                <input
                  type="radio"
                  name="recurrence"
                  value={r.value}
                  defaultChecked={r.value === 'unica'}
                  className="accent-emerald-600"
                  required
                />
                <span className="text-sm font-medium text-gray-700">{r.label}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Contas recorrentes são recriadas automaticamente ao quitar
          </p>
        </div>

        {/* Categoria */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Categoria *
          </label>
          <select
            id="category"
            name="category"
            required
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition"
          >
            <option value="">Selecione...</option>
            {categorias.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Conta */}
        <div>
          <label htmlFor="account" className="block text-sm font-medium text-gray-700 mb-1">
            Conta *
          </label>
          <input
            id="account"
            name="account"
            type="text"
            required
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none transition"
            placeholder="Ex: Nubank, Itaú, Carteira..."
          />
        </div>

        {/* Observações */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Observações <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none resize-none transition"
            placeholder="Ex: Parcela 3/12, número da fatura..."
          />
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-2">
          <Link
            href="/contas"
            className="flex-1 text-center px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition text-sm font-medium"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition text-sm"
          >
            Salvar Conta
          </button>
        </div>
      </form>
    </div>
  )
}
