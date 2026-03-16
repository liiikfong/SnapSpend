import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

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
    const redirect = searchParams.get('redirect')
    navigate(redirect?.startsWith('/') ? redirect : '/ledger', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(95%_72%_at_0%_0%,rgba(255,56,92,0.14),transparent_58%),radial-gradient(95%_72%_at_100%_0%,rgba(255,183,94,0.12),transparent_55%),linear-gradient(180deg,#fffdfb_0%,#fff7f8_52%,#fffdfb_100%)] px-4 py-10">
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
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF385C]/30"
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
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF385C]/30"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#FF385C] py-3 font-medium text-white shadow-sm transition hover:bg-[#e43253] disabled:opacity-50"
            >
              {submitting ? '登录中…' : '登录'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            还没有账号？{' '}
            <Link to="/register" className="font-medium text-[#FF385C] hover:text-[#e43253]">
              注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
