import { Routes, Route, Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import CapturePage from '@/pages/CapturePage'
import LedgerPage from '@/pages/LedgerPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        加载中…
      </div>
    )
  }
  if (!user) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }
  return <>{children}</>
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect')
  const safeRedirect = redirect?.startsWith('/') ? redirect : '/ledger'
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        加载中…
      </div>
    )
  }
  if (user) {
    return <Navigate to={safeRedirect} replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/record"
        element={
          <ProtectedRoute>
            <CapturePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ledger"
        element={
          <ProtectedRoute>
            <LedgerPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/ledger" replace />} />
      <Route path="*" element={<Navigate to="/ledger" replace />} />
    </Routes>
  )
}
