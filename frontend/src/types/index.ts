export interface User {
  id: number
  email: string
  username: string
  full_name: string | null
  role: 'admin' | 'analyst' | 'viewer'
  is_active: boolean
  avatar_url: string | null
  created_at: string
}

export interface Project {
  id: number
  name: string
  description: string | null
  owner_id: number
  status: string
  created_at: string
  updated_at: string
}

export interface Upload {
  id: number
  project_id: number
  filename: string
  file_type: string
  file_size: number | null
  status: string
  total_events: number
  parsed_events: number
  error_message: string | null
  created_at: string
}

export interface NormalizedEvent {
  id: number
  event_id: string | null
  event_name: string | null
  timestamp: string
  source_type: string | null
  source_name: string | null
  computer_name: string | null
  user_name: string | null
  ip_address: string | null
  process_name: string | null
  process_id: number | null
  parent_process: string | null
  command_line: string | null
  file_path: string | null
  severity: string
  mitre_technique_id: string | null
  mitre_technique_name: string | null
  raw_data: Record<string, unknown> | null
  session_id: string | null
}

export interface Investigation {
  id: number
  project_id: number
  title: string
  status: string
  attack_type: string | null
  attack_score: number | null
  summary: string | null
  timeline: TimelineEvent[] | null
  evidence: EvidenceItem[] | null
  affected_systems: AffectedSystem[] | null
  mitre_mapping: MitreTechnique[] | null
  recommendations: Recommendation[] | null
  confidence_score: number | null
  started_at: string
  completed_at: string | null
  created_at: string
}

export interface TimelineEvent {
  id: number
  timestamp: string
  event_name: string
  computer_name: string
  user_name: string | null
  severity: string
  source_type: string
  description: string
  raw: Record<string, unknown>
}

export interface EvidenceItem {
  event_id: string
  timestamp: string
  detail: string
  relevance: string
}

export interface AffectedSystem {
  computer: string
  role: string
  findings: string
}

export interface MitreTechnique {
  technique_id: string
  technique_name: string
  tactic_id: string
  tactic_name: string
  description: string
  evidence_count: number
}

export interface Recommendation {
  priority: string
  title: string
  description: string
  affected_systems: string[]
}

export interface DashboardData {
  project_id: number
  project_name: string
  total_logs: number
  critical_events: number
  attack_score: number
  attack_type: string
  severity_breakdown: {
    critical: number
    high: number
    medium: number
    low: number
    info: number
  }
  total_uploads: number
  recent_uploads: Upload[]
  recent_events: TimelineEvent[]
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface GraphNode {
  id: string
  label: string
  display_name: string
  properties: Record<string, unknown>
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type: string
}

export interface Report {
  id: number
  investigation_id: number
  title: string
  report_type: string
  executive_summary: string | null
  technical_summary: string | null
  pdf_path: string | null
  created_at: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  confidence?: number
  evidence?: EvidenceItem[]
  timestamp: string
}
