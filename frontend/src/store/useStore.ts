import { create } from 'zustand'
import { DashboardData, Investigation, Project, User } from '@/types'

interface AppState {
  user: User | null
  token: string | null
  projects: Project[]
  currentProject: Project | null
  dashboard: DashboardData | null
  currentInvestigation: Investigation | null
  investigations: Investigation[]
  sidebarOpen: boolean
  theme: 'dark' | 'light'

  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setProjects: (projects: Project[]) => void
  setCurrentProject: (project: Project | null) => void
  setDashboard: (data: DashboardData | null) => void
  setCurrentInvestigation: (investigation: Investigation | null) => void
  setInvestigations: (investigations: Investigation[]) => void
  toggleSidebar: () => void
  setTheme: (theme: 'dark' | 'light') => void
  logout: () => void
}

export const useStore = create<AppState>((set) => ({
  user: JSON.parse(localStorage.getItem('cyberlens_user') || 'null'),
  token: localStorage.getItem('cyberlens_token'),
  projects: [],
  currentProject: null,
  dashboard: null,
  currentInvestigation: null,
  investigations: [],
  sidebarOpen: true,
  theme: 'dark',

  setUser: (user) => {
    localStorage.setItem('cyberlens_user', JSON.stringify(user))
    set({ user })
  },

  setToken: (token) => {
    if (token) {
      localStorage.setItem('cyberlens_token', token)
    } else {
      localStorage.removeItem('cyberlens_token')
    }
    set({ token })
  },

  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),

  setDashboard: (dashboard) => set({ dashboard }),

  setCurrentInvestigation: (investigation) => set({ currentInvestigation: investigation }),
  setInvestigations: (investigations) => set({ investigations }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setTheme: (theme) => set({ theme }),

  logout: () => {
    localStorage.removeItem('cyberlens_token')
    localStorage.removeItem('cyberlens_user')
    set({ user: null, token: null, currentProject: null, dashboard: null })
  },
}))
