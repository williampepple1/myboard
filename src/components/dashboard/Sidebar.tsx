'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, Briefcase, FolderKanban, Grid, Clock, Star, LayoutGrid, FileText, Map } from 'lucide-react'
import type { Organization } from '@/store/boardStore'

export default function Sidebar({ 
  orgs, 
  onOpenCreateProject, 
  onOpenCreateSpace, 
  onOpenCreatePlan 
}: { 
  orgs: Organization[], 
  onOpenCreateProject: () => void,
  onOpenCreateSpace: () => void,
  onOpenCreatePlan: () => void
}) {
  const params = useParams()
  const selectedOrgId = params.orgId as string | undefined
  const selectedProjectId = params.projectId as string | undefined
  const selectedSpaceId = params.spaceId as string | undefined
  const selectedPlanId = params.planId as string | undefined

  const selectedOrg = orgs.find(o => o.id === selectedOrgId)

  return (
    <div className="w-[260px] bg-white border-r border-border py-4 px-0 flex flex-col shrink-0 overflow-y-auto h-full">
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
          {orgs.map(org => {
            const isSelected = selectedOrgId === org.id && !selectedProjectId && !selectedSpaceId && !selectedPlanId
            return (
              <Link 
                href={`/${org.id}`}
                key={org.id} 
                className={`w-full text-left px-3 py-1.5 rounded-md flex items-center gap-3 text-sm transition-all ${isSelected ? 'bg-[#E9F2FF] text-[#0C66E4] font-medium' : 'text-[#42526E] hover:bg-[#F4F5F7]'}`}
              >
                <Briefcase size={16} className={isSelected ? 'text-[#0C66E4]' : 'text-[#6B778C]'} />
                <span className="truncate">{org.name}</span>
              </Link>
            )
          })}
          {orgs.length === 0 && <p className="text-xs text-[#6B778C] italic px-3 py-1">No organizations yet</p>}
        </div>
      </div>

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
              return (
                <Link 
                  href={`/${selectedOrg.id}/projects/${proj.id}`}
                  key={proj.id} 
                  className={`w-full text-left px-3 py-1.5 rounded-md flex items-center gap-3 text-sm transition-all ${isSelected ? 'bg-[#E9F2FF] text-[#0C66E4] font-medium' : 'text-[#42526E] hover:bg-[#F4F5F7]'}`}
                >
                  <FolderKanban size={16} className={isSelected ? 'text-[#0C66E4]' : 'text-[#6B778C]'} />
                  <span className="truncate">{proj.name}</span>
                </Link>
              )
            })}
            {selectedOrg.projects.length === 0 && <p className="text-xs text-[#6B778C] italic px-3 py-1">No projects yet</p>}
          </div>
        </div>
      )}
      
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
              return (
                <Link 
                  href={`/${selectedOrg.id}/spaces/${space.id}`}
                  key={space.id} 
                  className={`w-full text-left px-3 py-1.5 rounded-md flex items-center gap-3 text-sm transition-all ${isSelected ? 'bg-[#E9F2FF] text-[#0C66E4] font-medium' : 'text-[#42526E] hover:bg-[#F4F5F7]'}`}
                >
                  <FileText size={16} className={isSelected ? 'text-[#0C66E4]' : 'text-[#6B778C]'} />
                  <span className="truncate">{space.name}</span>
                </Link>
              )
            })}
            {(!selectedOrg.spaces || selectedOrg.spaces.length === 0) && <p className="text-xs text-[#6B778C] italic px-3 py-1">No spaces yet</p>}
          </div>
        </div>
      )}

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
              return (
                <Link 
                  href={`/${selectedOrg.id}/plans/${plan.id}`}
                  key={plan.id} 
                  className={`w-full text-left px-3 py-1.5 rounded-md flex items-center gap-3 text-sm transition-all ${isSelected ? 'bg-[#E9F2FF] text-[#0C66E4] font-medium' : 'text-[#42526E] hover:bg-[#F4F5F7]'}`}
                >
                  <Map size={16} className={isSelected ? 'text-[#0C66E4]' : 'text-[#6B778C]'} />
                  <span className="truncate">{plan.name}</span>
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
