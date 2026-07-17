'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronDown, Star, Clock, UserPlus, CheckCircle2 } from 'lucide-react'
import { useBoardStore } from '@/store/boardStore'
import type { Organization } from '@/store/boardStore'

export default function TopNav({ 
  orgs,
  onCreateProject,
  onInviteUser
}: { 
  orgs: Organization[]
  onCreateProject: () => void
  onInviteUser: () => void
}) {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const params = useParams()
  const router = useRouter()

  const { stars, recents } = useBoardStore()
  
  const selectedOrgId = params.orgId as string | undefined

  // Click away listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const toggleMenu = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu)
  }

  // Resolve entity name + orgId by searching ALL orgs (not just current)
  const resolveEntity = (id: string, type: string): { name: string; orgId: string } | null => {
    for (const org of orgs) {
      if (type === 'PROJECT') {
        const found = org.projects.find(p => p.id === id)
        if (found) return { name: found.name, orgId: org.id }
      } else if (type === 'SPACE') {
        const found = org.spaces.find(s => s.id === id)
        if (found) return { name: found.name, orgId: org.id }
      } else if (type === 'PLAN') {
        const found = org.plans.find(p => p.id === id)
        if (found) return { name: found.name, orgId: org.id }
      }
    }
    return null
  }

  const getEntityName = (id: string, type: string) => resolveEntity(id, type)?.name ?? null

  const handleNavigate = (type: string, id: string) => {
    const resolved = resolveEntity(id, type)
    const orgId = resolved?.orgId ?? selectedOrgId
    if (!orgId) return
    if (type === 'PROJECT') router.push(`/${orgId}/projects/${id}`)
    else if (type === 'SPACE') router.push(`/${orgId}/spaces/${id}`)
    else if (type === 'PLAN') router.push(`/${orgId}/plans/${id}`)
    setOpenMenu(null)
  }

  return (
    <div ref={navRef} className="hidden md:flex items-center gap-1 text-sm font-medium text-foreground/70">
      
      {/* Your Work */}
      <div className="relative">
        <button 
          onClick={() => toggleMenu('work')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${openMenu === 'work' ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 hover:text-foreground'}`}
        >
          Your work
          <ChevronDown size={14} className={`transition-transform ${openMenu === 'work' ? 'rotate-180' : ''}`} />
        </button>
        {openMenu === 'work' && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-border shadow-lg rounded-md py-2 z-50">
            <div className="px-3 py-1 text-xs font-bold text-[#6B778C] uppercase tracking-wider">Recent Boards</div>
            {recents.length === 0 ? (
              <div className="px-4 py-2 text-sm text-[#6B778C]">No recent activity</div>
            ) : (
              recents.slice(0, 5).map(r => {
                const name = getEntityName(r.entityId, r.entityType)
                if (!name) return null
                return (
                  <button key={r.id} onClick={() => handleNavigate(r.entityType, r.entityId)} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2">
                    <Clock size={14} className="text-[#6B778C]" />
                    <span className="truncate">{name}</span>
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Projects */}
      <div className="relative">
        <button 
          onClick={() => toggleMenu('projects')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${openMenu === 'projects' ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 hover:text-foreground'}`}
        >
          Projects
          <ChevronDown size={14} className={`transition-transform ${openMenu === 'projects' ? 'rotate-180' : ''}`} />
        </button>
        {openMenu === 'projects' && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-border shadow-lg rounded-md py-2 z-50">
            <div className="px-3 py-1 text-xs font-bold text-[#6B778C] uppercase tracking-wider">Starred</div>
            {stars.filter(s => s.entityType === 'PROJECT').length === 0 ? (
              <div className="px-4 py-2 text-sm text-[#6B778C]">No starred projects</div>
            ) : (
              stars.filter(s => s.entityType === 'PROJECT').map(s => {
                const name = getEntityName(s.entityId, s.entityType)
                if (!name) return null
                return (
                  <button key={s.id} onClick={() => handleNavigate(s.entityType, s.entityId)} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2">
                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                    <span className="truncate">{name}</span>
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="relative">
        <button 
          onClick={() => toggleMenu('filters')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${openMenu === 'filters' || useBoardStore.getState().filterAssigneeId === 'ME' ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 hover:text-foreground'}`}
        >
          Filters
          {useBoardStore.getState().filterAssigneeId === 'ME' && <span className="w-2 h-2 rounded-full bg-primary ml-1" />}
          <ChevronDown size={14} className={`transition-transform ${openMenu === 'filters' ? 'rotate-180' : ''}`} />
        </button>
        {openMenu === 'filters' && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-border shadow-lg rounded-md py-2 z-50">
            <div className="px-3 py-1 text-xs font-bold text-[#6B778C] uppercase tracking-wider">Quick Filters</div>
            <button
              onClick={() => {
                const store = useBoardStore.getState()
                store.setFilterAssigneeId(store.filterAssigneeId === 'ME' ? null : 'ME')
                setOpenMenu(null)
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center justify-between"
            >
              <span>Assigned to me</span>
              {useBoardStore.getState().filterAssigneeId === 'ME' && <CheckCircle2 size={16} className="text-primary" />}
            </button>
          </div>
        )}
      </div>

      {/* Teams */}
      <div className="relative">
        <button 
          onClick={() => toggleMenu('teams')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${openMenu === 'teams' ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 hover:text-foreground'}`}
        >
          Teams
          <ChevronDown size={14} className={`transition-transform ${openMenu === 'teams' ? 'rotate-180' : ''}`} />
        </button>
        {openMenu === 'teams' && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-border shadow-lg rounded-md py-2 z-50">
            {(() => {
              const currentOrg = orgs.find(o => o.id === selectedOrgId)
              return currentOrg ? (
                <>
                  <div className="px-3 py-1 text-xs font-bold text-[#6B778C] uppercase tracking-wider">{currentOrg.name} Members</div>
                  <div className="px-4 py-2 text-sm text-foreground flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">U</div>
                    You (Owner)
                  </div>
                  <div className="border-t border-border mt-2 pt-2">
                    <button onClick={() => { setOpenMenu(null); onInviteUser(); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-primary flex items-center gap-2 font-medium">
                      <UserPlus size={14} />
                      Invite people to {currentOrg.name}
                    </button>
                  </div>
                </>
              ) : (
                <div className="px-4 py-3 text-sm text-[#6B778C]">Select an organization first</div>
              )
            })()}
          </div>
        )}
      </div>

      <button 
        onClick={onCreateProject}
        className="ml-2 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-md transition-colors font-medium"
      >
        Create
      </button>
    </div>
  )
}
