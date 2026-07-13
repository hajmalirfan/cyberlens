import { useEffect, useState, useCallback } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { GlassCard } from '@/components/ui/GlassCard'
import { api } from '@/services/api'
import { useStore } from '@/store/useStore'
import { Project } from '@/types'

const nodeColors: Record<string, string> = {
  Computer: '#00f0ff',
  User: '#8b5cf6',
  IP: '#ff006e',
  Process: '#ffb700',
  File: '#00ff88',
  Malware: '#ff0040',
}

const nodeIcons: Record<string, string> = {
  Computer: '🖥',
  User: '👤',
  IP: '🌐',
  Process: '⚙',
  File: '📄',
  Malware: '🦠',
}

export function AttackGraph() {
  const { projects } = useStore()
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id)
    }
  }, [projects])

  useEffect(() => {
    if (selectedProject) {
      loadGraph(selectedProject)
    }
  }, [selectedProject])

  const loadGraph = async (projectId: number) => {
    setLoading(true)
    try {
      const data = await api.getAttackGraph(projectId)
      if (data.nodes && data.edges) {
        const flowNodes: Node[] = data.nodes.map((n: any, i: number) => ({
          id: n.id,
          type: 'default',
          position: {
            x: 150 + Math.random() * 600,
            y: 50 + Math.random() * 400,
          },
          data: {
            label: (
              <div className="flex items-center gap-2 px-3 py-2 min-w-[120px]">
                <span>{nodeIcons[n.label] || '?'}</span>
                <div>
                  <p className="text-xs font-semibold" style={{ color: nodeColors[n.label] || '#fff' }}>
                    {n.label}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate max-w-[100px]">
                    {n.display_name}
                  </p>
                </div>
              </div>
            ),
          },
          style: {
            background: 'rgba(15, 23, 42, 0.9)',
            border: `1px solid ${nodeColors[n.label] || '#333'}40`,
            borderRadius: '12px',
            boxShadow: `0 0 20px ${nodeColors[n.label] || '#333'}20`,
            backdropFilter: 'blur(12px)',
            padding: '4px',
          },
        }))

        const flowEdges: Edge[] = data.edges.map((e: any) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.type,
          style: { stroke: '#6366f1', strokeWidth: 2 },
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#6366f1',
          },
          labelStyle: { fill: '#9ca3af', fontSize: 10, fontWeight: 600 },
        }))

        setNodes(flowNodes)
        setEdges(flowEdges)
      }
    } catch (err) {
      console.error('Failed to load graph')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Attack Graph</h1>
          <p className="text-gray-400 text-sm mt-1">Visual relationship mapping of attack entities</p>
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

      <div className="flex gap-2 mb-4">
        {Object.entries(nodeColors).map(([label, color]) => (
          <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-gray-400">{label}</span>
          </div>
        ))}
      </div>

      <GlassCard className="p-0 overflow-hidden" style={{ height: 'calc(100vh - 280px)' }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-neon-blue" />
          </div>
        ) : nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">No graph data available</p>
              <p className="text-sm">Upload and parse logs, then run an investigation to generate the attack graph.</p>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            attributionPosition="bottom-left"
          >
            <Controls />
            <Background color="#1e293b" gap={20} />
            <MiniMap
              nodeColor={(n) => nodeColors[(n.data?.label as any)?.props?.children?.[0]?.props?.children] || '#475569'}
              maskColor="rgba(15, 23, 42, 0.8)"
              style={{ background: '#0f172a' }}
            />
          </ReactFlow>
        )}
      </GlassCard>
    </div>
  )
}
