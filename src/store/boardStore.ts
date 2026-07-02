import { create } from 'zustand'
import type { ProjectWithColumns } from '@/app/Board'

export type Organization = { id: string; name: string; projects: Project[] }
export type Project = { id: string; name: string }

interface BoardState {
  orgs: Organization[]
  setOrgs: (orgs: Organization[]) => void
  selectedOrgId: string | null
  setSelectedOrgId: (id: string | null) => void
  selectedProjectId: string | null
  setSelectedProjectId: (id: string | null) => void
  projectData: ProjectWithColumns | null
  setProjectData: (data: ProjectWithColumns | null | ((prev: ProjectWithColumns | null) => ProjectWithColumns | null)) => void
}

export const useBoardStore = create<BoardState>((set) => ({
  orgs: [],
  setOrgs: (orgs) => set({ orgs }),
  selectedOrgId: null,
  setSelectedOrgId: (id) => set({ selectedOrgId: id }),
  selectedProjectId: null,
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  projectData: null,
  setProjectData: (data) => set((state) => ({
    projectData: typeof data === 'function' ? data(state.projectData) : data
  })),
}))
