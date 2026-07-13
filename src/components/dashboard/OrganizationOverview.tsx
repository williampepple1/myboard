'use client'

import { Briefcase, FolderKanban, Users, Plus, Settings, Star, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useBoardStore } from '@/store/boardStore'
import type { Organization } from '@/store/boardStore'
import { toggleStar, getUserStarsAndRecents } from '@/actions/stars'
import NotesSection from '@/components/board/NotesSection'

interface OrganizationOverviewProps {
  org: Organization
  members?: { id: string; name?: string | null; email?: string | null; role: string }[]
  currentUser?: { id: string; name?: string | null; email?: string | null }
  memberCount?: number
  canCreateNote?: boolean
  canDeleteNote?: boolean
}

export default function OrganizationOverview({ org, members, currentUser, memberCount, canCreateNote, canDeleteNote }: OrganizationOverviewProps) {
  const router = useRouter()
  const {
    setIsCreateProjectModalOpen,
    setIsInviteModalOpen,
    stars,
    setStars,
  } = useBoardStore()

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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0C66E4] bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            >
              <UserPlus size={16} />
              Invite people
            </button>
            <button className="p-2 text-foreground/40 hover:text-foreground hover:bg-panel rounded-md transition-colors">
              <Settings size={20} />
            </button>
          </div>
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
            {org.projects.map((proj) => {
              const starred = stars.some(s => s.entityType === 'PROJECT' && s.entityId === proj.id)
              return (
                <div 
                  key={proj.id}
                  onClick={() => router.push(`/${org.id}/projects/${proj.id}`)}
                  className="group p-6 bg-white border border-border/50 hover:border-primary/50 rounded-md transition-all cursor-pointer flex flex-col gap-4 relative"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FolderKanban size={20} />
                    </div>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        await toggleStar(proj.id, 'PROJECT')
                        const { stars } = await getUserStarsAndRecents()
                        setStars(stars)
                      }}
                      className={`p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 ${starred ? 'opacity-100! bg-yellow-50 text-yellow-500' : 'text-[#6B778C] hover:bg-[#F4F5F7]'}`}
                      title={starred ? 'Unstar' : 'Star'}
                    >
                      <Star size={16} className={starred ? 'fill-yellow-400' : ''} />
                    </button>
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground group-hover:text-blue-600 transition-colors">{proj.name}</h3>
                    <p className="text-sm text-foreground/50 mt-1">Click to open board</p>
                  </div>
                </div>
              )
            })}
            
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

        {/* Members Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-lg font-semibold text-foreground/80">
              <Users size={20} className="text-green-500" />
              <h2>Members</h2>
            </div>
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="flex items-center gap-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-md transition-colors"
            >
              <Plus size={16} />
              Invite
            </button>
          </div>
          
          <div className="bg-white border border-border/50 rounded-md overflow-hidden">
            <div className="divide-y divide-border/50">
              {(members ?? []).map(member => {
                const isMe = member.id === currentUser?.id
                const initials = (member.name || 'U').charAt(0).toUpperCase()
                const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500']
                const colorIdx = member.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length
                return (
                  <div key={member.id} className="flex items-center justify-between p-4 hover:bg-panel/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full ${colors[colorIdx]} flex items-center justify-center text-white font-bold shadow-inner`}>
                        {initials}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{member.name || 'Unknown'}{isMe ? ' (You)' : ''}</p>
                        <p className="text-xs text-foreground/50">{member.email || ''}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-md capitalize">{member.role.toLowerCase()}</span>
                  </div>
                )
              })}
            </div>
            <div className="px-4 py-2 border-t border-border/50 bg-panel/30">
              <p className="text-xs text-foreground/50">{memberCount ?? 0} member{(memberCount ?? 0) !== 1 ? 's' : ''}</p>
            </div>
            <div className="p-4 border-t border-border/50">
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-[#0C66E4] hover:bg-blue-50 rounded-md transition-colors font-medium"
              >
                <UserPlus size={16} />
                Invite people to {org.name}
              </button>
            </div>
          </div>
        </section>

        {/* Notes Section */}
        <section>
          <NotesSection 
            organizationId={org.id} 
            canCreate={canCreateNote}
            canDelete={canDeleteNote}
            currentUser={currentUser}
          />
        </section>

      </div>
    </div>
  )
}
