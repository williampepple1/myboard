import { create } from 'zustand'
import type { ProjectWithColumns } from '@/components/board/Board'
import type { UserStar, UserRecent } from '@prisma/client'

export type Space = { id: string; name: string }
export type Plan = { id: string; name: string }
export type Organization = { id: string; name: string; projects: Project[]; spaces: Space[]; plans: Plan[] }
export type Project = { id: string; name: string }

interface BoardState {
  orgs: Organization[]
  setOrgs: (orgs: Organization[]) => void
  selectedOrgId: string | null
  setSelectedOrgId: (id: string | null) => void
  selectedProjectId: string | null
  setSelectedProjectId: (id: string | null) => void
  selectedSpaceId: string | null
  setSelectedSpaceId: (id: string | null) => void
  selectedPlanId: string | null
  setSelectedPlanId: (id: string | null) => void
  projectData: ProjectWithColumns | null
  setProjectData: (data: ProjectWithColumns | null | ((prev: ProjectWithColumns | null) => ProjectWithColumns | null)) => void
  stars: UserStar[]
  setStars: (stars: UserStar[]) => void
  recents: UserRecent[]
  setRecents: (recents: UserRecent[]) => void
}

export const useBoardStore = create<BoardState>((set) => ({
  orgs: [],
  setOrgs: (orgs) => set({ orgs }),
  selectedOrgId: null,
  setSelectedOrgId: (id) => set({ selectedOrgId: id }),
  selectedProjectId: null,
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  selectedSpaceId: null,
  setSelectedSpaceId: (id) => set({ selectedSpaceId: id }),
  selectedPlanId: null,
  setSelectedPlanId: (id) => set({ selectedPlanId: id }),
  projectData: null,
  setProjectData: (data) => set((state) => ({
    projectData: typeof data === 'function' ? data(state.projectData) : data
  })),
  stars: [],
  setStars: (stars) => set({ stars }),
  recents: [],
  setRecents: (recents) => set({ recents })
}))
