'use client'

import { useEffect, useState } from 'react'
import { Briefcase, Search, Grid, Share2, Maximize2, MoreHorizontal, Star } from 'lucide-react'
import Board, { type ProjectWithColumns } from '@/components/board/Board'
import { getProjectData } from '@/actions/board'
import { toggleStar, getUserStarsAndRecents, recordRecentView } from '@/actions/stars'
import { useBoardStore } from '@/store/boardStore'

export default function ProjectClient({ projectId }: { projectId: string }) {
  const { projectData, setProjectData, stars, setStars, setRecents } = useBoardStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    
    const init = async () => {
      setLoading(true)
      
      try {
        // Record recent view
        await recordRecentView(projectId, 'PROJECT')
        const { recents } = await getUserStarsAndRecents()
        if (isMounted) setRecents(recents)

        // Fetch project data
        const data = await getProjectData(projectId)
        if (isMounted) {
          setProjectData(data as ProjectWithColumns)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    init()
    
    return () => { isMounted = false }
  }, [projectId, setProjectData, setRecents])

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!projectData || projectData.id !== projectId) {
    return <div className="p-8 text-[#6B778C]">Project not found</div>
  }

  const isStarred = stars.some(s => s.entityType === 'PROJECT' && s.entityId === projectData.id)

  return (
    <div className="flex-1 bg-white overflow-hidden flex flex-col relative">
      {/* Project Header */}
      <div className="px-8 pt-6 pb-2 bg-white border-b border-border shrink-0 z-0">
        <div className="text-sm text-[#6B778C] mb-2 flex items-center gap-1">
          <Briefcase size={14} />
          <span>Projects</span>
          <span>/</span>
          <span>{projectData.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#172B4D]">{projectData.name}</h1>
            <button 
              onClick={async () => {
                await toggleStar(projectData.id, 'PROJECT')
                const { stars } = await getUserStarsAndRecents()
                setStars(stars)
              }}
              className={`p-1.5 rounded-md transition-colors ${isStarred ? 'bg-yellow-100 text-yellow-500' : 'text-[#6B778C] hover:bg-[#F4F5F7]'}`}
            >
              <Star size={18} className={isStarred ? 'fill-yellow-500' : ''} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-6 text-sm font-medium text-[#42526E] mt-4">
          <button className="pb-2 border-b-2 border-transparent hover:text-[#172b4d] transition-colors">Summary</button>
          <button className="pb-2 border-b-2 border-transparent hover:text-[#172b4d] transition-colors">List</button>
          <button className="pb-2 border-b-2 border-primary text-primary transition-colors">Board</button>
          <button className="pb-2 border-b-2 border-transparent hover:text-[#172b4d] transition-colors">Code</button>
          <button className="pb-2 border-b-2 border-transparent hover:text-[#172b4d] transition-colors">Forms</button>
          <button className="pb-2 border-b-2 border-transparent hover:text-[#172b4d] transition-colors">Timeline</button>
          <button className="pb-2 border-b-2 border-transparent hover:text-[#172b4d] transition-colors">Docs</button>
        </div>
      </div>

      {/* Project Toolbar & Content */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        <div className="px-8 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B778C]" />
              <input 
                type="text" 
                placeholder="Search board" 
                className="w-48 pl-9 pr-3 py-1.5 bg-white border border-[#DFE1E6] hover:bg-[#F4F5F7] focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary rounded-md text-sm outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white z-10 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" />
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-white -ml-3 z-20 flex items-center justify-center text-xs text-white">M</div>
              <div className="w-8 h-8 rounded-full bg-orange-400 border-2 border-white -ml-3 z-30 flex items-center justify-center text-xs text-white font-medium">ME</div>
            </div>
            <button className="ml-2 flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#42526E] bg-[#F4F5F7] hover:bg-[#EBECF0] rounded-md transition-colors">
              <Grid size={14} /> Filter
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#42526E] bg-[#F4F5F7] hover:bg-[#EBECF0] rounded-md transition-colors">
              Group <Grid size={14} />
            </button>
            <button className="p-1.5 text-[#42526E] bg-[#F4F5F7] hover:bg-[#EBECF0] rounded-md transition-colors">
              <Share2 size={16} />
            </button>
            <button className="p-1.5 text-[#42526E] bg-[#F4F5F7] hover:bg-[#EBECF0] rounded-md transition-colors">
              <Maximize2 size={16} />
            </button>
            <button className="p-1.5 text-[#42526E] bg-[#F4F5F7] hover:bg-[#EBECF0] rounded-md transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <Board />
        </div>
      </div>
    </div>
  )
}
