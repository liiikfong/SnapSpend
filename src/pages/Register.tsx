import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)
    const { error: err } = await signUp(email, password)
    setSubmitting(false)
    if (err) {
      setError(err.message)
      return
    }
    setSuccess('注册成功。请查收邮件确认（若 Supabase 开启了邮件确认），或直接登录。')
    const redirect = searchParams.get('redirect')
    setTimeout(() => navigate(redirect?.startsWith('/') ? redirect : '/ledger', { replace: true }), 1500)
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(95%_72%_at_0%_0%,rgba(255,56,92,0.14),transparent_58%),radial-gradient(95%_72%_at_100%_0%,rgba(255,183,94,0.12),transparent_55%),linear-gradient(180deg,#fffdfb_0%,#fff7f8_52%,#fffdfb_100%)] px-4 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_24px_56px_rgba(15,23,42,0.12)] backdrop-blur">
          <h1 className="mb-2 text-center text-2xl font-semibold text-slate-900">SnapSpend</h1>
          <p className="mb-8 text-center text-sm text-slate-500">注册账号，多设备同步记账</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
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
                密码（至少 6 位）
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF385C]/30"
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#FF385C] py-3 font-medium text-white shadow-sm transition hover:bg-[#e43253] disabled:opacity-50"
            >
              {submitting ? '注册中…' : '注册'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            已有账号？{' '}
            <Link to="/login" className="font-medium text-[#FF385C] hover:text-[#e43253]">
              登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
