import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, ZoomIn, ZoomOut, Calendar } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { SeverityBadge } from '@/components/ui/SeverityBadge'
import { api } from '@/services/api'
import { useStore } from '@/store/useStore'
import { TimelineEvent, Project } from '@/types'

export function Timeline() {
  const { projects } = useStore()
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id)
    }
  }, [projects])

  useEffect(() => {
    if (selectedProject) {
      loadTimeline(selectedProject)
    }
  }, [selectedProject])

  const loadTimeline = async (projectId: number) => {
    setLoading(true)
    try {
      const data = await api.getTimeline(projectId)
      setEvents(data.events || [])
    } catch (err) {
      console.error('Failed to load timeline')
    } finally {
      setLoading(false)
    }
  }

  const filteredEvents = events.filter((event) => {
    if (severityFilter !== 'all' && event.severity !== severityFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        event.event_name?.toLowerCase().includes(q) ||
        event.computer_name?.toLowerCase().includes(q) ||
        event.user_name?.toLowerCase().includes(q) ||
        event.description?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const groupedByDate = filteredEvents.reduce<Record<string, TimelineEvent[]>>((acc, event) => {
    const date = event.timestamp ? new Date(event.timestamp).toLocaleDateString() : 'Unknown'
    if (!acc[date]) acc[date] = []
    acc[date].push(event)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Event Timeline</h1>
          <p className="text-gray-400 text-sm mt-1">Interactive timeline of security events</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedProject || ''}
            onChange={(e) => setSelectedProject(parseInt(e.target.value))}
            className="input-cyber text-sm"
          >
            {projects.map((p: Project) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-1.5 hover:bg-white/10 rounded">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-400 w-8 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-1.5 hover:bg-white/10 rounded">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events..."
            className="input-cyber w-full pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'critical', 'high', 'medium', 'low', 'info'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                severityFilter === sev
                  ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {sev.charAt(0).toUpperCase() + sev.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <GlassCard className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-neon-blue" />
          </div>
        ) : Object.keys(groupedByDate).length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3" />
            <p>No events found matching your filters</p>
          </div>
        ) : (
          <div
            className="space-y-8 overflow-x-auto"
            style={{ transform: `scaleX(${zoom})`, transformOrigin: 'left center' }}
          >
            {Object.entries(groupedByDate).map(([date, dateEvents]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-neon-blue/50 to-transparent" />
                  <span className="text-xs font-mono text-neon-blue font-semibold">{date}</span>
                  <div className="h-px flex-1 bg-gradient-to-l from-neon-blue/50 to-transparent" />
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-white/5" />
                  <div className="space-y-4">
                    {dateEvents.map((event, i) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="relative pl-10"
                      >
                        <div className={`absolute left-2.5 top-2 w-3 h-3 rounded-full border-2 ${
                          event.severity === 'critical' ? 'border-neon-red bg-neon-red/20' :
                          event.severity === 'high' ? 'border-neon-amber bg-neon-amber/20' :
                          event.severity === 'medium' ? 'border-yellow-400 bg-yellow-400/20' :
                          event.severity === 'low' ? 'border-neon-cyan bg-neon-cyan/20' :
                          'border-gray-400 bg-gray-400/20'
                        }`} />
                        <div className="glass-card p-4 hover:bg-white/10 transition-colors cursor-pointer">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <SeverityBadge severity={event.severity} />
                                <span className="text-xs text-gray-500 font-mono">
                                  {event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : ''}
                                </span>
                              </div>
                              <p className="font-medium truncate">{event.event_name}</p>
                              <p className="text-sm text-gray-400 mt-1">
                                {event.computer_name}
                                {event.user_name && <span className="text-gray-600"> · {event.user_name}</span>}
                              </p>
                              <p className="text-xs text-gray-500 mt-2 font-mono">{event.description}</p>
                            </div>
                            <span className="text-xs text-gray-500 font-mono flex-shrink-0">
                              {event.source_type}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
