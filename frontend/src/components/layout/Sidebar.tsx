import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  Activity,
  BarChart3,
  FileSearch,
  GitBranch,
  MessageSquare,
  ScrollText,
  Settings,
  Shield,
  Upload,
  User,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useStore } from '@/store/useStore'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/upload', label: 'Upload Logs', icon: Upload },
  { path: '/timeline', label: 'Timeline', icon: BarChart3 },
  { path: '/attack-graph', label: 'Attack Graph', icon: GitBranch },
  { path: '/evidence', label: 'Evidence Viewer', icon: FileSearch },
  { path: '/investigation', label: 'AI Investigation', icon: Activity },
  { path: '/chat', label: 'Investigation Chat', icon: MessageSquare },
  { path: '/reports', label: 'Reports', icon: ScrollText },
]

const bottomItems = [
  { path: '/profile', label: 'Profile', icon: User },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useStore()

  return (
    <aside className={clsx(
      'fixed left-0 top-0 h-full z-40 transition-all duration-300 ease-in-out',
      'bg-cyber-900/80 backdrop-blur-xl border-r border-white/5',
      sidebarOpen ? 'w-64' : 'w-20'
    )}>
      <div className="flex flex-col h-full">
        <div className={clsx(
          'flex items-center h-16 px-4 border-b border-white/5',
          sidebarOpen ? 'justify-between' : 'justify-center'
        )}>
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-neon-blue" />
              <div>
                <h1 className="text-lg font-bold text-gradient">CyberLens</h1>
                <p className="text-[10px] text-gray-500 font-mono">AI SECURITY PLATFORM</p>
              </div>
            </div>
          )}
          {!sidebarOpen && <Shield className="w-8 h-8 text-neon-blue" />}
        </div>

        <nav className="flex-1 py-4 space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                'hover:bg-white/10 hover:text-white',
                isActive
                  ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/30'
                  : 'text-gray-400',
                !sidebarOpen && 'justify-center'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/5 py-3 px-3 space-y-1">
          {bottomItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                'hover:bg-white/10 hover:text-white',
                isActive ? 'text-white bg-white/10' : 'text-gray-400',
                !sidebarOpen && 'justify-center'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
            </NavLink>
          ))}
        </div>

        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center h-10 border-t border-white/5 text-gray-500 hover:text-white transition-colors"
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  )
}
