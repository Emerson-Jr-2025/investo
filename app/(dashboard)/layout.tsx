import { logout } from '@/app/actions/auth'
import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <span className="text-xl font-bold text-gray-900">Investo</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/contas"
              className="text-sm text-gray-600 hover:text-gray-900 transition px-3 py-1.5 rounded-lg hover:bg-gray-100 font-medium"
            >
              📅 Contas
            </Link>
            <Link
              href="/extrato"
              className="text-sm text-gray-600 hover:text-gray-900 transition px-3 py-1.5 rounded-lg hover:bg-gray-100 font-medium"
            >
              📄 Importar
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-gray-800 transition px-3 py-1.5 rounded-lg hover:bg-gray-100"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
