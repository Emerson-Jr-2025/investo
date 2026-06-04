import { createTransaction } from '@/app/actions/transacoes'
import { verifySession } from '@/lib/dal'
import Link from 'next/link'

const categorias = [
  'Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Lazer',
  'Educação', 'Vestuário', 'Serviços', 'Salário', 'Freelance',
  'Investimentos', 'Outros',
]

const metodos = [
  'PIX', 'Cartão de Crédito', 'Cartão de Débito',
  'Dinheiro', 'TED/DOC', 'Boleto', 'Transferência',
]

export default async function NovaTransacaoPage() {
  await verifySession()

  const hoje = new Date().toISOString().split('T')[0]

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-gray-400 hover:text-gray-600 transition">
          ← Voltar
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Nova Transação</h1>
      </div>

      <form action={createTransaction} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-5">
        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 border-2 rounded-xl px-4 py-3 cursor-pointer transition has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 border-gray-200">
              <input type="radio" name="type" value="entrada" className="accent-emerald-600" required />
              <span className="text-sm font-medium text-gray-700">↑ Entrada</span>
            </label>
            <label className="flex items-center gap-2 border-2 rounded-xl px-4 py-3 cursor-pointer transition has-[:checked]:border-red-500 has-[:checked]:bg-red-50 border-gray-200">
              <input type="radio" name="type" value="saida" className="accent-red-500" />
              <span className="text-sm font-medium text-gray-700">↓ Saída</span>
            </label>
          </div>
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
            placeholder="Ex: Supermercado, Salário, Netflix..."
          />
        </div>

        {/* Data */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Data *
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={hoje}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
          />
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
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white transition"
          >
            <option value="">Selecione uma categoria...</option>
            {categorias.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Método */}
        <div>
          <label htmlFor="method" className="block text-sm font-medium text-gray-700 mb-1">
            Método de Pagamento *
          </label>
          <select
            id="method"
            name="method"
            required
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white transition"
          >
            <option value="">Selecione um método...</option>
            {metodos.map((m) => (
              <option key={m} value={m}>{m}</option>
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
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            placeholder="Ex: Nubank, Itaú, Carteira..."
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 border-2 rounded-xl px-4 py-3 cursor-pointer transition has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 border-gray-200">
              <input
                type="radio"
                name="status"
                value="confirmado"
                defaultChecked
                className="accent-emerald-600"
              />
              <span className="text-sm font-medium text-gray-700">✓ Confirmado</span>
            </label>
            <label className="flex items-center gap-2 border-2 rounded-xl px-4 py-3 cursor-pointer transition has-[:checked]:border-amber-500 has-[:checked]:bg-amber-50 border-gray-200">
              <input type="radio" name="status" value="pendente" className="accent-amber-500" />
              <span className="text-sm font-medium text-gray-700">⏳ Pendente</span>
            </label>
          </div>
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
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none transition"
            placeholder="Alguma anotação adicional..."
          />
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-2">
          <Link
            href="/"
            className="flex-1 text-center px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition text-sm font-medium"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition text-sm"
          >
            Salvar Transação
          </button>
        </div>
      </form>
    </div>
  )
}
