import { Outlet, Navigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useStore } from '@/store/useStore'

export function Layout() {
  const { token, sidebarOpen } = useStore()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-cyber-950 hex-grid-bg">
      <Sidebar />
      <div className={clsx(
        'transition-all duration-300',
        sidebarOpen ? 'ml-64' : 'ml-20'
      )}>
        <Header />
        <main className="p-6 pt-20">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
