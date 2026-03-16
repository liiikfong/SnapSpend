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
    <div className="min-h-screen bg-[radial-gradient(120%_80%_at_0%_0%,#1d4ed855_0%,transparent_35%),radial-gradient(120%_80%_at_100%_0%,#06b6d455_0%,transparent_35%),#030712] text-slate-100">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>
          <div className="text-right">
            <p className="max-w-[140px] truncate text-xs text-slate-400">{user?.email}</p>
            <button
              type="button"
              onClick={() => signOut()}
              className="text-xs text-cyan-300 hover:text-cyan-200"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-24 pt-5">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-around px-4 py-2">
          <Link
            to="/record"
            className={`flex w-1/2 flex-col items-center rounded-xl py-2 text-xs ${
              active === 'capture' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
            }`}
          >
            <span className="text-base">✦</span>
            录入
          </Link>
          <Link
            to="/ledger"
            className={`flex w-1/2 flex-col items-center rounded-xl py-2 text-xs ${
              active === 'ledger' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
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
