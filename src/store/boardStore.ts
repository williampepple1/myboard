import { create } from 'zustand'
import type { ProjectWithColumns } from '@/components/board/Board'

export type UserStar = { id: string; userId: string; entityId: string; entityType: string; createdAt: Date }
export type UserRecent = { id: string; userId: string; entityId: string; entityType: string; viewedAt: Date }

export type Space = { id: string; name: string }
export type Plan = { id: string; name: string }
export type Organization = { id: string; name: string; projects: Project[]; spaces: Space[]; plans: Plan[] }
export type Project = { id: string; name: string; assigneeId?: string | null }

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

  isCreateProjectModalOpen: boolean
  setIsCreateProjectModalOpen: (open: boolean) => void
  isCreateSpaceModalOpen: boolean
  setIsCreateSpaceModalOpen: (open: boolean) => void
  isCreatePlanModalOpen: boolean
  setIsCreatePlanModalOpen: (open: boolean) => void
  isCreateOrgModalOpen: boolean
  setIsCreateOrgModalOpen: (open: boolean) => void
  isInviteModalOpen: boolean
  setIsInviteModalOpen: (open: boolean) => void

  boardGroupBy: 'none' | 'priority' | 'type'
  setBoardGroupBy: (g: 'none' | 'priority' | 'type') => void

  filterAssignedToMe: boolean
  setFilterAssignedToMe: (f: boolean) => void
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
  setRecents: (recents) => set({ recents }),

  isCreateProjectModalOpen: false,
  setIsCreateProjectModalOpen: (open) => set({ isCreateProjectModalOpen: open }),
  isCreateSpaceModalOpen: false,
  setIsCreateSpaceModalOpen: (open) => set({ isCreateSpaceModalOpen: open }),
  isCreatePlanModalOpen: false,
  setIsCreatePlanModalOpen: (open) => set({ isCreatePlanModalOpen: open }),
  isCreateOrgModalOpen: false,
  setIsCreateOrgModalOpen: (open) => set({ isCreateOrgModalOpen: open }),
  isInviteModalOpen: false,
  setIsInviteModalOpen: (open) => set({ isInviteModalOpen: open }),

  boardGroupBy: 'none',
  setBoardGroupBy: (g) => set({ boardGroupBy: g }),

  filterAssignedToMe: false,
  setFilterAssignedToMe: (f) => set({ filterAssignedToMe: f })
}))
