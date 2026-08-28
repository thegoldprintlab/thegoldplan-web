import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import Auth from './components/Auth'
import Nav from './components/Nav'
import Dashboard from './pages/Dashboard'
import InputForm from './pages/InputForm'
import TradingLog from './pages/TradingLog'
import SettingsPage from './pages/Settings'
import { getSupabase } from './lib/supabase'

function Shell() {
  const { session, loading, configured } = useAuth()

  if (!configured) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-title">◈ The Gold Plan</div>
          <p className="auth-sub">
            App is not connected to Supabase yet. Add <code>VITE_SUPABASE_URL</code> and{' '}
            <code>VITE_SUPABASE_ANON_KEY</code> to your <code>.env</code> file, then rebuild.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="page-loading">Loading…</div>
  }

  if (!session) {
    return <Auth />
  }

  return (
    <div className="app-shell">
      <div className="topbar">
        <Nav />
        <div className="userbox">
          <span className="muted">{session.user.email}</span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={async () => {
              await getSupabase().auth.signOut()
            }}
          >
            Log out
          </button>
        </div>
      </div>
      <main className="main">
        <DataProvider>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/input" element={<InputForm />} />
            <Route path="/log" element={<TradingLog />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DataProvider>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </BrowserRouter>
  )
}
