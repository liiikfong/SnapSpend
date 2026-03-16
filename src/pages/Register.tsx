import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

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
    setTimeout(() => navigate('/record', { replace: true }), 1500)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-center text-slate-100 mb-2">SnapSpend</h1>
        <p className="text-slate-400 text-center text-sm mb-8">注册账号，多设备同步记账</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm px-4 py-3">
              {success}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-400 mb-1">
              邮箱
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-600 text-slate-100 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-400 mb-1">
              密码（至少 6 位）
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-600 text-slate-100 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-3 transition disabled:opacity-50"
          >
            {submitting ? '注册中…' : '注册'}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-400 text-sm">
          已有账号？{' '}
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300">
            登录
          </Link>
        </p>
      </div>
    </div>
  )
}
