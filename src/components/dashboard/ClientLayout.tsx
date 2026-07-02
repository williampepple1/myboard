'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Search, Bell, HelpCircle } from 'lucide-react'
import { createOrganization, createProject, createSpace, createPlan } from '@/actions/board'
import { getUserStarsAndRecents } from '@/actions/stars'
import { inviteUserToOrganization } from '@/actions/invite'
import { useBoardStore } from '@/store/boardStore'

import TopNav from './TopNav'
import Sidebar from './Sidebar'
import type { Organization } from '@/store/boardStore'

export default function ClientLayout({ 
  initialOrgs,
  children
}: { 
  initialOrgs: Organization[],
  children: React.ReactNode
}) {
  const router = useRouter()
  const params = useParams()
  const orgId = params.orgId as string | undefined

  // Initialize store state
  useState(() => {
    useBoardStore.setState({ orgs: initialOrgs })
  })

  const { orgs, setOrgs, setStars, setRecents, isCreateProjectModalOpen, setIsCreateProjectModalOpen } = useBoardStore()
  const selectedOrg = orgs.find(o => o.id === orgId)

  // Fetch stars and recents
  useEffect(() => {
    getUserStarsAndRecents().then(({ stars, recents }) => {
      setStars(stars)
      setRecents(recents)
    })
  }, [setStars, setRecents])

  // Modals state
  const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [isCreatingOrg, setIsCreatingOrg] = useState(false)

  const [newProjectName, setNewProjectName] = useState('')
  const [isCreatingProject, setIsCreatingProject] = useState(false)

  const [isCreateSpaceModalOpen, setIsCreateSpaceModalOpen] = useState(false)
  const [newSpaceName, setNewSpaceName] = useState('')
  const [isCreatingSpace, setIsCreatingSpace] = useState(false)

  const [isCreatePlanModalOpen, setIsCreatePlanModalOpen] = useState(false)
  const [newPlanName, setNewPlanName] = useState('')
  const [isCreatingPlan, setIsCreatingPlan] = useState(false)

  const [isInviteUserModalOpen, setIsInviteUserModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInvitingUser, setIsInvitingUser] = useState(false)

  const handleCreateOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newOrgName.trim()) return
    setIsCreatingOrg(true)
    try {
      const newOrg = await createOrganization(newOrgName.trim())
      setOrgs([...orgs, { ...newOrg, projects: [], spaces: [], plans: [] }])
      setIsCreateOrgModalOpen(false)
      setNewOrgName('')
      router.push(`/${newOrg.id}`)
    } catch (error) {
      console.error("Failed to create organization:", error)
    } finally {
      setIsCreatingOrg(false)
    }
  }

  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim() || !orgId) return
    setIsCreatingProject(true)
    try {
      const newProject = await createProject(orgId, newProjectName.trim())
      setOrgs(orgs.map(o => o.id === orgId ? { ...o, projects: [...o.projects, newProject] } : o))
      setIsCreateProjectModalOpen(false)
      setNewProjectName('')
      router.push(`/${orgId}/projects/${newProject.id}`)
    } catch (error) {
      console.error("Failed to create project:", error)
    } finally {
      setIsCreatingProject(false)
    }
  }

  const handleCreateSpaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSpaceName.trim() || !orgId) return
    setIsCreatingSpace(true)
    try {
      const newSpace = await createSpace(newSpaceName.trim(), orgId)
      setOrgs(orgs.map(o => o.id === orgId ? { ...o, spaces: [...o.spaces, newSpace] } : o))
      setIsCreateSpaceModalOpen(false)
      setNewSpaceName('')
      router.push(`/${orgId}/spaces/${newSpace.id}`)
    } catch (error) {
      console.error("Failed to create space:", error)
    } finally {
      setIsCreatingSpace(false)
    }
  }

  const handleCreatePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlanName.trim() || !orgId) return
    setIsCreatingPlan(true)
    try {
      const newPlan = await createPlan(newPlanName.trim(), orgId)
      setOrgs(orgs.map(o => o.id === orgId ? { ...o, plans: [...o.plans, newPlan] } : o))
      setIsCreatePlanModalOpen(false)
      setNewPlanName('')
      router.push(`/${orgId}/plans/${newPlan.id}`)
    } catch (error) {
      console.error("Failed to create plan:", error)
    } finally {
      setIsCreatingPlan(false)
    }
  }

  const handleInviteUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim() || !orgId) return
    setIsInvitingUser(true)
    try {
      await inviteUserToOrganization(orgId, inviteEmail.trim())
      setIsInviteUserModalOpen(false)
      setInviteEmail('')
      alert(`Invitation sent to ${inviteEmail}`)
    } catch (error) {
      console.error("Failed to invite user:", error)
    } finally {
      setIsInvitingUser(false)
    }
  }

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-background text-foreground">
      <header className="h-14 border-b border-border bg-white flex items-center justify-between px-4 shrink-0 z-10 relative">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-primary cursor-pointer hover:opacity-80 transition-opacity" onClick={() => router.push('/')}>
            <div className="w-6 h-6 rounded bg-[#0c66e4] text-white flex items-center justify-center font-bold text-sm">M</div>
            <span className="font-bold text-xl tracking-tight text-[#172b4d]">Myboard</span>
          </div>
          <TopNav 
            orgs={orgs}
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
        <Sidebar 
          orgs={orgs}
          onOpenCreateProject={() => setIsCreateProjectModalOpen(true)}
          onOpenCreateSpace={() => setIsCreateSpaceModalOpen(true)}
          onOpenCreatePlan={() => setIsCreatePlanModalOpen(true)}
        />

        <div className="flex-1 bg-white overflow-hidden flex flex-col relative">
          {children}
        </div>
      </div>

      {/* Modals */}
      {isCreateOrgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-border rounded-md shadow-lg p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Create Organization</h2>
            <form onSubmit={handleCreateOrgSubmit} className="space-y-4">
              <div>
                <label htmlFor="orgName" className="block text-sm font-medium text-foreground/80 mb-1">Organization Name</label>
                <input
                  id="orgName" type="text" autoFocus required value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g. Acme Corp" className="w-full px-4 py-2 bg-background border border-border rounded-lg outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
                <button type="button" onClick={() => { setIsCreateOrgModalOpen(false); setNewOrgName(''); }} className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-background rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={isCreatingOrg || !newOrgName.trim()} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
                  {isCreatingOrg ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : null} Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCreateProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-border rounded-md shadow-lg p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Create Project</h2>
            <form onSubmit={handleCreateProjectSubmit} className="space-y-4">
              <div>
                <label htmlFor="projectName" className="block text-sm font-medium text-foreground/80 mb-1">Project Name</label>
                <input
                  id="projectName" type="text" autoFocus required value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Q3 Roadmap" className="w-full px-4 py-2 bg-background border border-border rounded-lg outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
                <button type="button" onClick={() => { setIsCreateProjectModalOpen(false); setNewProjectName(''); }} className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-background rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={isCreatingProject || !newProjectName.trim()} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
                  {isCreatingProject ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : null} Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCreateSpaceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-border rounded-md shadow-lg p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Create Space</h2>
            <form onSubmit={handleCreateSpaceSubmit} className="space-y-4">
              <div>
                <label htmlFor="spaceName" className="block text-sm font-medium text-foreground/80 mb-1">Space Name</label>
                <input
                  id="spaceName" type="text" autoFocus required value={newSpaceName} onChange={(e) => setNewSpaceName(e.target.value)}
                  placeholder="e.g. Engineering Docs" className="w-full px-4 py-2 bg-background border border-border rounded-lg outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
                <button type="button" onClick={() => { setIsCreateSpaceModalOpen(false); setNewSpaceName(''); }} className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-background rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={isCreatingSpace || !newSpaceName.trim()} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
                  {isCreatingSpace ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : null} Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCreatePlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-border rounded-md shadow-lg p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Create Plan</h2>
            <form onSubmit={handleCreatePlanSubmit} className="space-y-4">
              <div>
                <label htmlFor="planName" className="block text-sm font-medium text-foreground/80 mb-1">Plan Name</label>
                <input
                  id="planName" type="text" autoFocus required value={newPlanName} onChange={(e) => setNewPlanName(e.target.value)}
                  placeholder="e.g. Q3 Roadmap" className="w-full px-4 py-2 bg-background border border-border rounded-lg outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
                <button type="button" onClick={() => { setIsCreatePlanModalOpen(false); setNewPlanName(''); }} className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-background rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={isCreatingPlan || !newPlanName.trim()} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
                  {isCreatingPlan ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : null} Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isInviteUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-border rounded-md shadow-lg p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Invite to {selectedOrg?.name}</h2>
            <form onSubmit={handleInviteUserSubmit} className="space-y-4">
              <div>
                <label htmlFor="inviteEmail" className="block text-sm font-medium text-foreground/80 mb-1">Email Address</label>
                <input
                  id="inviteEmail" type="email" autoFocus required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com" className="w-full px-4 py-2 bg-background border border-border rounded-lg outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
                <button type="button" onClick={() => { setIsInviteUserModalOpen(false); setInviteEmail(''); }} className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-background rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={isInvitingUser || !inviteEmail.trim()} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
                  {isInvitingUser ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : null} Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
