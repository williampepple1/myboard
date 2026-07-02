'use client'

import { useEffect } from 'react'
import PlanView from '@/components/dashboard/PlanView'
import { useBoardStore } from '@/store/boardStore'
import { recordRecentView, getUserStarsAndRecents } from '@/actions/stars'

export default function PlanClient({ planId, orgId }: { planId: string, orgId: string }) {
  const { orgs, setRecents } = useBoardStore()
  
  useEffect(() => {
    recordRecentView(planId, 'PLAN').then(() => {
      getUserStarsAndRecents().then(({ recents }) => setRecents(recents))
    })
  }, [planId, setRecents])

  const selectedOrg = orgs.find(o => o.id === orgId)
  const plan = selectedOrg?.plans.find(p => p.id === planId)

  if (!plan) return <div className="p-8 text-[#6B778C]">Plan not found</div>

  return <PlanView planId={plan.id} planName={plan.name} />
}
