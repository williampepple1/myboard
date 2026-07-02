'use client'

import { useEffect } from 'react'
import SpaceView from '@/components/dashboard/SpaceView'
import { useBoardStore } from '@/store/boardStore'
import { recordRecentView, getUserStarsAndRecents } from '@/actions/stars'

export default function SpaceClient({ spaceId, orgId }: { spaceId: string, orgId: string }) {
  const { orgs, setRecents } = useBoardStore()
  
  useEffect(() => {
    recordRecentView(spaceId, 'SPACE').then(() => {
      getUserStarsAndRecents().then(({ recents }) => setRecents(recents))
    })
  }, [spaceId, setRecents])

  const selectedOrg = orgs.find(o => o.id === orgId)
  const space = selectedOrg?.spaces.find(s => s.id === spaceId)

  if (!space) return <div className="p-8 text-[#6B778C]">Space not found</div>

  return <SpaceView spaceId={space.id} spaceName={space.name} />
}
