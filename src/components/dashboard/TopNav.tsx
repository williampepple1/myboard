'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Star, Clock, Users, UserPlus } from 'lucide-react'
import { useBoardStore } from '@/store/boardStore'

export default function TopNav({ 
  onCreateProject,
  onInviteUser
}: { 
  onCreateProject: () => void
  onInviteUser: () => void
}) {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const navRef = useRef<HTMLDivElement>(null)

  const { orgs, selectedOrgId, setSelectedProjectId, setSelectedSpaceId, setSelectedPlanId, stars, recents } = useBoardStore()
  const selectedOrg = orgs.find(o => o.id === selectedOrgId)

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

  const handleNavigate = (type: string, id: string) => {
    if (type === 'PROJECT') {
      setSelectedProjectId(id)
      setSelectedSpaceId(null)
      setSelectedPlanId(null)
    } else if (type === 'SPACE') {
      setSelectedSpaceId(id)
      setSelectedProjectId(null)
      setSelectedPlanId(null)
    } else if (type === 'PLAN') {
      setSelectedPlanId(id)
      setSelectedProjectId(null)
      setSelectedSpaceId(null)
    }
    setOpenMenu(null)
  }

  // Helper to get entity name
  const getEntityName = (id: string, type: string) => {
    if (!selectedOrg) return 'Unknown'
    if (type === 'PROJECT') return selectedOrg.projects.find(p => p.id === id)?.name || 'Unknown Project'
    if (type === 'SPACE') return selectedOrg.spaces.find(s => s.id === id)?.name || 'Unknown Space'
    if (type === 'PLAN') return selectedOrg.plans.find(p => p.id === id)?.name || 'Unknown Plan'
    return 'Unknown'
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
              recents.slice(0, 5).map(r => (
                <button key={r.id} onClick={() => handleNavigate(r.entityType, r.entityId)} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2">
                  <Clock size={14} className="text-[#6B778C]" />
                  <span className="truncate">{getEntityName(r.entityId, r.entityType)}</span>
                </button>
              ))
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
              stars.filter(s => s.entityType === 'PROJECT').map(s => (
                <button key={s.id} onClick={() => handleNavigate(s.entityType, s.entityId)} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span className="truncate">{getEntityName(s.entityId, s.entityType)}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="relative">
        <button 
          onClick={() => toggleMenu('filters')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${openMenu === 'filters' ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 hover:text-foreground'}`}
        >
          Filters
          <ChevronDown size={14} className={`transition-transform ${openMenu === 'filters' ? 'rotate-180' : ''}`} />
        </button>
        {openMenu === 'filters' && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-border shadow-lg rounded-md py-2 z-50">
            <div className="px-4 py-3 text-sm text-[#6B778C] italic">
              Filters will apply to the active board. (Coming soon)
            </div>
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
            {selectedOrg ? (
              <>
                <div className="px-3 py-1 text-xs font-bold text-[#6B778C] uppercase tracking-wider">{selectedOrg.name} Members</div>
                <div className="px-4 py-2 text-sm text-foreground flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-primary font-bold text-xs">U</div>
                  You (Owner)
                </div>
                <div className="border-t border-border mt-2 pt-2">
                  <button onClick={() => { setOpenMenu(null); onInviteUser(); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-primary flex items-center gap-2 font-medium">
                    <UserPlus size={14} />
                    Invite people to {selectedOrg.name}
                  </button>
                </div>
              </>
            ) : (
              <div className="px-4 py-3 text-sm text-[#6B778C]">Select an organization first</div>
            )}
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
