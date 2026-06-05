import { logout } from '@/app/actions/auth'
import Link from 'next/link'

const navItems = [
  { href: '/', icon: '⬛', label: 'Dashboard', emoji: '▣' },
  { href: '/transacoes/nova', icon: '＋', label: 'Nova Transação', emoji: '✚' },
  { href: '/extrato', icon: '⬜', label: 'Importar Extrato', emoji: '⇪' },
  { href: '/contas', icon: '⬜', label: 'Contas', emoji: '⊟' },
  { href: '/investimentos', icon: '⬜', label: 'Investimentos', emoji: '↗' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* ── SIDEBAR DESKTOP ─────────────────────────────────────── */}
      <aside className="hidden md:flex w-60 bg-slate-900 flex-col fixed inset-y-0 left-0 z-20">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              I
            </div>
            <div>
              <p className="text-white font-bold text-base leading-none">Investo</p>
              <p className="text-slate-400 text-xs mt-0.5">Gestão Financeira</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-2">
            Principal
          </p>
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition group">
            <span className="text-slate-400 group-hover:text-emerald-400 transition text-sm">◈</span>
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
          <Link href="/transacoes/nova" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition group">
            <span className="text-slate-400 group-hover:text-emerald-400 transition text-sm">＋</span>
            <span className="text-sm font-medium">Nova Transação</span>
          </Link>

          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-2 mt-5">
            Gestão
          </p>
          <Link href="/extrato" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition group">
            <span className="text-slate-400 group-hover:text-emerald-400 transition text-sm">⇪</span>
            <span className="text-sm font-medium">Importar Extrato</span>
            <span className="ml-auto text-xs bg-emerald-500 text-white px-1.5 py-0.5 rounded font-medium">IA</span>
          </Link>
          <Link href="/contas" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition group">
            <span className="text-slate-400 group-hover:text-emerald-400 transition text-sm">⊟</span>
            <span className="text-sm font-medium">Contas a Pagar/Rec.</span>
          </Link>

          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-2 mt-5">
            Patrimônio
          </p>
          <Link href="/investimentos" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition group">
            <span className="text-slate-400 group-hover:text-emerald-400 transition text-sm">↗</span>
            <span className="text-sm font-medium">Investimentos</span>
          </Link>
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">
              E
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-200 text-xs font-medium truncate">Emerson Jr.</p>
              <p className="text-slate-500 text-xs truncate">Titular</p>
            </div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition text-sm"
            >
              <span>⎋</span>
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* ── CONTEÚDO PRINCIPAL ──────────────────────────────────── */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">

        {/* Header mobile */}
        <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-500 rounded-md flex items-center justify-center text-white font-bold text-xs">I</div>
            <span className="font-bold text-slate-900">Investo</span>
          </div>
          <form action={logout}>
            <button type="submit" className="text-sm text-slate-500 px-3 py-1.5 rounded-lg hover:bg-slate-100">
              Sair
            </button>
          </form>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </main>

        {/* Bottom nav mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-10">
          <div className="grid grid-cols-5 h-16">
            {[
              { href: '/', label: 'Início', icon: '▣' },
              { href: '/transacoes/nova', label: 'Transação', icon: '＋' },
              { href: '/extrato', label: 'Extrato', icon: '⇪' },
              { href: '/contas', label: 'Contas', icon: '⊟' },
              { href: '/investimentos', label: 'Carteira', icon: '↗' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-0.5 text-slate-400 hover:text-emerald-600 transition"
              >
                <span className="text-lg leading-none">{item.icon}</span>
                <span className="text-xs">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}
