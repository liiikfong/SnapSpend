import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error: err } = await signIn(email, password)
    setSubmitting(false)
    if (err) {
      setError(err.message === 'Invalid login credentials' ? '邮箱或密码错误' : err.message)
      return
    }
    navigate('/ledger', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(90%_70%_at_0%_0%,rgba(56,189,248,0.16),transparent_58%),radial-gradient(90%_70%_at_100%_0%,rgba(16,185,129,0.12),transparent_52%),linear-gradient(180deg,#f8fbff_0%,#eef5ff_55%,#f8fbff_100%)] px-4 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_24px_56px_rgba(15,23,42,0.12)] backdrop-blur">
          <h1 className="mb-2 text-center text-2xl font-semibold text-slate-900">SnapSpend</h1>
          <p className="mb-8 text-center text-sm text-slate-500">登录以同步记账数据</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-600">
                邮箱
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-600">
                密码
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-cyan-600 py-3 font-medium text-white shadow-sm transition hover:bg-cyan-500 disabled:opacity-50"
            >
              {submitting ? '登录中…' : '登录'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            还没有账号？{' '}
            <Link to="/register" className="font-medium text-cyan-700 hover:text-cyan-600">
              注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
