'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { analisarExtrato, salvarTransacoes, TransacaoParsed } from '@/app/actions/extrato'

type TransacaoPreview = TransacaoParsed & {
  selecionada: boolean
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default function ExtratoPage() {
  const router = useRouter()
  const [texto, setTexto] = useState('')
  const [step, setStep] = useState<'input' | 'preview'>('input')
  const [transacoes, setTransacoes] = useState<TransacaoPreview[]>([])
  const [conta, setConta] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleAnalisar() {
    setErro('')
    setLoading(true)
    const result = await analisarExtrato(texto)
    setLoading(false)

    if (result.error) {
      setErro(result.error)
      return
    }

    setTransacoes((result.transactions ?? []).map((t) => ({ ...t, selecionada: true })))
    setStep('preview')
  }

  async function handleSalvar() {
    const selecionadas = transacoes.filter((t) => t.selecionada)

    if (selecionadas.length === 0) {
      setErro('Selecione pelo menos uma transação.')
      return
    }
    if (!conta.trim()) {
      setErro('Informe o nome da conta antes de salvar.')
      return
    }

    setErro('')
    setSaving(true)
    const result = await salvarTransacoes(
      selecionadas.map((t) => ({ ...t, account: conta, status: 'confirmado' }))
    )
    setSaving(false)

    if (result.error) {
      setErro(result.error)
      return
    }

    router.push('/')
  }

  function toggleAll(valor: boolean) {
    setTransacoes((prev) => prev.map((t) => ({ ...t, selecionada: valor })))
  }

  function toggleTipo(idx: number) {
    setTransacoes((prev) =>
      prev.map((t, i) =>
        i === idx ? { ...t, type: t.type === 'entrada' ? 'saida' : 'entrada' } : t
      )
    )
  }

  const qtdSelecionadas = transacoes.filter((t) => t.selecionada).length

  // ──────────────── STEP 1: colar extrato ────────────────
  if (step === 'input') {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition">
            ← Voltar
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Importar Extrato com IA</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <p className="text-blue-800 text-sm font-semibold mb-1">Como usar:</p>
            <ol className="text-blue-700 text-sm space-y-0.5 list-decimal list-inside">
              <li>Abra o app do seu banco e acesse o extrato</li>
              <li>Selecione e copie o texto das transações</li>
              <li>Cole abaixo e clique em "Analisar com IA"</li>
              <li>Revise o resultado e confirme o que quiser salvar</li>
            </ol>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Texto do extrato
            </label>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono text-sm resize-none transition"
              placeholder={`Cole aqui o texto copiado do seu banco. Exemplo:

01/06 PIX RECEBIDO - EMPRESA SA          +4.500,00
02/06 COMPRA SUPERMERCADO EXTRA          -312,50
03/06 PIX ENVIADO NETFLIX                 -39,90
04/06 COMPRA FARMACIA DROGASIL            -52,00
04/06 SALDO                             3.595,60`}
            />
          </div>

          {erro && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-lg border border-red-200">
              {erro}
            </div>
          )}

          <button
            onClick={handleAnalisar}
            disabled={loading || !texto.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <span className="inline-block animate-spin">⟳</span>
                Analisando com IA...
              </>
            ) : (
              '🤖 Analisar com IA'
            )}
          </button>
        </div>
      </div>
    )
  }

  // ──────────────── STEP 2: revisar e confirmar ────────────────
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setStep('input')} className="text-gray-400 hover:text-gray-600 transition">
          ← Reanalisar
        </button>
        <h1 className="text-xl font-bold text-gray-900">Revisar Transações</h1>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
        <p className="text-emerald-800 text-sm">
          A IA identificou <strong>{transacoes.length} transações</strong>. Revise, ajuste o tipo
          se necessário, desmarque as que não quiser e confirme.
        </p>
      </div>

      {/* Conta */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Conta <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={conta}
          onChange={(e) => setConta(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none transition"
          placeholder="Ex: Nubank, Itaú, Bradesco..."
        />
        <p className="text-xs text-gray-400 mt-1">Será aplicada a todas as transações salvas</p>
      </div>

      {erro && (
        <div className="mb-4 bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-lg border border-red-200">
          {erro}
        </div>
      )}

      {/* Lista */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50 text-xs">
          <button onClick={() => toggleAll(true)} className="text-emerald-600 hover:underline font-medium">
            Selecionar todas
          </button>
          <span className="text-gray-500">{qtdSelecionadas} de {transacoes.length}</span>
          <button onClick={() => toggleAll(false)} className="text-red-500 hover:underline font-medium">
            Desmarcar todas
          </button>
        </div>

        <ul className="divide-y divide-gray-50">
          {transacoes.map((t, i) => (
            <li key={i} className={`flex items-center gap-3 px-4 py-3 transition ${!t.selecionada ? 'opacity-40' : ''}`}>
              <input
                type="checkbox"
                checked={t.selecionada}
                onChange={(e) =>
                  setTransacoes((prev) =>
                    prev.map((item, idx) =>
                      idx === i ? { ...item, selecionada: e.target.checked } : item
                    )
                  )
                }
                className="w-4 h-4 accent-emerald-600 flex-shrink-0"
              />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{t.description}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {t.date} · {t.category} · {t.method}
                </p>
              </div>

              <button
                onClick={() => toggleTipo(i)}
                title="Clique para alternar entre entrada e saída"
                className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 transition ${
                  t.type === 'entrada'
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
              >
                {t.type === 'entrada' ? '↑ entrada' : '↓ saída'}
              </button>

              <span
                className={`text-sm font-semibold tabular-nums flex-shrink-0 ${
                  t.type === 'entrada' ? 'text-emerald-600' : 'text-red-500'
                }`}
              >
                {t.type === 'entrada' ? '+' : '-'}
                {formatCurrency(t.amount)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setStep('input')}
          className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition text-sm font-medium"
        >
          ← Reanalisar
        </button>
        <button
          onClick={handleSalvar}
          disabled={saving || qtdSelecionadas === 0}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition text-sm"
        >
          {saving
            ? 'Salvando...'
            : `✓ Salvar ${qtdSelecionadas} transaç${qtdSelecionadas === 1 ? 'ão' : 'ões'}`}
        </button>
      </div>
    </div>
  )
}
