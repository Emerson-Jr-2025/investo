import { verifySession } from '@/lib/dal'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { removeInvestment } from '@/app/actions/investimentos'
import type { Investment } from '@prisma/client'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const fmtPct = (v: number) =>
  `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`

// ── Busca cotações na brapi.dev (B3: ações e FIIs) ──────────────────────────
async function getStockQuotes(tickers: string[]): Promise<Record<string, number>> {
  if (tickers.length === 0) return {}
  try {
    const url = `https://brapi.dev/api/quote/${tickers.join(',')}?fundamental=false`
    const res = await fetch(url, { next: { revalidate: 300 } })
    const data = await res.json()
    return Object.fromEntries(
      (data.results ?? []).map((r: { symbol: string; regularMarketPrice: number }) => [
        r.symbol,
        r.regularMarketPrice,
      ])
    )
  } catch {
    return {}
  }
}

// ── Busca cotações de cripto na brapi.dev ────────────────────────────────────
async function getCryptoQuotes(tickers: string[]): Promise<Record<string, number>> {
  if (tickers.length === 0) return {}
  try {
    const url = `https://brapi.dev/api/v2/crypto?coin=${tickers.join(',')}&currency=BRL`
    const res = await fetch(url, { next: { revalidate: 300 } })
    const data = await res.json()
    return Object.fromEntries(
      (data.coins ?? []).map((c: { coin: string; regularMarketPrice: number }) => [
        c.coin,
        c.regularMarketPrice,
      ])
    )
  } catch {
    return {}
  }
}

const typeLabel: Record<string, string> = {
  acao: 'Ação',
  fii: 'FII',
  crypto: 'Cripto',
  renda_fixa: 'Renda Fixa',
  outro: 'Outro',
}

const typeIcon: Record<string, string> = {
  acao: '📈',
  fii: '🏢',
  crypto: '₿',
  renda_fixa: '🏦',
  outro: '💼',
}

const aprendizado = [
  {
    titulo: '📈 Ações',
    resumo: 'Pequenas fatias de empresas negociadas na bolsa.',
    conteudo:
      'Ao comprar uma ação (ex: PETR4, VALE3), você se torna sócio de uma empresa. O lucro vem de dividendos e da valorização do papel. Ações têm risco maior, mas potencial de retorno alto no longo prazo.',
  },
  {
    titulo: '🏢 FIIs — Fundos Imobiliários',
    resumo: 'Invista em imóveis sem comprar um imóvel.',
    conteudo:
      'FIIs reúnem vários investidores para comprar imóveis (shoppings, galpões, hospitais). Você recebe aluguel mensalmente como dividendo. É uma ótima forma de ter renda passiva com valores acessíveis.',
  },
  {
    titulo: '🏦 Tesouro Direto',
    resumo: 'Empreste dinheiro ao governo e receba com juros.',
    conteudo:
      'É o investimento mais seguro do Brasil. Você compra títulos do governo federal e recebe de volta com juros. Existem opções prefixadas, pós-fixadas (Selic) e atreladas à inflação (IPCA+). Ideal para reserva de emergência e metas de médio prazo.',
  },
  {
    titulo: '💳 Renda Fixa (CDB, LCI, LCA)',
    resumo: 'Empreste para bancos com retorno garantido.',
    conteudo:
      'CDB, LCI e LCA são investimentos de renda fixa de bancos. O retorno é definido na contratação (ex: 110% do CDI). CDBs têm proteção do FGC de até R$ 250 mil por banco. Ótimos para objetivos de 1 a 3 anos.',
  },
  {
    titulo: '₿ Criptomoedas',
    resumo: 'Ativos digitais descentralizados de alto risco.',
    conteudo:
      'Bitcoin, Ethereum e outras criptos são moedas digitais sem controle de governos. Podem valorizar muito, mas também cair bastante. Recomenda-se destinar no máximo 5-10% da carteira e só investir o que pode perder.',
  },
  {
    titulo: '🎯 Diversificação',
    resumo: 'Não coloque todos os ovos na mesma cesta.',
    conteudo:
      'Diversificar é distribuir seus investimentos entre diferentes tipos de ativos. Se um cai, outro pode compensar. Uma carteira equilibrada costuma ter: reserva de emergência (Selic), renda fixa (CDB/Tesouro), ações/FIIs e uma pequena parte em cripto.',
  },
]

export default async function InvestimentosPage() {
  await verifySession()

  const investments = await prisma.investment.findMany({ orderBy: { createdAt: 'desc' } })

  // Separar tickers por tipo
  const stockTickers = investments
    .filter((i: Investment) => (i.type === 'acao' || i.type === 'fii') && i.ticker)
    .map((i: Investment) => i.ticker!)

  const cryptoTickers = investments
    .filter((i: Investment) => i.type === 'crypto' && i.ticker)
    .map((i: Investment) => i.ticker!)

  const [stockQuotes, cryptoQuotes] = await Promise.all([
    getStockQuotes(stockTickers),
    getCryptoQuotes(cryptoTickers),
  ])

  const allQuotes: Record<string, number> = { ...stockQuotes, ...cryptoQuotes }

  // Calcular valores de cada investimento
  const investimentsWithValues = investments.map((inv: Investment) => {
    const invested = inv.quantity * inv.avgPrice
    const currentPrice = inv.ticker ? allQuotes[inv.ticker] ?? null : null
    const currentValue = currentPrice !== null ? inv.quantity * currentPrice : invested
    const profit = currentValue - invested
    const profitPct = invested > 0 ? (profit / invested) * 100 : 0
    return { ...inv, invested, currentValue, profit, profitPct, currentPrice }
  })

  const totalInvested = investimentsWithValues.reduce((s, i) => s + i.invested, 0)
  const totalCurrent = investimentsWithValues.reduce((s, i) => s + i.currentValue, 0)
  const totalProfit = totalCurrent - totalInvested
  const totalProfitPct = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Investimentos</h1>
        <Link
          href="/investimentos/adicionar"
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition"
        >
          + Adicionar
        </Link>
      </div>

      {/* Resumo da carteira */}
      <div className="bg-emerald-600 text-white rounded-2xl p-6 shadow-sm">
        <p className="text-emerald-100 text-sm font-medium">Valor Total da Carteira</p>
        <p className="text-4xl font-bold mt-1 tabular-nums">{fmt(totalCurrent)}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-emerald-200 text-sm">
            Investido: {fmt(totalInvested)}
          </span>
          <span
            className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
              totalProfit >= 0 ? 'bg-emerald-500 text-white' : 'bg-red-400 text-white'
            }`}
          >
            {totalProfit >= 0 ? '+' : ''}{fmt(totalProfit)} ({fmtPct(totalProfitPct)})
          </span>
        </div>
      </div>

      {/* Lista de investimentos */}
      {investments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 text-center py-12 px-4">
          <p className="text-3xl mb-2">📊</p>
          <p className="text-gray-500 text-sm font-medium">Nenhum investimento cadastrado</p>
          <Link
            href="/investimentos/adicionar"
            className="text-emerald-600 text-sm hover:underline mt-1 block"
          >
            Adicionar primeiro investimento
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-700">Carteira</p>
          </div>
          <ul className="divide-y divide-gray-50">
            {investimentsWithValues.map((inv) => (
              <li key={inv.id} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
                    {typeIcon[inv.type]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {inv.ticker ?? inv.name}
                      </p>
                      <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {typeLabel[inv.type]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {inv.quantity.toLocaleString('pt-BR')} × {fmt(inv.avgPrice)} médio
                      {inv.ticker && inv.currentPrice
                        ? ` · Atual: ${fmt(inv.currentPrice)}`
                        : inv.type === 'renda_fixa' || inv.type === 'outro'
                        ? ' · Valor manual'
                        : ' · Cotação indisponível'}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-900 tabular-nums">
                      {fmt(inv.currentValue)}
                    </span>
                    <span
                      className={`text-xs font-medium tabular-nums ${
                        inv.profit >= 0 ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {inv.profit >= 0 ? '+' : ''}{fmt(inv.profit)} ({fmtPct(inv.profitPct)})
                    </span>
                  </div>

                  <form action={removeInvestment.bind(null, inv.id)}>
                    <button
                      type="submit"
                      className="text-gray-300 hover:text-red-400 transition text-lg ml-1"
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

      {/* Área de aprendizado */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">📚 Aprender sobre Investimentos</h2>
        <div className="space-y-3">
          {aprendizado.map((item) => (
            <details
              key={item.titulo}
              className="bg-white rounded-xl shadow-sm border border-gray-100 group"
            >
              <summary className="px-4 py-3.5 cursor-pointer flex items-center justify-between list-none">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.titulo}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.resumo}</p>
                </div>
                <span className="text-gray-400 group-open:rotate-180 transition-transform text-lg">
                  ▾
                </span>
              </summary>
              <div className="px-4 pb-4 pt-1 text-sm text-gray-600 leading-relaxed border-t border-gray-50">
                {item.conteudo}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  )
}
