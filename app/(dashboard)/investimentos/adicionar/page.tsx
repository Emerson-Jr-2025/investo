import { addInvestment } from '@/app/actions/investimentos'
import { verifySession } from '@/lib/dal'
import Link from 'next/link'

export default async function AdicionarInvestimentoPage() {
  await verifySession()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/investimentos" className="text-gray-400 hover:text-gray-600 transition">
          ← Voltar
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Novo Investimento</h1>
      </div>

      <form action={addInvestment} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-5">

        {/* Tipo */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Tipo *
          </label>
          <select
            id="type"
            name="type"
            required
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition"
          >
            <option value="">Selecione o tipo...</option>
            <option value="acao">📈 Ação (ex: PETR4, VALE3, ITUB4)</option>
            <option value="fii">🏢 FII — Fundo Imobiliário (ex: MXRF11, HGLG11)</option>
            <option value="crypto">₿ Criptomoeda (ex: BTC, ETH, SOL)</option>
            <option value="renda_fixa">🏦 Renda Fixa (CDB, LCI, Tesouro...)</option>
            <option value="outro">💼 Outro</option>
          </select>
        </div>

        {/* Nome */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nome *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none transition"
            placeholder="Ex: Petrobras, Bitcoin, CDB Nubank..."
          />
        </div>

        {/* Ticker */}
        <div>
          <label htmlFor="ticker" className="block text-sm font-medium text-gray-700 mb-1">
            Código / Ticker <span className="text-gray-400 font-normal">(para cotação automática)</span>
          </label>
          <input
            id="ticker"
            name="ticker"
            type="text"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none transition uppercase"
            placeholder="Ex: PETR4, MXRF11, BTC"
          />
          <p className="text-xs text-gray-400 mt-1">
            Ações e FIIs usam o código da B3. Cripto usa o símbolo (BTC, ETH...). Deixe em branco para renda fixa.
          </p>
        </div>

        {/* Quantidade */}
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
            Quantidade *
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            step="0.00000001"
            min="0.00000001"
            required
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none transition"
            placeholder="Ex: 100 ações, 0.005 BTC, 1 para renda fixa"
          />
          <p className="text-xs text-gray-400 mt-1">
            Para renda fixa, use 1 e coloque o valor total no preço médio.
          </p>
        </div>

        {/* Preço médio */}
        <div>
          <label htmlFor="avgPrice" className="block text-sm font-medium text-gray-700 mb-1">
            Preço Médio de Compra (R$) *
          </label>
          <input
            id="avgPrice"
            name="avgPrice"
            type="number"
            step="0.01"
            min="0.01"
            required
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none transition text-lg"
            placeholder="0.00"
          />
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-2">
          <Link
            href="/investimentos"
            className="flex-1 text-center px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition text-sm font-medium"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition text-sm"
          >
            Salvar Investimento
          </button>
        </div>
      </form>
    </div>
  )
}
