import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  Brain,
  Shield,
  AlertTriangle,
  Server,
  Target,
  CheckCircle,
  Loader2,
  FileText,
  ExternalLink,
  Lightbulb,
} from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { SeverityBadge } from '@/components/ui/SeverityBadge'
import { api } from '@/services/api'
import { useStore } from '@/store/useStore'
import { Investigation, Project, Recommendation, MitreTechnique } from '@/types'

export function InvestigationPage() {
  const { projects, currentProject, setCurrentProject } = useStore()
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [investigations, setInvestigations] = useState<Investigation[]>([])
  const [current, setCurrent] = useState<Investigation | null>(null)
  const [running, setRunning] = useState(false)
  const [title, setTitle] = useState('')

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id)
    }
  }, [projects])

  useEffect(() => {
    if (selectedProject) {
      loadInvestigations(selectedProject)
    }
  }, [selectedProject])

  const loadInvestigations = async (projectId: number) => {
    try {
      const data = await api.listInvestigations(projectId)
      setInvestigations(data)
      if (data.length > 0 && !current) {
        loadInvestigation(data[0].id)
      }
    } catch (err) {
      console.error('Failed to load investigations')
    }
  }

  const loadInvestigation = async (id: number) => {
    try {
      const data = await api.getInvestigation(id)
      setCurrent(data)
    } catch (err) {
      console.error('Failed to load investigation')
    }
  }

  const handleCreate = async () => {
    if (!selectedProject || !title.trim()) return
    try {
      const inv = await api.createInvestigation(selectedProject, title)
      setInvestigations((prev) => [inv, ...prev])
      setCurrent(inv)
      setTitle('')
    } catch (err) {
      console.error('Failed to create investigation')
    }
  }

  const handleRun = async () => {
    if (!current) return
    setRunning(true)
    try {
      const result = await api.runInvestigation(current.id)
      setCurrent(result)
      loadInvestigations(current.project_id)
    } catch (err) {
      console.error('Failed to run investigation')
    } finally {
      setRunning(false)
    }
  }

  const handleGenerateReport = async () => {
    if (!current) return
    try {
      const report = await api.generateReport(current.id)
      alert(`Report generated: ${report.title}`)
    } catch (err) {
      console.error('Failed to generate report')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Investigation</h1>
          <p className="text-gray-400 text-sm mt-1">Run AI-powered security investigations</p>
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <GlassCard>
            <h3 className="font-semibold mb-4">New Investigation</h3>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Investigation title..."
              className="input-cyber w-full text-sm mb-3"
            />
            <button onClick={handleCreate} disabled={!title.trim()} className="btn-cyber-primary w-full text-sm">
              <Brain className="w-4 h-4 inline mr-2" />
              Create
            </button>
          </GlassCard>

          <GlassCard>
            <h3 className="font-semibold mb-4">History</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {investigations.map((inv) => (
                <button
                  key={inv.id}
                  onClick={() => loadInvestigation(inv.id)}
                  className={`w-full text-left p-3 rounded-lg text-sm transition-all ${
                    current?.id === inv.id
                      ? 'bg-neon-blue/10 border border-neon-blue/30'
                      : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <p className="font-medium truncate">{inv.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      inv.status === 'completed' ? 'bg-neon-cyan/20 text-neon-cyan' :
                      inv.status === 'in_progress' ? 'bg-yellow-400/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>{inv.status}</span>
                    {inv.attack_score != null && (
                      <span className="text-xs text-gray-500">Score: {inv.attack_score}</span>
                    )}
                  </div>
                </button>
              ))}
              {investigations.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No investigations yet</p>
              )}
            </div>
          </GlassCard>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {current ? (
            <>
              <GlassCard>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold">{current.title}</h2>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        current.status === 'completed' ? 'bg-neon-cyan/20 text-neon-cyan' :
                        'bg-yellow-400/20 text-yellow-400'
                      }`}>{current.status}</span>
                      {current.attack_type && (
                        <span className="text-sm text-neon-blue">{current.attack_type}</span>
                      )}
                      {current.confidence_score != null && (
                        <span className="text-xs text-gray-500">Confidence: {current.confidence_score}%</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {current.status === 'in_progress' && (
                      <button onClick={handleRun} disabled={running} className="btn-cyber-primary text-sm">
                        {running ? (
                          <><Loader2 className="w-4 h-4 inline mr-2 animate-spin" />Analyzing...</>
                        ) : (
                          <><Activity className="w-4 h-4 inline mr-2" />Run Investigation</>
                        )}
                      </button>
                    )}
                    {current.status === 'completed' && (
                      <button onClick={handleGenerateReport} className="btn-cyber-secondary text-sm">
                        <FileText className="w-4 h-4 inline mr-2" />Generate Report
                      </button>
                    )}
                  </div>
                </div>

                {current.summary && (
                  <div className="p-4 rounded-lg bg-white/5 mb-4">
                    <p className="text-sm text-gray-300 leading-relaxed">{current.summary}</p>
                  </div>
                )}

                {current.status === 'in_progress' && !running && (
                  <div className="text-center py-12 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-3" />
                    <p>Click "Run Investigation" to start the AI analysis</p>
                  </div>
                )}

                {running && (
                  <div className="text-center py-12">
                    <Loader2 className="w-12 h-12 mx-auto mb-4 text-neon-blue animate-spin" />
                    <p className="text-lg font-medium mb-2">AI Investigation in Progress</p>
                    <p className="text-sm text-gray-500">
                      Analyzing events, correlating data, and generating insights...
                    </p>
                    <div className="mt-6 space-y-2">
                      {['Parsing events', 'Running correlation engine', 'Querying AI model', 'Building timeline', 'Generating recommendations'].map((step, i) => (
                        <motion.div
                          key={step}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.5 }}
                          className="flex items-center gap-3 text-sm text-gray-400 justify-center"
                        >
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {step}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </GlassCard>

              {current.status === 'completed' && current.attack_score != null && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <GlassCard>
                      <div className="text-center">
                        <Target className="w-6 h-6 text-neon-blue mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gradient">{current.attack_score}%</p>
                        <p className="text-xs text-gray-400">Attack Score</p>
                      </div>
                    </GlassCard>
                    <GlassCard>
                      <div className="text-center">
                        <Shield className="w-6 h-6 text-neon-cyan mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gradient">{current.confidence_score}%</p>
                        <p className="text-xs text-gray-400">Confidence</p>
                      </div>
                    </GlassCard>
                    <GlassCard>
                      <div className="text-center">
                        <Server className="w-6 h-6 text-neon-purple mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gradient">{current.affected_systems?.length || 0}</p>
                        <p className="text-xs text-gray-400">Systems Affected</p>
                      </div>
                    </GlassCard>
                    <GlassCard>
                      <div className="text-center">
                        <AlertTriangle className="w-6 h-6 text-neon-amber mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gradient">{current.recommendations?.length || 0}</p>
                        <p className="text-xs text-gray-400">Recommendations</p>
                      </div>
                    </GlassCard>
                  </div>

                  {current.mitre_mapping && current.mitre_mapping.length > 0 && (
                    <GlassCard>
                      <h3 className="text-lg font-semibold mb-4">MITRE ATT&CK Mapping</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {current.mitre_mapping.map((t: MitreTechnique) => (
                          <div key={t.technique_id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono bg-neon-blue/20 text-neon-blue px-1.5 py-0.5 rounded">
                                {t.technique_id}
                              </span>
                              <span className="text-xs text-gray-500">{t.tactic_name}</span>
                            </div>
                            <p className="text-sm font-medium">{t.technique_name}</p>
                            <p className="text-xs text-gray-400 mt-1">{t.description}</p>
                          </div>
                        ))}
                      </div>
                    </GlassCard>
                  )}

                  {current.recommendations && current.recommendations.length > 0 && (
                    <GlassCard>
                      <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
                      <div className="space-y-3">
                        {current.recommendations.map((rec: Recommendation, i: number) => (
                          <div key={i} className="flex gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
                            <Lightbulb className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                              rec.priority === 'critical' ? 'text-neon-red' :
                              rec.priority === 'high' ? 'text-neon-amber' :
                              'text-neon-cyan'
                            }`} />
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <SeverityBadge severity={rec.priority} />
                                <p className="font-medium text-sm">{rec.title}</p>
                              </div>
                              <p className="text-sm text-gray-400">{rec.description}</p>
                              {rec.affected_systems && rec.affected_systems.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {rec.affected_systems.map((sys) => (
                                    <span key={sys} className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-500">
                                      {sys}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </GlassCard>
                  )}
                </>
              )}
            </>
          ) : (
            <GlassCard>
              <div className="text-center py-16">
                <Brain className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Investigation Selected</h2>
                <p className="text-gray-400 mb-6">Create a new investigation or select one from the history</p>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  )
}
