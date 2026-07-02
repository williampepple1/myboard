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

  const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [isCreatingOrg, setIsCreatingOrg] = useState(false)

  const handleCreateOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newOrgName.trim()) return
    
    setIsCreatingOrg(true)
    try {
      const newOrg = await createOrganization(newOrgName.trim())
      setOrgs([...orgs, { ...newOrg, projects: [] }])
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

  return (
    <>
      <div className="flex w-full h-full relative">
        {/* Sidebar */}
        <div className="w-64 bg-panel border-r border-border p-4 flex flex-col gap-6 shrink-0 overflow-y-auto">
          
          {/* Orgs Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Organizations</h2>
              <button onClick={() => setIsCreateOrgModalOpen(true)} className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs transition-colors shadow-sm flex items-center justify-center">
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
                <button onClick={() => setIsCreateProjectModalOpen(true)} className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs transition-colors shadow-sm flex items-center justify-center">
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

      {/* Create Organization Modal */}
      {isCreateOrgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-border rounded-xl shadow-lg p-6 animate-in zoom-in-95 duration-200">
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
          <div className="w-full max-w-md bg-white border border-border rounded-xl shadow-lg p-6 animate-in zoom-in-95 duration-200">
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
    </>
  )
}
