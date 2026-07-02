'use client'

import { useEffect, useState } from 'react'
import { Plus, Briefcase, FolderKanban, Search, Bell, HelpCircle, Grid, Clock, Star, LayoutGrid, Share2, Maximize2, MoreHorizontal, FileText, Map } from 'lucide-react'
import { createOrganization, createProject, createSpace, createPlan, getProjectData } from '@/actions/board'
import Board from '@/components/board/Board'
import type { ProjectWithColumns } from '@/components/board/Board'
import OrganizationOverview from './OrganizationOverview'
import SpaceView from './SpaceView'
import PlanView from './PlanView'
import TopNav from './TopNav'
import { useBoardStore } from '@/store/boardStore'
import { getUserStarsAndRecents, recordRecentView, toggleStar } from '@/actions/stars'
import { inviteUserToOrganization } from '@/actions/invite'

type Space = { id: string; name: string }
type Plan = { id: string; name: string }
export type Organization = { id: string; name: string; projects: Project[]; spaces: Space[]; plans: Plan[] }
type Project = { id: string; name: string }

export default function DashboardClient({ initialOrgs }: { initialOrgs: Organization[] }) {
  useState(() => {
    useBoardStore.setState({
      orgs: initialOrgs,
      selectedOrgId: initialOrgs[0]?.id || null,
      selectedProjectId: initialOrgs[0]?.projects?.[0]?.id || null,
      selectedSpaceId: null,
      selectedPlanId: null,
    })
  })

  const { orgs, setOrgs, selectedOrgId, setSelectedOrgId, selectedProjectId, setSelectedProjectId, selectedSpaceId, setSelectedSpaceId, selectedPlanId, setSelectedPlanId, projectData, setProjectData, stars, setStars, setRecents } = useBoardStore()
  
  const selectedOrg = orgs.find(o => o.id === selectedOrgId)

  useEffect(() => {
    let isMounted = true
    if (selectedProjectId) {
      getProjectData(selectedProjectId).then(data => {
        if (isMounted) {
          setProjectData(data as ProjectWithColumns)
        }
      })
    } else {
      Promise.resolve().then(() => {
        if (isMounted) setProjectData(null)
      })
    }
    return () => { isMounted = false }
  }, [selectedProjectId, setProjectData])

  const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [isCreatingOrg, setIsCreatingOrg] = useState(false)

  const handleCreateOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newOrgName.trim()) return
    
    setIsCreatingOrg(true)
    try {
      const newOrg = await createOrganization(newOrgName.trim())
      setOrgs([...orgs, { ...newOrg, projects: [], spaces: [], plans: [] }])
      setSelectedOrgId(newOrg.id)
      setSelectedProjectId(null)
      setIsCreateOrgModalOpen(false)
      setNewOrgName('')
    } catch (error) {
      console.error("Failed to create organization:", error)
    } finally {
      setIsCreatingOrg(false)
    }
  }

  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [isCreatingProject, setIsCreatingProject] = useState(false)

  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim() || !selectedOrgId) return

    setIsCreatingProject(true)
    try {
      const newProject = await createProject(selectedOrgId, newProjectName.trim())
      setOrgs(orgs.map(o => o.id === selectedOrgId ? { ...o, projects: [...o.projects, newProject] } : o))
      setSelectedProjectId(newProject.id)
      setIsCreateProjectModalOpen(false)
      setNewProjectName('')
    } catch (error) {
      console.error("Failed to create project:", error)
    } finally {
      setIsCreatingProject(false)
    }
  }
  const [isCreateSpaceModalOpen, setIsCreateSpaceModalOpen] = useState(false)
  const [newSpaceName, setNewSpaceName] = useState('')
  const [isCreatingSpace, setIsCreatingSpace] = useState(false)

  const handleCreateSpaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSpaceName.trim() || !selectedOrgId) return

    setIsCreatingSpace(true)
    try {
      const newSpace = await createSpace(newSpaceName.trim(), selectedOrgId)
      setOrgs(orgs.map(o => o.id === selectedOrgId ? { ...o, spaces: [...o.spaces, newSpace] } : o))
      setSelectedSpaceId(newSpace.id)
      setSelectedProjectId(null)
      setSelectedPlanId(null)
      setIsCreateSpaceModalOpen(false)
      setNewSpaceName('')
    } catch (error) {
      console.error("Failed to create space:", error)
    } finally {
      setIsCreatingSpace(false)
    }
  }

  const [isCreatePlanModalOpen, setIsCreatePlanModalOpen] = useState(false)
  const [newPlanName, setNewPlanName] = useState('')
  const [isCreatingPlan, setIsCreatingPlan] = useState(false)
  const [isInviteUserModalOpen, setIsInviteUserModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInvitingUser, setIsInvitingUser] = useState(false)

  const handleCreatePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlanName.trim() || !selectedOrgId) return

    setIsCreatingPlan(true)
    try {
      const newPlan = await createPlan(newPlanName.trim(), selectedOrgId)
      setOrgs(orgs.map(o => o.id === selectedOrgId ? { ...o, plans: [...o.plans, newPlan] } : o))
      setSelectedPlanId(newPlan.id)
      setSelectedProjectId(null)
      setSelectedSpaceId(null)
      setIsCreatePlanModalOpen(false)
      setNewPlanName('')
    } catch (error) {
      console.error("Failed to create plan:", error)
    } finally {
      setIsCreatingPlan(false)
    }
  }

  useEffect(() => {
    getUserStarsAndRecents().then(({ stars, recents }) => {
      setStars(stars)
      setRecents(recents)
    })
  }, [setStars, setRecents])

  useEffect(() => {
    if (selectedProjectId) {
      recordRecentView(selectedProjectId, 'PROJECT').then(() => {
        getUserStarsAndRecents().then(({ recents }) => setRecents(recents))
      })
    } else if (selectedSpaceId) {
      recordRecentView(selectedSpaceId, 'SPACE').then(() => {
        getUserStarsAndRecents().then(({ recents }) => setRecents(recents))
      })
    } else if (selectedPlanId) {
      recordRecentView(selectedPlanId, 'PLAN').then(() => {
        getUserStarsAndRecents().then(({ recents }) => setRecents(recents))
      })
    }
  }, [selectedProjectId, selectedSpaceId, selectedPlanId, setRecents])

  const loading = selectedProjectId ? (!projectData || projectData.id !== selectedProjectId) : false

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-background text-foreground">
      <header className="h-14 border-b border-border bg-white flex items-center justify-between px-4 shrink-0 z-10 relative">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-primary cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 rounded bg-[#0c66e4] text-white flex items-center justify-center font-bold text-sm">M</div>
            <span className="font-bold text-xl tracking-tight text-[#172b4d]">Myboard</span>
          </div>
          <TopNav 
            onCreateProject={() => setIsCreateProjectModalOpen(true)}
            onInviteUser={() => setIsInviteUserModalOpen(true)}
          />
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground/50" />
            <input 
              type="text" 
              placeholder="Search" 
              className="w-48 pl-9 pr-3 py-1.5 bg-background border border-border hover:bg-slate-50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-md text-sm outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-1 text-foreground/60">
            <button className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"><Bell size={20} /></button>
            <button className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"><HelpCircle size={20} /></button>
            <button className="p-1 hover:bg-slate-100 rounded-full transition-colors ml-1">
              <div className="w-7 h-7 rounded-full bg-linear-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                ME
              </div>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <div className="w-[260px] bg-white border-r border-border py-4 px-0 flex flex-col shrink-0 overflow-y-auto">
          <div className="px-3 mb-4 space-y-0.5">
            <button className="w-full flex items-center gap-3 px-3 py-1.5 text-sm font-medium text-[#42526E] hover:bg-[#F4F5F7] rounded-md transition-colors">
              <Grid size={16} /> For you
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-1.5 text-sm font-medium text-[#42526E] hover:bg-[#F4F5F7] rounded-md transition-colors">
              <Clock size={16} /> Recent
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-1.5 text-sm font-medium text-[#42526E] hover:bg-[#F4F5F7] rounded-md transition-colors">
              <Star size={16} /> Starred
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-1.5 text-sm font-medium text-[#42526E] hover:bg-[#F4F5F7] rounded-md transition-colors">
              <LayoutGrid size={16} /> Apps
            </button>
          </div>

          <div className="border-t border-border mx-3 my-2"></div>

          <div className="px-3">
            <div className="flex items-center justify-between mb-1 px-3">
              <h2 className="text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">Organizations</h2>
            </div>
            <div className="space-y-0.5">
              {orgs.map(org => (
                <button 
                  key={org.id} 
                  onClick={() => {
                    setSelectedOrgId(org.id)
                    setSelectedProjectId(null)
                    setSelectedSpaceId(null)
                    setSelectedPlanId(null)
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-md flex items-center gap-3 text-sm transition-all ${selectedOrgId === org.id && !selectedProjectId && !selectedSpaceId && !selectedPlanId ? 'bg-[#E9F2FF] text-[#0C66E4] font-medium' : 'text-[#42526E] hover:bg-[#F4F5F7]'}`}
                >
                  <Briefcase size={16} className={selectedOrgId === org.id && !selectedProjectId && !selectedSpaceId && !selectedPlanId ? 'text-[#0C66E4]' : 'text-[#6B778C]'} />
                  <span className="truncate">{org.name}</span>
                </button>
              ))}
              {orgs.length === 0 && <p className="text-xs text-[#6B778C] italic px-3 py-1">No organizations yet</p>}
            </div>
          </div>

          {selectedOrg && (
            <div className="px-3 mt-4 animate-in fade-in">
              <div className="flex items-center justify-between mb-1 px-3">
                <h2 className="text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">Projects</h2>
                <button onClick={() => setIsCreateProjectModalOpen(true)} className="text-[#6B778C] hover:text-[#42526E] transition-colors flex items-center justify-center p-0.5 rounded hover:bg-[#F4F5F7]">
                  <Plus size={14} />
                </button>
              </div>
              <div className="space-y-0.5">
                {selectedOrg.projects.map(proj => (
                  <button 
                    key={proj.id} 
                    onClick={() => setSelectedProjectId(proj.id)}
                    className={`w-full text-left px-3 py-1.5 rounded-md flex items-center gap-3 text-sm transition-all ${selectedProjectId === proj.id ? 'bg-[#E9F2FF] text-[#0C66E4] font-medium' : 'text-[#42526E] hover:bg-[#F4F5F7]'}`}
                  >
                    <FolderKanban size={16} className={selectedProjectId === proj.id ? 'text-[#0C66E4]' : 'text-[#6B778C]'} />
                    <span className="truncate">{proj.name}</span>
                  </button>
                ))}
                {selectedOrg.projects.length === 0 && <p className="text-xs text-[#6B778C] italic px-3 py-1">No projects yet</p>}
              </div>
            </div>
          )}
          {selectedOrg && (
            <div className="px-3 mt-4 animate-in fade-in">
              <div className="flex items-center justify-between mb-1 px-3">
                <h2 className="text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">Spaces</h2>
                <button onClick={() => setIsCreateSpaceModalOpen(true)} className="text-[#6B778C] hover:text-[#42526E] transition-colors flex items-center justify-center p-0.5 rounded hover:bg-[#F4F5F7]">
                  <Plus size={14} />
                </button>
              </div>
              <div className="space-y-0.5">
                {selectedOrg.spaces?.map(space => (
                  <button 
                    key={space.id} 
                    onClick={() => {
                      setSelectedSpaceId(space.id)
                      setSelectedProjectId(null)
                      setSelectedPlanId(null)
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-md flex items-center gap-3 text-sm transition-all ${selectedSpaceId === space.id ? 'bg-[#E9F2FF] text-[#0C66E4] font-medium' : 'text-[#42526E] hover:bg-[#F4F5F7]'}`}
                  >
                    <FileText size={16} className={selectedSpaceId === space.id ? 'text-[#0C66E4]' : 'text-[#6B778C]'} />
                    <span className="truncate">{space.name}</span>
                  </button>
                ))}
                {(!selectedOrg.spaces || selectedOrg.spaces.length === 0) && <p className="text-xs text-[#6B778C] italic px-3 py-1">No spaces yet</p>}
              </div>
            </div>
          )}

          {selectedOrg && (
            <div className="px-3 mt-4 animate-in fade-in">
              <div className="flex items-center justify-between mb-1 px-3">
                <h2 className="text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">Plans</h2>
                <button onClick={() => setIsCreatePlanModalOpen(true)} className="text-[#6B778C] hover:text-[#42526E] transition-colors flex items-center justify-center p-0.5 rounded hover:bg-[#F4F5F7]">
                  <Plus size={14} />
                </button>
              </div>
              <div className="space-y-0.5">
                {selectedOrg.plans?.map(plan => (
                  <button 
                    key={plan.id} 
                    onClick={() => {
                      setSelectedPlanId(plan.id)
                      setSelectedProjectId(null)
                      setSelectedSpaceId(null)
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-md flex items-center gap-3 text-sm transition-all ${selectedPlanId === plan.id ? 'bg-[#E9F2FF] text-[#0C66E4] font-medium' : 'text-[#42526E] hover:bg-[#F4F5F7]'}`}
                  >
                    <Map size={16} className={selectedPlanId === plan.id ? 'text-[#0C66E4]' : 'text-[#6B778C]'} />
                    <span className="truncate">{plan.name}</span>
                  </button>
                ))}
                {(!selectedOrg.plans || selectedOrg.plans.length === 0) && <p className="text-xs text-[#6B778C] italic px-3 py-1">No plans yet</p>}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 bg-white overflow-hidden flex flex-col relative">
          
          {projectData && (
            <div className="px-8 pt-6 pb-2 bg-white border-b border-border shrink-0 z-0">
              <div className="text-sm text-[#6B778C] mb-2 flex items-center gap-1">
                <Briefcase size={14} />
                <span>Projects</span>
                <span>/</span>
                <span>{projectData.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-[#172B4D]">{projectData.name}</h1>
                  <button 
                    onClick={async () => {
                      await toggleStar(projectData.id, 'PROJECT')
                      const { stars } = await getUserStarsAndRecents()
                      setStars(stars)
                    }}
                    className={`p-1.5 rounded-md transition-colors ${stars.some(s => s.entityType === 'PROJECT' && s.entityId === projectData.id) ? 'bg-yellow-100 text-yellow-500' : 'text-[#6B778C] hover:bg-[#F4F5F7]'}`}
                  >
                    <Star size={18} className={stars.some(s => s.entityType === 'PROJECT' && s.entityId === projectData.id) ? 'fill-yellow-500' : ''} />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-6 text-sm font-medium text-[#42526E]">
                <button className="pb-2 border-b-2 border-transparent hover:text-[#172b4d] transition-colors">Summary</button>
                <button className="pb-2 border-b-2 border-transparent hover:text-[#172b4d] transition-colors">List</button>
                <button className="pb-2 border-b-2 border-primary text-primary transition-colors">Board</button>
                <button className="pb-2 border-b-2 border-transparent hover:text-[#172b4d] transition-colors">Code</button>
                <button className="pb-2 border-b-2 border-transparent hover:text-[#172b4d] transition-colors">Forms</button>
                <button className="pb-2 border-b-2 border-transparent hover:text-[#172b4d] transition-colors">Timeline</button>
                <button className="pb-2 border-b-2 border-transparent hover:text-[#172b4d] transition-colors">Docs</button>
              </div>
            </div>
          )}

          {/* Project Toolbar & Content */}
          <div className="flex-1 overflow-hidden relative flex flex-col">
            {projectData && (
              <div className="px-8 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B778C]" />
                    <input 
                      type="text" 
                      placeholder="Search board" 
                      className="w-48 pl-9 pr-3 py-1.5 bg-white border border-[#DFE1E6] hover:bg-[#F4F5F7] focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary rounded-md text-sm outline-none transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white z-10 flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-white -ml-3 z-20 flex items-center justify-center text-xs text-white">M</div>
                    <div className="w-8 h-8 rounded-full bg-orange-400 border-2 border-white -ml-3 z-30 flex items-center justify-center text-xs text-white font-medium">ME</div>
                  </div>
                  <button className="ml-2 flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#42526E] bg-[#F4F5F7] hover:bg-[#EBECF0] rounded-md transition-colors">
                    <Grid size={14} /> Filter
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#42526E] bg-[#F4F5F7] hover:bg-[#EBECF0] rounded-md transition-colors">
                    Group <Grid size={14} />
                  </button>
                  <button className="p-1.5 text-[#42526E] bg-[#F4F5F7] hover:bg-[#EBECF0] rounded-md transition-colors">
                    <Share2 size={16} />
                  </button>
                  <button className="p-1.5 text-[#42526E] bg-[#F4F5F7] hover:bg-[#EBECF0] rounded-md transition-colors">
                    <Maximize2 size={16} />
                  </button>
                  <button className="p-1.5 text-[#42526E] bg-[#F4F5F7] hover:bg-[#EBECF0] rounded-md transition-colors">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-hidden relative">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : selectedProjectId && projectData ? (
                <Board />
              ) : selectedSpaceId ? (
                <SpaceView spaceId={selectedSpaceId} spaceName={selectedOrg?.spaces?.find(s => s.id === selectedSpaceId)?.name || 'Space'} />
              ) : selectedPlanId ? (
                <PlanView planId={selectedPlanId} planName={selectedOrg?.plans?.find(p => p.id === selectedPlanId)?.name || 'Plan'} />
              ) : selectedOrg ? (
                <OrganizationOverview 
                  org={selectedOrg} 
                  onSelectProject={setSelectedProjectId}
                  onCreateProject={() => setIsCreateProjectModalOpen(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-[#6B778C] gap-4 animate-in">
                  <FolderKanban size={48} className="opacity-20" />
                  <p>Select or create an organization to start planning.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Organization Modal */}
      {isCreateOrgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-border rounded-md shadow-lg p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Create Organization</h2>
            <form onSubmit={handleCreateOrgSubmit} className="space-y-4">
              <div>
                <label htmlFor="orgName" className="block text-sm font-medium text-foreground/80 mb-1">
                  Organization Name
                </label>
                <input
                  id="orgName"
                  type="text"
                  autoFocus
                  required
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOrgModalOpen(false)
                    setNewOrgName('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-background rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingOrg || !newOrgName.trim()}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isCreatingOrg ? (
                    <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  ) : null}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {isCreateProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-border rounded-md shadow-lg p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Create Project</h2>
            <form onSubmit={handleCreateProjectSubmit} className="space-y-4">
              <div>
                <label htmlFor="projectName" className="block text-sm font-medium text-foreground/80 mb-1">
                  Project Name
                </label>
                <input
                  id="projectName"
                  type="text"
                  autoFocus
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Q3 Roadmap"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateProjectModalOpen(false)
                    setNewProjectName('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-background rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingProject || !newProjectName.trim()}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isCreatingProject ? (
                    <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  ) : null}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Create Space Modal */}
      {isCreateSpaceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-border rounded-md shadow-lg p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Create Space</h2>
            <form onSubmit={handleCreateSpaceSubmit} className="space-y-4">
              <div>
                <label htmlFor="spaceName" className="block text-sm font-medium text-foreground/80 mb-1">
                  Space Name
                </label>
                <input
                  id="spaceName"
                  type="text"
                  autoFocus
                  required
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  placeholder="e.g. Engineering Docs"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateSpaceModalOpen(false)
                    setNewSpaceName('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-background rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingSpace || !newSpaceName.trim()}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isCreatingSpace ? (
                    <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  ) : null}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Plan Modal */}
      {isCreatePlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-border rounded-md shadow-lg p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Create Plan</h2>
            <form onSubmit={handleCreatePlanSubmit} className="space-y-4">
              <div>
                <label htmlFor="planName" className="block text-sm font-medium text-foreground/80 mb-1">
                  Plan Name
                </label>
                <input
                  id="planName"
                  type="text"
                  autoFocus
                  required
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  placeholder="e.g. Q3 Roadmap"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatePlanModalOpen(false)
                    setNewPlanName('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-background rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingPlan || !newPlanName.trim()}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isCreatingPlan ? (
                    <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  ) : null}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {isInviteUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-border rounded-md shadow-lg p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Invite to {selectedOrg?.name}</h2>
            <form onSubmit={async (e) => {
              e.preventDefault()
              if (!selectedOrg) return
              setIsInvitingUser(true)
              try {
                await inviteUserToOrganization(selectedOrg.id, inviteEmail)
                setIsInviteUserModalOpen(false)
                setInviteEmail('')
                alert(`Invited ${inviteEmail} successfully!`)
              } catch (err) {
                console.error(err)
              } finally {
                setIsInvitingUser(false)
              }
            }} className="space-y-4">
              <div>
                <label htmlFor="inviteEmail" className="block text-sm font-medium text-foreground/80 mb-1">
                  Email Address
                </label>
                <input
                  id="inviteEmail"
                  type="email"
                  autoFocus
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsInviteUserModalOpen(false)
                    setInviteEmail('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-background rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInvitingUser || !inviteEmail.trim()}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isInvitingUser ? (
                    <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  ) : null}
                  Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
