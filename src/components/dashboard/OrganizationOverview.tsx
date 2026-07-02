'use client'

import { Briefcase, FolderKanban, Users, Plus, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useBoardStore } from '@/store/boardStore'
import type { Organization } from '@/store/boardStore'

interface OrganizationOverviewProps {
  org: Organization
}

export default function OrganizationOverview({ org }: OrganizationOverviewProps) {
  const router = useRouter()
  const setIsCreateProjectModalOpen = useBoardStore(state => state.setIsCreateProjectModalOpen)
  return (
    <div className="flex-1 h-full overflow-y-auto bg-background/50 p-8 md:p-12 animate-in fade-in duration-300">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-border/50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
              <Briefcase size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{org.name}</h1>
              <p className="text-foreground/50 mt-1">Organization Dashboard</p>
            </div>
          </div>
          <button className="p-2 text-foreground/40 hover:text-foreground hover:bg-panel rounded-md transition-colors">
            <Settings size={20} />
          </button>
        </div>

        {/* Projects Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-lg font-semibold text-foreground/80">
              <FolderKanban size={20} className="text-blue-500" />
              <h2>Projects</h2>
            </div>
            <button 
              onClick={() => setIsCreateProjectModalOpen(true)}
              className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors"
            >
              <Plus size={16} />
              New Project
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {org.projects.map((proj) => (
              <div 
                key={proj.id}
                onClick={() => router.push(`/${org.id}/projects/${proj.id}`)}
                className="group p-6 bg-white border border-border/50 hover:border-primary/50 rounded-md transition-all cursor-pointer flex flex-col gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FolderKanban size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground group-hover:text-blue-600 transition-colors">{proj.name}</h3>
                  <p className="text-sm text-foreground/50 mt-1">Click to open board</p>
                </div>
              </div>
            ))}
            
            {org.projects.length === 0 && (
              <div 
                onClick={() => setIsCreateProjectModalOpen(true)}
                className="p-6 border-2 border-dashed border-border/50 hover:border-primary/30 rounded-md flex flex-col items-center justify-center text-center gap-3 cursor-pointer group transition-colors min-h-[160px] bg-white/50"
              >
                <div className="w-10 h-10 rounded-full bg-primary/5 text-primary/40 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Plus size={20} />
                </div>
                <div>
                  <p className="font-medium text-foreground/70">Create your first project</p>
                  <p className="text-sm text-foreground/40 mt-1">Get started by setting up a board</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Members Section (Placeholder) */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-lg font-semibold text-foreground/80">
              <Users size={20} className="text-green-500" />
              <h2>Members</h2>
            </div>
            <button className="flex items-center gap-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-md transition-colors">
              <Plus size={16} />
              Invite
            </button>
          </div>
          
          <div className="bg-white border border-border/50 rounded-md overflow-hidden">
            <div className="divide-y divide-border/50">
              <div className="flex items-center justify-between p-4 hover:bg-panel/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-linear-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-inner">
                    ME
                  </div>
                  <div>
                    <p className="font-medium text-foreground">You (Admin)</p>
                    <p className="text-xs text-foreground/50">owner@example.com</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-md">Owner</span>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
