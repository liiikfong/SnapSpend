import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

type Props = {
  active: 'capture' | 'ledger'
  title: string
  subtitle: string
  children: ReactNode
}

export default function MobileShell({ active, title, subtitle, children }: Props) {
  const { user, signOut } = useAuth()
  return (
    <div className="min-h-screen text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
          <div className="text-right">
            <p className="max-w-[140px] truncate text-xs text-slate-500">{user?.email}</p>
            <button
              type="button"
              onClick={() => signOut()}
              className="text-xs font-medium text-cyan-700 hover:text-cyan-600"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-24 pt-5">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-around px-4 py-2">
          <Link
            to="/record"
            className={`flex w-1/2 flex-col items-center rounded-xl py-2 text-xs ${
              active === 'capture' ? 'bg-cyan-100 text-cyan-700' : 'text-slate-500'
            }`}
          >
            <span className="text-base">✦</span>
            录入
          </Link>
          <Link
            to="/ledger"
            className={`flex w-1/2 flex-col items-center rounded-xl py-2 text-xs ${
              active === 'ledger' ? 'bg-cyan-100 text-cyan-700' : 'text-slate-500'
            }`}
          >
            <span className="text-base">☰</span>
            账单
          </Link>
        </div>
      </nav>
    </div>
  )
}
