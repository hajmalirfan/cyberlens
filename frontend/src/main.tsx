import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { UploadLogs } from './pages/UploadLogs'
import { Timeline } from './pages/Timeline'
import { AttackGraph } from './pages/AttackGraph'
import { EvidenceViewer } from './pages/EvidenceViewer'
import { InvestigationPage } from './pages/Investigation'
import { Chat } from './pages/Chat'
import { Reports } from './pages/Reports'
import { Settings } from './pages/Settings'
import { Profile } from './pages/Profile'
import { useStore } from './store/useStore'
import './styles/globals.css'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useStore()
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<UploadLogs />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/attack-graph" element={<AttackGraph />} />
          <Route path="/evidence" element={<EvidenceViewer />} />
          <Route path="/investigation" element={<InvestigationPage />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
