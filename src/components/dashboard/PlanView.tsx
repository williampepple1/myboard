'use client'

import { Map, Star } from 'lucide-react'
import { useBoardStore } from '@/store/boardStore'
import { toggleStar, getUserStarsAndRecents } from '@/actions/stars'

export default function PlanView({ planName, planId }: { planName: string, planId: string }) {
  const { stars, setStars } = useBoardStore()

  return (
    <div className="flex-1 overflow-y-auto bg-white p-8 animate-in fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#172b4d] flex items-center gap-3">
            <Map size={32} className="text-[#0c66e4]" />
            {planName}
          </h1>
          <button 
            onClick={async () => {
              await toggleStar(planId, 'PLAN')
              const { stars } = await getUserStarsAndRecents()
              setStars(stars)
            }}
            className={`p-2 rounded-md transition-colors ${stars.some(s => s.entityType === 'PLAN' && s.entityId === planId) ? 'bg-yellow-100 text-yellow-500' : 'text-[#6B778C] hover:bg-[#F4F5F7]'}`}
          >
            <Star size={24} className={stars.some(s => s.entityType === 'PLAN' && s.entityId === planId) ? 'fill-yellow-500' : ''} />
          </button>
        </div>
        <div className="prose prose-slate max-w-none">
          <h2 className="text-xl font-medium text-[#172b4d] border-b pb-2 mb-4">Roadmap</h2>
          <div className="p-12 border-2 border-dashed border-[#DFE1E6] rounded-xl flex flex-col items-center justify-center text-center">
            <Map size={48} className="text-[#A5ADBA] mb-4" />
            <h3 className="text-lg font-medium text-[#172b4d] mb-2">No timeline events yet</h3>
            <p className="text-sm text-[#6B778C] mb-6 max-w-sm">Create your first milestone or epic to start planning your timeline.</p>
            <button className="px-4 py-2 bg-[#0c66e4] hover:bg-[#0052cc] text-white rounded-md text-sm font-medium transition-colors">
              Create milestone
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
