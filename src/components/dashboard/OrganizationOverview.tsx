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
    <div className="relative flex-1 h-full overflow-y-auto bg-white animate-in fade-in duration-300">
      
      <div className="relative max-w-5xl mx-auto pb-24">
        
        {/* Crisp Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-8 md:px-12 py-8 mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-[#0052CC] flex items-center justify-center text-white shadow-md shadow-blue-500/10 shrink-0 transform hover:scale-105 transition-transform duration-300">
                <Briefcase size={28} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  {org.name}
                </h1>
                <p className="text-gray-500 font-medium mt-1">Organization Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#0052CC] hover:bg-[#0047B3] rounded-xl shadow-sm active:scale-95 transition-all duration-200"
              >
                <UserPlus size={18} />
                Invite Members
              </button>
              <button 
                onClick={() => router.push(`/${org.id}/settings`)}
                className="p-2.5 text-gray-500 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl shadow-sm active:scale-95 transition-all duration-200"
                title="Organization Settings"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="px-8 md:px-12 space-y-16">
          
          {/* Projects Section */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-[#0052CC] rounded-lg">
                  <FolderKanban size={20} strokeWidth={2.5} />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Active Projects</h2>
              </div>
              <button 
                onClick={() => setIsCreateProjectModalOpen(true)}
                className="flex items-center gap-2 text-sm font-semibold text-[#0052CC] bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors active:scale-95"
              >
                <Plus size={16} strokeWidth={2.5} />
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
                    className="group flex flex-col justify-between p-6 bg-white border border-gray-200 hover:border-[#0052CC]/30 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden"
                  >
                    <div className="relative flex items-start justify-between mb-6">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-100 transition-all duration-300">
                        <FolderKanban size={24} strokeWidth={2} />
                      </div>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          await toggleStar(proj.id, 'PROJECT')
                          const { stars } = await getUserStarsAndRecents()
                          setStars(stars)
                        }}
                        className={`p-2 rounded-full transition-all duration-300 hover:scale-110 active:scale-90 ${starred ? 'bg-amber-100 text-amber-500' : 'text-gray-400 hover:bg-gray-100 opacity-0 group-hover:opacity-100'}`}
                        title={starred ? 'Unstar' : 'Star'}
                      >
                        <Star size={18} className={starred ? 'fill-amber-400' : ''} />
                      </button>
                    </div>
                    <div className="relative">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#0052CC] transition-colors">{proj.name}</h3>
                      <p className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-1 group-hover:text-[#0052CC]/70 transition-colors">
                        Open Board <span className="opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300">→</span>
                      </p>
                    </div>
                  </div>
                )
              })}
              
              {org.projects.length === 0 && (
                <div 
                  onClick={() => setIsCreateProjectModalOpen(true)}
                  className="p-8 border-2 border-dashed border-gray-200 hover:border-[#0052CC]/40 hover:bg-blue-50/50 rounded-2xl flex flex-col items-center justify-center text-center gap-4 cursor-pointer group transition-all duration-300 min-h-[200px]"
                >
                  <div className="w-14 h-14 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-blue-100 group-hover:text-[#0052CC] transition-colors duration-300">
                    <Plus size={28} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-700 group-hover:text-[#0052CC] transition-colors">Create your first project</p>
                    <p className="text-sm text-gray-500 mt-1">Get started by setting up a board</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Members Section */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Users size={20} strokeWidth={2.5} />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Team Members</h2>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-lg transition-colors active:scale-95"
              >
                <Plus size={16} strokeWidth={2.5} />
                Invite
              </button>
            </div>
            
            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
              <div className="divide-y divide-gray-100">
                {(members ?? []).map(member => {
                  const isMe = member.id === currentUser?.id
                  const initials = (member.name || 'U').charAt(0).toUpperCase()
                  // Solid vibrant colors for avatars
                  const colors = [
                    'bg-[#0052CC]', 
                    'bg-[#5243AA]', 
                    'bg-[#00875A]', 
                    'bg-[#FF8B00]', 
                    'bg-[#E34935]'
                  ]
                  const colorIdx = member.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length
                  return (
                    <div key={member.id} className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full ${colors[colorIdx]} flex items-center justify-center text-white text-lg font-bold shadow-sm transform group-hover:scale-105 transition-transform duration-300`}>
                          {initials}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{member.name || 'Unknown'}{isMe && <span className="ml-2 text-xs font-semibold text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-full">You</span>}</p>
                          <p className="text-sm font-medium text-gray-500 mt-0.5">{member.email || ''}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1.5 text-xs font-bold bg-gray-100 text-gray-600 rounded-lg capitalize border border-gray-200 shadow-sm">{member.role.toLowerCase()}</span>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center justify-between p-5 border-t border-gray-100 bg-gray-50">
                <p className="text-sm font-medium text-gray-500">{memberCount ?? 0} team member{(memberCount ?? 0) !== 1 ? 's' : ''}</p>
                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="flex items-center gap-2 text-sm font-bold text-[#0052CC] hover:text-[#0047B3] transition-colors"
                >
                  <UserPlus size={16} />
                  Add more people
                </button>
              </div>
            </div>
          </section>

          {/* Notes Section */}
          <section className="pt-4">
            <NotesSection 
              organizationId={org.id} 
              canCreate={canCreateNote}
              canDelete={canDeleteNote}
              currentUser={currentUser}
            />
          </section>

        </div>
      </div>
    </div>
  )
}
