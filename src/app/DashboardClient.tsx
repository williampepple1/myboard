'use client'

import { useEffect, useState } from 'react'
import { Plus, Briefcase, FolderKanban } from 'lucide-react'
import { createOrganization, createProject, getProjectData } from '@/actions/board'
import Board from './Board'
import type { ProjectWithColumns } from './Board'
import { useBoardStore } from '@/store/boardStore'

type Organization = { id: string; name: string; projects: Project[] }
type Project = { id: string; name: string }

export default function DashboardClient({ initialOrgs }: { initialOrgs: Organization[] }) {
  useState(() => {
    useBoardStore.setState({
      orgs: initialOrgs,
      selectedOrgId: initialOrgs[0]?.id || null,
      selectedProjectId: initialOrgs[0]?.projects?.[0]?.id || null,
    })
  })

  const { orgs, setOrgs, selectedOrgId, setSelectedOrgId, selectedProjectId, setSelectedProjectId, projectData, setProjectData } = useBoardStore()
  
  const loading = selectedProjectId ? (!projectData || projectData.id !== selectedProjectId) : false

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

  const handleCreateOrg = async () => {
    const name = prompt("Organization Name:")
    if (name) {
      const newOrg = await createOrganization(name)
      // Optimistic/lazy update
      setOrgs([...orgs, { ...newOrg, projects: [] }])
      setSelectedOrgId(newOrg.id)
      setSelectedProjectId(null)
    }
  }

  const handleCreateProject = async () => {
    if (!selectedOrgId) return
    const name = prompt("Project Name:")
    if (name) {
      const newProject = await createProject(selectedOrgId, name)
      setOrgs(orgs.map(o => o.id === selectedOrgId ? { ...o, projects: [...o.projects, newProject] } : o))
      setSelectedProjectId(newProject.id)
    }
  }

  return (
    <div className="flex w-full h-full">
      {/* Sidebar */}
      <div className="w-64 bg-panel border-r border-border p-4 flex flex-col gap-6 shrink-0 overflow-y-auto">
        
        {/* Orgs Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Organizations</h2>
            <button onClick={handleCreateOrg} className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs transition-colors shadow-sm flex items-center justify-center">
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-1">
            {orgs.map(org => (
              <button 
                key={org.id} 
                onClick={() => setSelectedOrgId(org.id)}
                className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 text-sm transition-all ${selectedOrgId === org.id ? 'bg-primary/10 text-primary font-medium' : 'text-foreground/70 hover:bg-background'}`}
              >
                <Briefcase size={16} className={selectedOrgId === org.id ? 'text-primary' : 'text-foreground/40'} />
                {org.name}
              </button>
            ))}
            {orgs.length === 0 && <p className="text-xs text-foreground/40 italic px-2">No organizations yet</p>}
          </div>
        </div>

        {/* Projects Section */}
        {selectedOrg && (
          <div className="animate-in">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Projects</h2>
              <button onClick={handleCreateProject} className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs transition-colors shadow-sm flex items-center justify-center">
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-1">
              {selectedOrg.projects.map(proj => (
                <button 
                  key={proj.id} 
                  onClick={() => setSelectedProjectId(proj.id)}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 text-sm transition-all ${selectedProjectId === proj.id ? 'bg-primary text-white font-medium shadow-md shadow-primary/20' : 'text-foreground/70 hover:bg-background'}`}
                >
                  <FolderKanban size={16} className={selectedProjectId === proj.id ? 'text-white' : 'text-foreground/40'} />
                  {proj.name}
                </button>
              ))}
              {selectedOrg.projects.length === 0 && <p className="text-xs text-foreground/40 italic px-2">No projects yet</p>}
            </div>
          </div>
        )}
      </div>

      {/* Main Board Area */}
      <div className="flex-1 bg-background overflow-hidden relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : projectData ? (
          <Board />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-foreground/40 gap-4 animate-in">
            <FolderKanban size={48} className="opacity-20" />
            <p>Select or create a project to start planning.</p>
          </div>
        )}
      </div>
    </div>
  )
}
