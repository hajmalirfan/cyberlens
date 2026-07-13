import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Calendar, Shield, Search, AlertTriangle } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { SeverityBadge } from '@/components/ui/SeverityBadge'
import { api } from '@/services/api'
import { useStore } from '@/store/useStore'
import { Investigation, Project, Report } from '@/types'

export function Reports() {
  const { projects } = useStore()
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [investigations, setInvestigations] = useState<Investigation[]>([])
  const [reports, setReports] = useState<Record<number, Report[]>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id)
    }
  }, [projects])

  useEffect(() => {
    if (selectedProject) {
      loadData(selectedProject)
    }
  }, [selectedProject])

  const loadData = async (projectId: number) => {
    setLoading(true)
    try {
      const invs = await api.listInvestigations(projectId)
      setInvestigations(invs)

      const reportMap: Record<number, Report[]> = {}
      for (const inv of invs) {
        try {
          const invReports = await api.getReports(inv.id)
          reportMap[inv.id] = invReports
        } catch {
          reportMap[inv.id] = []
        }
      }
      setReports(reportMap)
    } catch (err) {
      console.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = async (investigationId: number) => {
    try {
      const report = await api.generateReport(investigationId)
      setReports((prev) => ({
        ...prev,
        [investigationId]: [...(prev[investigationId] || []), report],
      }))
    } catch (err) {
      console.error('Failed to generate report')
    }
  }

  const filteredInvs = investigations.filter((inv) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      inv.title?.toLowerCase().includes(q) ||
      inv.attack_type?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-gray-400 text-sm mt-1">Generate and view security investigation reports</p>
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

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search reports..."
          className="input-cyber w-full pl-10"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-neon-blue" />
        </div>
      ) : filteredInvs.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-semibold mb-2">No Reports Available</h2>
          <p className="text-gray-400">Run an investigation first, then generate reports from the results.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInvs.map((inv) => {
            const invReports = reports[inv.id] || []
            return (
              <GlassCard key={inv.id}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{inv.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">{inv.attack_type || 'Pending'}</span>
                      {inv.confidence_score != null && (
                        <span className="text-xs text-neon-cyan">{inv.confidence_score}% confidence</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        inv.status === 'completed' ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-yellow-400/20 text-yellow-400'
                      }`}>{inv.status}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleGenerateReport(inv.id)}
                    disabled={inv.status !== 'completed'}
                    className="btn-cyber-primary text-sm"
                  >
                    <FileText className="w-4 h-4 inline mr-2" />
                    Generate Report
                  </button>
                </div>

                {invReports.length > 0 && (
                  <div className="space-y-2">
                    {invReports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-neon-blue" />
                          <div>
                            <p className="text-sm font-medium">{report.title}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(report.created_at).toLocaleDateString()}</span>
                              <span className="font-mono uppercase">{report.report_type}</span>
                            </div>
                          </div>
                        </div>
                        <button className="btn-cyber-secondary text-xs">
                          <Download className="w-3 h-3 inline mr-1" />
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {invReports.length === 0 && inv.status === 'completed' && (
                  <p className="text-xs text-gray-500 italic">No reports generated yet. Click "Generate Report" to create one.</p>
                )}
              </GlassCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
