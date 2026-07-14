'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, Briefcase, FolderKanban, Clock, Star, FileText, Map, ChevronDown, ChevronRight, X, Wallet } from 'lucide-react'
import { useBoardStore } from '@/store/boardStore'
import type { Organization } from '@/store/boardStore'
import { toggleStar, getUserStarsAndRecents } from '@/actions/stars'

export default function Sidebar({ 
  orgs, 
  onOpenCreateProject, 
  onOpenCreateSpace, 
  onOpenCreatePlan,
  isOpen = false,
  onClose = () => {},
}: { 
  orgs: Organization[], 
  onOpenCreateProject: () => void,
  onOpenCreateSpace: () => void,
  onOpenCreatePlan: () => void,
  isOpen?: boolean,
  onClose?: () => void,
}) {
  const params = useParams()
  const selectedOrgId = params.orgId as string | undefined
  const selectedProjectId = params.projectId as string | undefined
  const selectedSpaceId = params.spaceId as string | undefined
  const selectedPlanId = params.planId as string | undefined

  const selectedOrg = orgs.find(o => o.id === selectedOrgId)
  const { stars, recents, setStars, setIsCreateOrgModalOpen } = useBoardStore()

  const [recentOpen, setRecentOpen] = useState(false)
  const [starredOpen, setStarredOpen] = useState(false)

  // Helper: get display name for a recent/star item
  const getEntityName = (entityId: string, entityType: string) => {
    for (const org of orgs) {
      if (entityType === 'PROJECT') {
        const p = org.projects.find(p => p.id === entityId)
        if (p) return { name: p.name, orgId: org.id }
      } else if (entityType === 'SPACE') {
        const s = org.spaces.find(s => s.id === entityId)
        if (s) return { name: s.name, orgId: org.id }
      } else if (entityType === 'PLAN') {
        const pl = org.plans.find(pl => pl.id === entityId)
        if (pl) return { name: pl.name, orgId: org.id }
      }
    }
    return null
  }

  const getEntityHref = (entityId: string, entityType: string, orgId: string) => {
    if (entityType === 'PROJECT') return `/${orgId}/projects/${entityId}`
    if (entityType === 'SPACE') return `/${orgId}/spaces/${entityId}`
    if (entityType === 'PLAN') return `/${orgId}/plans/${entityId}`
    return '/'
  }

  const handleToggleStar = async (e: React.MouseEvent, entityId: string, entityType: string) => {
    e.preventDefault()
    e.stopPropagation()
    await toggleStar(entityId, entityType as 'PROJECT' | 'SPACE' | 'PLAN')
    const { stars } = await getUserStarsAndRecents()
    setStars(stars)
  }

  const isStarred = (entityId: string) => stars.some(s => s.entityId === entityId)

  // Starred items with resolved names
  const starredItems = stars
    .map(s => {
      const resolved = getEntityName(s.entityId, s.entityType)
      return resolved ? { ...s, ...resolved } : null
    })
    .filter(Boolean) as Array<{ id: string; entityId: string; entityType: string; name: string; orgId: string }>

  // Recent items with resolved names (deduplicated)
  const recentItems = recents
    .map(r => {
      const resolved = getEntityName(r.entityId, r.entityType)
      return resolved ? { ...r, ...resolved } : null
    })
    .filter(Boolean)
    .slice(0, 8) as Array<{ id: string; entityId: string; entityType: string; name: string; orgId: string; viewedAt: Date }>

  const entityIcon = (type: string) => {
    if (type === 'PROJECT') return <FolderKanban size={14} className="shrink-0 text-[#6B778C]" />
    if (type === 'SPACE') return <FileText size={14} className="shrink-0 text-[#6B778C]" />
    if (type === 'PLAN') return <Map size={14} className="shrink-0 text-[#6B778C]" />
    return null
  }

  return (
    <div className={`
      fixed md:relative top-14 bottom-0 md:inset-y-0 left-0 z-40
      w-[260px] bg-white border-r border-border py-4 px-0 flex flex-col shrink-0 overflow-y-auto md:h-full
      transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      {/* Mobile close button */}
      <button
        onClick={onClose}
        className="md:hidden absolute top-3 right-3 p-1.5 rounded-md hover:bg-slate-100 text-[#42526E] transition-colors"
        aria-label="Close menu"
      >
        <X size={18} />
      </button>

      {/* Global nav */}
      <div className="px-3 mb-2 space-y-0.5">
        {/* For you → org home */}
        <Link
          href={selectedOrgId ? `/${selectedOrgId}` : '/'}
          onClick={onClose}
          className={`w-full flex items-center gap-3 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${!selectedProjectId && !selectedSpaceId && !selectedPlanId && selectedOrgId ? 'bg-[#E9F2FF] text-primary' : 'text-[#42526E] hover:bg-[#F4F5F7]'}`}
        >
          <Briefcase size={16} /> For you
        </Link>
        <Link
          href={'/expenses'}
          onClick={onClose}
          className={`w-full flex items-center gap-3 px-3 py-1.5 text-sm font-medium rounded-md transition-colors text-[#42526E] hover:bg-[#F4F5F7]`}
        >
          <Wallet size={16} /> Personal Finances
        </Link>

        {/* Recent — collapsible */}
        <button
          onClick={() => setRecentOpen(v => !v)}
          className="w-full flex items-center gap-3 px-3 py-1.5 text-sm font-medium text-[#42526E] hover:bg-[#F4F5F7] rounded-md transition-colors"
        >
          <Clock size={16} />
          <span className="flex-1 text-left">Recent</span>
          {recentOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {recentOpen && (
          <div className="ml-4 mt-0.5 space-y-0.5 animate-in slide-in-from-top-1 duration-150">
            {recentItems.length === 0 ? (
              <p className="text-xs text-[#6B778C] italic px-3 py-1">No recent activity</p>
            ) : recentItems.map(item => (
              <Link
                key={item.id}
                href={getEntityHref(item.entityId, item.entityType, item.orgId)}
                onClick={onClose}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#42526E] hover:bg-[#F4F5F7] rounded-md transition-colors group"
              >
                {entityIcon(item.entityType)}
                <span className="truncate flex-1">{item.name}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Starred — collapsible */}
        <button
          onClick={() => setStarredOpen(v => !v)}
          className="w-full flex items-center gap-3 px-3 py-1.5 text-sm font-medium text-[#42526E] hover:bg-[#F4F5F7] rounded-md transition-colors"
        >
          <Star size={16} />
          <span className="flex-1 text-left">Starred</span>
          {starredOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {starredOpen && (
          <div className="ml-4 mt-0.5 space-y-0.5 animate-in slide-in-from-top-1 duration-150">
            {starredItems.length === 0 ? (
              <p className="text-xs text-[#6B778C] italic px-3 py-1">Nothing starred yet</p>
            ) : starredItems.map(item => (
              <Link
                key={item.id}
                href={getEntityHref(item.entityId, item.entityType, item.orgId)}
                onClick={onClose}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#42526E] hover:bg-[#F4F5F7] rounded-md transition-colors group"
              >
                <Star size={14} className="shrink-0 text-yellow-400 fill-yellow-400" />
                <span className="truncate flex-1">{item.name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border mx-3 my-2"></div>

      {/* Organizations */}
      <div className="px-3">
        <div className="flex items-center justify-between mb-1 px-3">
          <h2 className="text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">Organizations</h2>
          <button
            onClick={() => setIsCreateOrgModalOpen(true)}
            title="New Organization"
            className="text-[#6B778C] hover:text-[#42526E] transition-colors flex items-center justify-center p-0.5 rounded hover:bg-[#F4F5F7]"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="space-y-0.5">
          {orgs.map(org => {
            const isSelected = selectedOrgId === org.id && !selectedProjectId && !selectedSpaceId && !selectedPlanId
            return (
              <Link 
                href={`/${org.id}`}
                key={org.id}
                onClick={onClose}
                className={`w-full text-left px-3 py-1.5 rounded-md flex items-center gap-3 text-sm transition-all ${isSelected ? 'bg-[#E9F2FF] text-primary font-medium' : 'text-[#42526E] hover:bg-[#F4F5F7]'}`}
              >
                <Briefcase size={16} className={isSelected ? 'text-primary' : 'text-[#6B778C]'} />
                <span className="truncate">{org.name}</span>
              </Link>
            )
          })}
          {orgs.length === 0 && <p className="text-xs text-[#6B778C] italic px-3 py-1">No organizations yet</p>}
        </div>
      </div>

      {/* Projects */}
      {selectedOrg && (
        <div className="px-3 mt-4 animate-in fade-in">
          <div className="flex items-center justify-between mb-1 px-3">
            <h2 className="text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">Projects</h2>
            <button onClick={onOpenCreateProject} className="text-[#6B778C] hover:text-[#42526E] transition-colors flex items-center justify-center p-0.5 rounded hover:bg-[#F4F5F7]">
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-0.5">
            {selectedOrg.projects.map(proj => {
              const isSelected = selectedProjectId === proj.id
              const starred = isStarred(proj.id)
              return (
                <Link 
                  href={`/${selectedOrg.id}/projects/${proj.id}`}
                  key={proj.id}
                  onClick={onClose}
                  className={`group w-full text-left px-3 py-1.5 rounded-md flex items-center gap-3 text-sm transition-all ${isSelected ? 'bg-[#E9F2FF] text-primary font-medium' : 'text-[#42526E] hover:bg-[#F4F5F7]'}`}
                >
                  <FolderKanban size={16} className={`shrink-0 ${isSelected ? 'text-primary' : 'text-[#6B778C]'}`} />
                  <span className="truncate flex-1">{proj.name}</span>
                  <button
                    onClick={(e) => handleToggleStar(e, proj.id, 'PROJECT')}
                    className={`shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-yellow-50 ${starred ? 'opacity-100!' : ''}`}
                    title={starred ? 'Unstar' : 'Star'}
                  >
                    <Star size={13} className={starred ? 'text-yellow-400 fill-yellow-400' : 'text-[#6B778C]'} />
                  </button>
                </Link>
              )
            })}
            {selectedOrg.projects.length === 0 && <p className="text-xs text-[#6B778C] italic px-3 py-1">No projects yet</p>}
          </div>
        </div>
      )}

      {/* Spaces */}
      {selectedOrg && (
        <div className="px-3 mt-4 animate-in fade-in">
          <div className="flex items-center justify-between mb-1 px-3">
            <h2 className="text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">Spaces</h2>
            <button onClick={onOpenCreateSpace} className="text-[#6B778C] hover:text-[#42526E] transition-colors flex items-center justify-center p-0.5 rounded hover:bg-[#F4F5F7]">
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-0.5">
            {selectedOrg.spaces?.map(space => {
              const isSelected = selectedSpaceId === space.id
              const starred = isStarred(space.id)
              return (
                <Link 
                  href={`/${selectedOrg.id}/spaces/${space.id}`}
                  key={space.id}
                  onClick={onClose}
                  className={`group w-full text-left px-3 py-1.5 rounded-md flex items-center gap-3 text-sm transition-all ${isSelected ? 'bg-[#E9F2FF] text-primary font-medium' : 'text-[#42526E] hover:bg-[#F4F5F7]'}`}
                >
                  <FileText size={16} className={`shrink-0 ${isSelected ? 'text-primary' : 'text-[#6B778C]'}`} />
                  <span className="truncate flex-1">{space.name}</span>
                  <button
                    onClick={(e) => handleToggleStar(e, space.id, 'SPACE')}
                    className={`shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-yellow-50 ${starred ? 'opacity-100!' : ''}`}
                    title={starred ? 'Unstar' : 'Star'}
                  >
                    <Star size={13} className={starred ? 'text-yellow-400 fill-yellow-400' : 'text-[#6B778C]'} />
                  </button>
                </Link>
              )
            })}
            {(!selectedOrg.spaces || selectedOrg.spaces.length === 0) && <p className="text-xs text-[#6B778C] italic px-3 py-1">No spaces yet</p>}
          </div>
        </div>
      )}

      {/* Org Finances Link */}
      {selectedOrg && (
        <div className="px-3 mt-4 animate-in fade-in">
          <Link 
            href={`/${selectedOrg.id}/expenses`}
            onClick={onClose}
            className={`w-full flex items-center gap-3 px-3 py-1.5 text-sm font-medium rounded-md transition-colors text-[#42526E] hover:bg-[#F4F5F7]`}
          >
            <Wallet size={16} /> Org Finances
          </Link>
        </div>
      )}

      {/* Plans */}
      {selectedOrg && (
        <div className="px-3 mt-4 animate-in fade-in">
          <div className="flex items-center justify-between mb-1 px-3">
            <h2 className="text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">Plans</h2>
            <button onClick={onOpenCreatePlan} className="text-[#6B778C] hover:text-[#42526E] transition-colors flex items-center justify-center p-0.5 rounded hover:bg-[#F4F5F7]">
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-0.5">
            {selectedOrg.plans?.map(plan => {
              const isSelected = selectedPlanId === plan.id
              const starred = isStarred(plan.id)
              return (
                <Link 
                  href={`/${selectedOrg.id}/plans/${plan.id}`}
                  key={plan.id}
                  onClick={onClose}
                  className={`group w-full text-left px-3 py-1.5 rounded-md flex items-center gap-3 text-sm transition-all ${isSelected ? 'bg-[#E9F2FF] text-primary font-medium' : 'text-[#42526E] hover:bg-[#F4F5F7]'}`}
                >
                  <Map size={16} className={`shrink-0 ${isSelected ? 'text-primary' : 'text-[#6B778C]'}`} />
                  <span className="truncate flex-1">{plan.name}</span>
                  <button
                    onClick={(e) => handleToggleStar(e, plan.id, 'PLAN')}
                    className={`shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-yellow-50 ${starred ? 'opacity-100!' : ''}`}
                    title={starred ? 'Unstar' : 'Star'}
                  >
                    <Star size={13} className={starred ? 'text-yellow-400 fill-yellow-400' : 'text-[#6B778C]'} />
                  </button>
                </Link>
              )
            })}
            {(!selectedOrg.plans || selectedOrg.plans.length === 0) && <p className="text-xs text-[#6B778C] italic px-3 py-1">No plans yet</p>}
          </div>
        </div>
      )}
    </div>
  )
}
