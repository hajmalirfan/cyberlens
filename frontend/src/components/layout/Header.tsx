import { Bell, LogOut, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'

export function Header() {
  const { user, logout } = useStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="fixed top-0 right-0 left-0 z-30 h-16 bg-cyber-950/80 backdrop-blur-xl border-b border-white/5"
      style={{ marginLeft: 'inherit' }}>
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search events, systems, users..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-300 placeholder-gray-600 focus:border-neon-blue/50 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-neon-red rounded-full animate-pulse-glow" />
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-white/10">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-200">{user?.full_name || user?.username}</p>
              <p className="text-xs text-gray-500 font-mono uppercase">{user?.role}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-xs font-bold text-white">
              {(user?.full_name || user?.username || 'U').charAt(0).toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-neon-red transition-colors rounded-lg hover:bg-white/5"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
