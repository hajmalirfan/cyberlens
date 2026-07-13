import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Download,
  FileText,
  Server,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { SeverityBadge } from '@/components/ui/SeverityBadge'
import { StatCard } from '@/components/ui/StatCard'
import { api } from '@/services/api'
import { useStore } from '@/store/useStore'
import { DashboardData, Project } from '@/types'

export function Dashboard() {
  const navigate = useNavigate()
  const { projects, setProjects, setCurrentProject } = useStore()
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      loadDashboard(selectedProject)
    }
  }, [selectedProject])

  const loadProjects = async () => {
    try {
      const data = await api.getProjects()
      setProjects(data)
      if (data.length > 0) {
        setSelectedProject(data[0].id)
        setCurrentProject(data[0])
      }
    } catch (err) {
      console.error('Failed to load projects')
    }
  }

  const loadDashboard = async (projectId: number) => {
    setLoading(true)
    try {
      const data = await api.getDashboard(projectId)
      setDashboard(data)
    } catch (err) {
      console.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-neon-blue" />
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="text-center py-16">
        <Shield className="w-16 h-16 mx-auto text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Project Selected</h2>
        <p className="text-gray-400 mb-6">Create or select a project to view the dashboard</p>
        <button onClick={() => navigate('/upload')} className="btn-cyber-primary">
          Create Project
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">{dashboard.project_name}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedProject || ''}
            onChange={(e) => {
              const id = parseInt(e.target.value)
              setSelectedProject(id)
              const proj = projects.find((p) => p.id === id)
              if (proj) setCurrentProject(proj)
            }}
            className="input-cyber text-sm"
          >
            {projects.map((p: Project) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button onClick={() => navigate('/investigation')} className="btn-cyber-primary text-sm">
            <Zap className="w-4 h-4 inline mr-2" />
            New Investigation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Logs"
          value={dashboard.total_logs.toLocaleString()}
          icon={<FileText className="w-5 h-5 text-neon-blue" />}
          color="from-neon-blue to-neon-purple"
        />
        <StatCard
          title="Critical Events"
          value={dashboard.critical_events}
          icon={<AlertTriangle className="w-5 h-5 text-neon-red" />}
          color="from-neon-red to-neon-pink"
        />
        <StatCard
          title="Attack Score"
          value={`${dashboard.attack_score}%`}
          icon={<Activity className="w-5 h-5 text-neon-amber" />}
          color="from-neon-amber to-neon-red"
        />
        <StatCard
          title="Attack Type"
          value={dashboard.attack_type}
          icon={<TrendingUp className="w-5 h-5 text-neon-cyan" />}
          color="from-neon-cyan to-neon-blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Recent Events</h3>
          <div className="space-y-3">
            {dashboard.recent_events?.slice(0, 8).map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => navigate('/timeline')}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <SeverityBadge severity={event.severity} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{event.event_name}</p>
                    <p className="text-xs text-gray-500">{event.computer_name}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500 font-mono flex-shrink-0 ml-4">
                  {event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : ''}
                </span>
              </motion.div>
            ))}
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard>
            <h3 className="text-lg font-semibold mb-4">Severity Breakdown</h3>
            <div className="space-y-3">
              {[
                { label: 'Critical', value: dashboard.severity_breakdown.critical, color: 'bg-neon-red' },
                { label: 'High', value: dashboard.severity_breakdown.high, color: 'bg-neon-amber' },
                { label: 'Medium', value: dashboard.severity_breakdown.medium, color: 'bg-yellow-400' },
                { label: 'Low', value: dashboard.severity_breakdown.low, color: 'bg-neon-cyan' },
                { label: 'Info', value: dashboard.severity_breakdown.info, color: 'bg-gray-400' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 w-20">{item.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color} transition-all duration-500`}
                      style={{
                        width: `${dashboard.total_logs > 0 ? (item.value / dashboard.total_logs) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-mono text-gray-300 w-16 text-right">{item.value}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-lg font-semibold mb-4">Recent Uploads</h3>
            <div className="space-y-3">
              {dashboard.recent_uploads?.slice(-4).reverse().map((upload) => (
                <div key={upload.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <Download className="w-4 h-4 text-gray-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate">{upload.filename}</p>
                    <p className="text-xs text-gray-500">
                      {upload.total_events} events · {upload.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
