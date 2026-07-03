'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Search, Bell, HelpCircle, CheckCircle2, X, Menu, AlertCircle } from 'lucide-react'
import { createOrganization, createProject, createSpace, createPlan } from '@/actions/board'
import { getUserStarsAndRecents } from '@/actions/stars'
import { inviteUserToOrganization } from '@/actions/invite'
import { useBoardStore } from '@/store/boardStore'
import { authClient } from '@/lib/auth-client'
import UserMenu from '@/components/shared/UserMenu'

import TopNav from './TopNav'
import Sidebar from './Sidebar'
import type { Organization } from '@/store/boardStore'

// ─── Simple toast component ────────────────────────────────────────
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-100 flex items-center gap-3 bg-[#1D2125] text-white px-5 py-3 rounded-xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
      <CheckCircle2 size={18} className="text-green-400 shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 text-white/60 hover:text-white transition-colors">
        <X size={16} />
      </button>
    </div>
  )
}

// ─── Modal wrapper ─────────────────────────────────────────────────
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white border border-border rounded-xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-[#172B4D]">{title}</h2>
          <button onClick={onClose} className="text-foreground/40 hover:text-foreground transition-colors p-1 rounded hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ModalInput({ label, id, ...rest }: { label: string; id: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-foreground/70 mb-1">{label}</label>
      <input
        id={id}
        className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
        {...rest}
      />
    </div>
  )
}

function ModalActions({ onCancel, loading, submitLabel }: { onCancel: () => void; loading: boolean; submitLabel: string }) {
  return (
    <div className="flex items-center justify-end gap-3 pt-5 border-t border-border mt-5">
      <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-slate-100 rounded-lg transition-colors">
        Cancel
      </button>
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-[#0C66E4] hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
      >
        {loading && <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
        {submitLabel}
      </button>
    </div>
  )
}

// ─── Main ClientLayout ─────────────────────────────────────────────
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

  useEffect(() => {
    useBoardStore.setState({ orgs: initialOrgs })
  }, [initialOrgs])

  const {
    orgs, setOrgs,
    setStars, setRecents,
    isCreateProjectModalOpen, setIsCreateProjectModalOpen,
    isCreateOrgModalOpen, setIsCreateOrgModalOpen,
    isInviteModalOpen, setIsInviteModalOpen,
  } = useBoardStore()

  const selectedOrg = orgs.find(o => o.id === orgId)

  // Session
  const { data: session } = authClient.useSession()
  const user = session?.user

  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const showToast = (msg: string) => setToast(msg)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Fetch stars + recents on mount
  useEffect(() => {
    getUserStarsAndRecents().then(({ stars, recents }) => {
      setStars(stars)
      setRecents(recents)
    })
  }, [setStars, setRecents])

  // ── Create Org ─────────────────────────────────────────────────
  const [newOrgName, setNewOrgName] = useState('')
  const [isCreatingOrg, setIsCreatingOrg] = useState(false)

  const handleCreateOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newOrgName.trim()) return
    setIsCreatingOrg(true)
    setError('')
    try {
      const newOrg = await createOrganization(newOrgName.trim())
      setOrgs([...orgs, { ...newOrg, projects: [], spaces: [], plans: [] }])
      setIsCreateOrgModalOpen(false)
      setNewOrgName('')
      router.push(`/${newOrg.id}`)
      showToast(`Organization "${newOrg.name}" created!`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization')
    } finally {
      setIsCreatingOrg(false)
    }
  }

  // ── Create Project ──────────────────────────────────────────────
  const [newProjectName, setNewProjectName] = useState('')
  const [isCreatingProject, setIsCreatingProject] = useState(false)

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
      showToast(`Project "${newProject.name}" created!`)
    } finally {
      setIsCreatingProject(false)
    }
  }

  // ── Create Space ────────────────────────────────────────────────
  const [isCreateSpaceModalOpen, setIsCreateSpaceModalOpen] = useState(false)
  const [newSpaceName, setNewSpaceName] = useState('')
  const [isCreatingSpace, setIsCreatingSpace] = useState(false)

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
      showToast(`Space "${newSpace.name}" created!`)
    } finally {
      setIsCreatingSpace(false)
    }
  }

  // ── Create Plan ─────────────────────────────────────────────────
  const [isCreatePlanModalOpen, setIsCreatePlanModalOpen] = useState(false)
  const [newPlanName, setNewPlanName] = useState('')
  const [isCreatingPlan, setIsCreatingPlan] = useState(false)

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
      showToast(`Plan "${newPlan.name}" created!`)
    } finally {
      setIsCreatingPlan(false)
    }
  }

  // ── Invite ──────────────────────────────────────────────────────
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim() || !orgId) return
    setIsInviting(true)
    try {
      await inviteUserToOrganization(orgId, inviteEmail.trim())
      setIsInviteModalOpen(false)
      showToast(`Invitation sent to ${inviteEmail}!`)
      setInviteEmail('')
    } finally {
      setIsInviting(false)
    }
  }

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-background text-foreground">
      {/* Top bar */}
      <header className="h-14 border-b border-border bg-white flex items-center justify-between px-4 shrink-0 z-10 relative">
        <div className="flex items-center gap-6">
          {/* Hamburger – mobile only */}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="md:hidden p-1.5 rounded-md hover:bg-slate-100 transition-colors text-[#172B4D]"
            aria-label="Toggle menu"
          >
            <Menu size={22} />
          </button>
          <div
            className="flex items-center gap-2 text-primary cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => router.push('/')}
          >
            <div className="w-6 h-6 rounded bg-[#0c66e4] text-white flex items-center justify-center font-bold text-sm">M</div>
            <span className="font-bold text-xl tracking-tight text-[#172b4d]">Myboard</span>
          </div>
          <TopNav 
            orgs={orgs}
            onCreateProject={() => setIsCreateProjectModalOpen(true)}
            onInviteUser={() => setIsInviteModalOpen(true)}
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
          <div className="flex items-center gap-2 text-foreground/60">
            <button className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"><Bell size={20} /></button>
            <button className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"><HelpCircle size={20} /></button>
            <UserMenu name={user?.name} email={user?.email} />
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <Sidebar 
          orgs={orgs}
          onOpenCreateProject={() => { setIsCreateProjectModalOpen(true); setSidebarOpen(false) }}
          onOpenCreateSpace={() => { setIsCreateSpaceModalOpen(true); setSidebarOpen(false) }}
          onOpenCreatePlan={() => { setIsCreatePlanModalOpen(true); setSidebarOpen(false) }}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex-1 bg-white overflow-hidden flex flex-col relative min-w-0">
          {children}
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────── */}
      {isCreateOrgModalOpen && (
        <Modal title="Create Organization" onClose={() => { setIsCreateOrgModalOpen(false); setNewOrgName(''); setError(null) }}>
          <form onSubmit={handleCreateOrgSubmit} className="space-y-4">
            <ModalInput id="orgName" label="Organization Name" autoFocus required value={newOrgName} onChange={e => setNewOrgName(e.target.value)} placeholder="e.g. Acme Corp" />
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <ModalActions onCancel={() => { setIsCreateOrgModalOpen(false); setNewOrgName(''); setError(null) }} loading={isCreatingOrg} submitLabel="Create" />
          </form>
        </Modal>
      )}

      {isCreateProjectModalOpen && (
        <Modal title="Create Project" onClose={() => { setIsCreateProjectModalOpen(false); setNewProjectName('') }}>
          {!orgId && (
            <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-md mb-4">
              Please select an organization first.
            </p>
          )}
          <form onSubmit={handleCreateProjectSubmit} className="space-y-4">
            <ModalInput id="projectName" label="Project Name" autoFocus required value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="e.g. Q3 Roadmap" />
            <ModalActions onCancel={() => { setIsCreateProjectModalOpen(false); setNewProjectName('') }} loading={isCreatingProject} submitLabel="Create Project" />
          </form>
        </Modal>
      )}

      {isCreateSpaceModalOpen && (
        <Modal title="Create Space" onClose={() => { setIsCreateSpaceModalOpen(false); setNewSpaceName('') }}>
          <form onSubmit={handleCreateSpaceSubmit} className="space-y-4">
            <ModalInput id="spaceName" label="Space Name" autoFocus required value={newSpaceName} onChange={e => setNewSpaceName(e.target.value)} placeholder="e.g. Engineering Docs" />
            <ModalActions onCancel={() => { setIsCreateSpaceModalOpen(false); setNewSpaceName('') }} loading={isCreatingSpace} submitLabel="Create Space" />
          </form>
        </Modal>
      )}

      {isCreatePlanModalOpen && (
        <Modal title="Create Plan" onClose={() => { setIsCreatePlanModalOpen(false); setNewPlanName('') }}>
          <form onSubmit={handleCreatePlanSubmit} className="space-y-4">
            <ModalInput id="planName" label="Plan Name" autoFocus required value={newPlanName} onChange={e => setNewPlanName(e.target.value)} placeholder="e.g. Q3 Roadmap" />
            <ModalActions onCancel={() => { setIsCreatePlanModalOpen(false); setNewPlanName('') }} loading={isCreatingPlan} submitLabel="Create Plan" />
          </form>
        </Modal>
      )}

      {isInviteModalOpen && (
        <Modal title={`Invite to ${selectedOrg?.name ?? 'Organization'}`} onClose={() => { setIsInviteModalOpen(false); setInviteEmail('') }}>
          <p className="text-sm text-foreground/60 mb-4">Enter the email address of the person you want to invite.</p>
          <form onSubmit={handleInviteSubmit} className="space-y-4">
            <ModalInput id="inviteEmail" label="Email Address" type="email" autoFocus required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@company.com" />
            <ModalActions onCancel={() => { setIsInviteModalOpen(false); setInviteEmail('') }} loading={isInviting} submitLabel="Send Invite" />
          </form>
        </Modal>
      )}

      {/* ── Toast ──────────────────────────────────────────────────── */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
