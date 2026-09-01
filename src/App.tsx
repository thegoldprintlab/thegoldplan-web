import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import Auth from './components/Auth'
import Nav from './components/Nav'
import ThemeSwitcher from './components/ThemeSwitcher'
import Dashboard from './pages/Dashboard'
import InputForm from './pages/InputForm'
import TradingLog from './pages/TradingLog'
import SettingsPage from './pages/Settings'
import Landing from './pages/Landing'
import { getSupabase } from './lib/supabase'

function Shell() {
  const { session, loading, configured } = useAuth()

  if (!configured) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-mark" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2.5 21 7v10l-9 4.5L3 17V7l9-4.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M3 7l9 4.5L21 7M12 11.5V21.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="auth-title">The Gold Plan</h1>
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
          <span className="avatar" aria-hidden="true">
            {session.user.email?.[0]?.toUpperCase() ?? 'G'}
          </span>
          <span className="user-email">{session.user.email}</span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={async () => {
              await getSupabase().auth.signOut()
            }}
          >
            Log out
          </button>
          <ThemeSwitcher />
        </div>
      </div>
      <main className="main">
        <DataProvider>
          <Routes>
            <Route path="/input" element={<InputForm />} />
            <Route path="/log" element={<TradingLog />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Dashboard />} />
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
        <Routes>
          {/* Public landing page — no login needed */}
          <Route path="/" element={<Landing />} />
          {/* The authenticated app */}
          <Route path="/app/*" element={<Shell />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
