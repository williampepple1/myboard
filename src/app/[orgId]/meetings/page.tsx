import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getMeetings } from '@/actions/meetings'
import MeetingsView from '@/components/dashboard/MeetingsView'

export default async function MeetingsPage({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params

  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user) {
    redirect('/login')
  }

  const meetings = await getMeetings(orgId)

  return (
    <MeetingsView 
      meetings={meetings} 
      currentUserEmail={session.user.email} 
      currentUserId={session.user.id} 
    />
  )
}
