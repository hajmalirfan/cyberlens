import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
  Plus,
  FolderOpen,
  Shield,
  AlertTriangle,
} from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { api } from '@/services/api'
import { useStore } from '@/store/useStore'
import { Project, Upload as UploadType } from '@/types'

export function UploadLogs() {
  const { projects, setProjects, currentProject, setCurrentProject } = useStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [parsing, setParsing] = useState<number | null>(null)
  const [uploads, setUploads] = useState<UploadType[]>([])
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      loadUploads(selectedProject)
    }
  }, [selectedProject])

  const loadProjects = async () => {
    try {
      const data = await api.getProjects()
      setProjects(data)
      if (data.length > 0 && !selectedProject) {
        setSelectedProject(data[0].id)
        setCurrentProject(data[0])
      }
    } catch (err) {
      console.error('Failed to load projects')
    }
  }

  const loadUploads = async (projectId: number) => {
    try {
      const data = await api.listUploads(projectId)
      setUploads(data)
    } catch (err) {
      console.error('Failed to load uploads')
    }
  }

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return
    try {
      const project = await api.createProject(newProjectName, newProjectDesc)
      setProjects([...projects, project])
      setSelectedProject(project.id)
      setCurrentProject(project)
      setShowNewProject(false)
      setNewProjectName('')
      setNewProjectDesc('')
    } catch (err) {
      console.error('Failed to create project')
    }
  }

  const handleFileDrop = async (files: FileList) => {
    if (!selectedProject || files.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const upload = await api.uploadFile(selectedProject, file)
        setUploads((prev) => [upload, ...prev])
        setParsing(upload.id)
        const parsed = await api.parseFile(upload.id)
        setUploads((prev) => prev.map((u) => (u.id === parsed.id ? parsed : u)))
        setParsing(null)
      }
    } catch (err) {
      console.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileDrop(e.target.files)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Upload Logs</h1>
          <p className="text-gray-400 text-sm mt-1">Upload security logs for AI analysis</p>
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
          <button onClick={() => setShowNewProject(true)} className="btn-cyber-secondary text-sm">
            <Plus className="w-4 h-4 inline mr-2" />
            New Project
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showNewProject && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-panel p-6"
          >
            <h3 className="font-semibold mb-4">Create New Project</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project Name"
                className="input-cyber w-full"
              />
              <input
                type="text"
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                placeholder="Description (optional)"
                className="input-cyber w-full"
              />
              <div className="flex gap-3">
                <button onClick={handleCreateProject} className="btn-cyber-primary text-sm">
                  Create
                </button>
                <button onClick={() => setShowNewProject(false)} className="btn-cyber-secondary text-sm">
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileDrop(e.dataTransfer.files) }}
        className={`glass-panel p-12 text-center transition-all duration-200 ${
          dragOver ? 'border-neon-blue border-2 bg-neon-blue/5 scale-[1.01]' : ''
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".evtx,.csv,.json,.txt,.log,.xml"
        />

        {uploading ? (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 mx-auto text-neon-blue animate-spin" />
            <p className="text-lg font-medium">Uploading and parsing logs...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-neon-blue/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-neon-blue" />
            </div>
            <div>
              <p className="text-lg font-medium">
                Drop log files here or{' '}
                <button onClick={() => fileInputRef.current?.click()} className="text-neon-blue hover:underline">
                  browse
                </button>
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Supports EVTX, Sysmon, CSV, JSON, TXT, Apache, Firewall logs
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
              <FileText className="w-3 h-3" />
              <span>Max file size: 500MB</span>
              <span className="mx-2">·</span>
              <Shield className="w-3 h-3" />
              <span>Files are scanned for malware</span>
            </div>
          </div>
        )}
      </div>

      <GlassCard>
        <h3 className="text-lg font-semibold mb-4">Upload History</h3>
        {uploads.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FolderOpen className="w-12 h-12 mx-auto mb-3" />
            <p>No uploads yet. Drop your log files above to begin.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{upload.filename}</p>
                    <p className="text-xs text-gray-500">
                      {upload.file_type.toUpperCase()} · {upload.file_size ? (upload.file_size / 1024).toFixed(1) : 0} KB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {upload.total_events} events · {upload.parsed_events} parsed
                    </p>
                  </div>
                  {upload.status === 'parsed' && <CheckCircle className="w-5 h-5 text-neon-cyan" />}
                  {upload.status === 'error' && <XCircle className="w-5 h-5 text-neon-red" />}
                  {upload.status === 'parsing' && <Loader2 className="w-5 h-5 text-neon-blue animate-spin" />}
                  {upload.status === 'pending' && <AlertTriangle className="w-5 h-5 text-yellow-400" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}


