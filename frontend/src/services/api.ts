import axios, { AxiosInstance } from 'axios'

const API_BASE = '/api/v1'

class ApiService {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      headers: { 'Content-Type': 'application/json' },
    })

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('cyberlens_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('cyberlens_token')
          localStorage.removeItem('cyberlens_user')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  // Auth
  async login(username: string, password: string) {
    const { data } = await this.client.post('/auth/login', { username, password })
    return data
  }

  async register(email: string, username: string, password: string, full_name?: string) {
    const { data } = await this.client.post('/auth/register', { email, username, password, full_name })
    return data
  }

  async getMe() {
    const { data } = await this.client.get('/auth/me')
    return data
  }

  // Projects
  async getProjects() {
    const { data } = await this.client.get('/projects/')
    return data
  }

  async createProject(name: string, description?: string) {
    const { data } = await this.client.post('/projects/', { name, description })
    return data
  }

  async getProject(id: number) {
    const { data } = await this.client.get(`/projects/${id}`)
    return data
  }

  async getProjectSummary(id: number) {
    const { data } = await this.client.get(`/projects/${id}/summary`)
    return data
  }

  // Uploads
  async uploadFile(projectId: number, file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await this.client.post(`/uploads/${projectId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  }

  async parseFile(uploadId: number) {
    const { data } = await this.client.post(`/uploads/${uploadId}/parse`)
    return data
  }

  async listUploads(projectId: number) {
    const { data } = await this.client.get(`/uploads/${projectId}/list`)
    return data
  }

  // Events
  async getEvents(projectId: number, page = 1, pageSize = 50) {
    const { data } = await this.client.get(`/events/${projectId}`, {
      params: { page, page_size: pageSize },
    })
    return data
  }

  async searchEvents(projectId: number, query: string) {
    const { data } = await this.client.get(`/events/${projectId}/search`, {
      params: { q: query },
    })
    return data
  }

  async getEventStats(projectId: number) {
    const { data } = await this.client.get(`/events/${projectId}/stats`)
    return data
  }

  // Timeline
  async getTimeline(projectId: number, params?: Record<string, string>) {
    const { data } = await this.client.get(`/timeline/${projectId}`, { params })
    return data
  }

  // Dashboard
  async getDashboard(projectId: number) {
    const { data } = await this.client.get(`/dashboard/${projectId}`)
    return data
  }

  // Investigations
  async createInvestigation(projectId: number, title: string) {
    const { data } = await this.client.post('/investigations/', { project_id: projectId, title })
    return data
  }

  async runInvestigation(investigationId: number) {
    const { data } = await this.client.post(`/investigations/${investigationId}/run`)
    return data
  }

  async getInvestigation(investigationId: number) {
    const { data } = await this.client.get(`/investigations/${investigationId}`)
    return data
  }

  async listInvestigations(projectId: number) {
    const { data } = await this.client.get(`/investigations/project/${projectId}`)
    return data
  }

  async chatWithAI(investigationId: number, message: string) {
    const { data } = await this.client.post(`/investigations/${investigationId}/chat`, {
      investigation_id: investigationId,
      message,
    })
    return data
  }

  async generateReport(investigationId: number) {
    const { data } = await this.client.post(`/investigations/${investigationId}/report`)
    return data
  }

  async getReports(investigationId: number) {
    const { data } = await this.client.get(`/investigations/${investigationId}/reports`)
    return data
  }

  // Graph
  async getAttackGraph(projectId: number) {
    const { data } = await this.client.get(`/investigations/graph/${projectId}`)
    return data
  }

  async getAttackPaths(projectId: number) {
    const { data } = await this.client.get(`/investigations/graph/${projectId}/paths`)
    return data
  }
}

export const api = new ApiService()
