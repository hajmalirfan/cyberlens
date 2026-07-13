import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, FileText, Filter, ExternalLink } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { SeverityBadge } from '@/components/ui/SeverityBadge'
import { api } from '@/services/api'
import { useStore } from '@/store/useStore'
import { NormalizedEvent, Project } from '@/types'

export function EvidenceViewer() {
  const { projects } = useStore()
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [events, setEvents] = useState<NormalizedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [severity, setSeverity] = useState('all')
  const [selectedEvent, setSelectedEvent] = useState<NormalizedEvent | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id)
    }
  }, [projects])

  useEffect(() => {
    if (selectedProject) {
      loadEvents(selectedProject)
    }
  }, [selectedProject, page])

  const loadEvents = async (projectId: number) => {
    setLoading(true)
    try {
      const data = await api.getEvents(projectId, page)
      setEvents(data)
    } catch (err) {
      console.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const filteredEvents = events.filter((e) => {
    if (severity !== 'all' && e.severity !== severity) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        e.event_name?.toLowerCase().includes(q) ||
        e.computer_name?.toLowerCase().includes(q) ||
        e.user_name?.toLowerCase().includes(q) ||
        e.ip_address?.toLowerCase().includes(q) ||
        e.command_line?.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Evidence Viewer</h1>
          <p className="text-gray-400 text-sm mt-1">Detailed view of every normalized security event</p>
        </div>
        <select
          value={selectedProject || ''}
          onChange={(e) => setSelectedProject(parseInt(e.target.value))}
          className="input-cyber text-sm"
        >
          {projects.map((p: Project) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search evidence..."
            className="input-cyber w-full pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'critical', 'high', 'medium', 'low', 'info'].map((s) => (
            <button
              key={s}
              onClick={() => setSeverity(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                severity === s
                  ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GlassCard>
            <h3 className="text-lg font-semibold mb-4">Events ({filteredEvents.length})</h3>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-neon-blue" />
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3" />
                <p>No events found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEvents.map((event, i) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => setSelectedEvent(event)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedEvent?.id === event.id
                        ? 'bg-neon-blue/10 border border-neon-blue/30'
                        : 'bg-white/5 hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <SeverityBadge severity={event.severity} />
                          <span className="text-xs text-gray-500 font-mono">
                            {event.timestamp ? new Date(event.timestamp).toLocaleString() : ''}
                          </span>
                        </div>
                        <p className="text-sm font-medium truncate">{event.event_name || 'Unknown Event'}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {event.computer_name && `${event.computer_name}`}
                          {event.user_name && ` · ${event.user_name}`}
                          {event.ip_address && ` · ${event.ip_address}`}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 font-mono flex-shrink-0">{event.event_id}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn-cyber-secondary text-xs"
              >
                Previous
              </button>
              <span className="text-xs text-gray-500">Page {page}</span>
              <button onClick={() => setPage((p) => p + 1)} className="btn-cyber-secondary text-xs">
                Next
              </button>
            </div>
          </GlassCard>
        </div>

        <div>
          <GlassCard>
            <h3 className="text-lg font-semibold mb-4">Event Details</h3>
            {selectedEvent ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={selectedEvent.severity} size="md" />
                  <span className="text-xs text-gray-500 font-mono">ID: {selectedEvent.event_id}</span>
                </div>
                <div>
                  <p className="text-lg font-semibold">{selectedEvent.event_name}</p>
                  <p className="text-sm text-gray-400">{selectedEvent.source_type?.toUpperCase()} · {selectedEvent.source_name}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-500">Timestamp</span>
                    <span className="font-mono text-xs">{selectedEvent.timestamp ? new Date(selectedEvent.timestamp).toLocaleString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-500">Computer</span>
                    <span className="font-mono text-xs">{selectedEvent.computer_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-500">User</span>
                    <span className="font-mono text-xs">{selectedEvent.user_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-500">IP Address</span>
                    <span className="font-mono text-xs">{selectedEvent.ip_address || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-500">Process</span>
                    <span className="font-mono text-xs">{selectedEvent.process_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-500">Process ID</span>
                    <span className="font-mono text-xs">{selectedEvent.process_id || 'N/A'}</span>
                  </div>
                  {selectedEvent.parent_process && (
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-gray-500">Parent Process</span>
                      <span className="font-mono text-xs">{selectedEvent.parent_process}</span>
                    </div>
                  )}
                  {selectedEvent.file_path && (
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-gray-500">File Path</span>
                      <span className="font-mono text-xs truncate max-w-[200px]">{selectedEvent.file_path}</span>
                    </div>
                  )}
                  {selectedEvent.command_line && (
                    <div className="py-1">
                      <span className="text-gray-500 text-xs block mb-1">Command Line</span>
                      <pre className="font-mono text-xs bg-cyber-950 p-2 rounded overflow-x-auto">
                        {selectedEvent.command_line}
                      </pre>
                    </div>
                  )}
                  {selectedEvent.mitre_technique_name && (
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-gray-500">MITRE Technique</span>
                      <span className="font-mono text-xs text-neon-blue">
                        {selectedEvent.mitre_technique_id} · {selectedEvent.mitre_technique_name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <ExternalLink className="w-12 h-12 mx-auto mb-3" />
                <p className="text-sm">Select an event to view details</p>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
