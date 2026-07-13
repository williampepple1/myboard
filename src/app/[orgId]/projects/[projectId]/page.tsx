import { headers } from "next/headers";
import ProjectClient from '@/components/dashboard/ProjectClient'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export default async function ProjectPage(props: { params: Promise<{ orgId: string, projectId: string }> }) {
  const params = await props.params;
  const { orgId, projectId } = params;
  
  const session = await auth.api.getSession({ headers: await headers() })
  
  let canCreateNote = false
  let canDeleteNote = false
  let canEditNote = false
  let currentUserRole: string | undefined
  
  if (session?.user?.id) {
    const orgUser = await prisma.organizationUser.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: orgId
        }
      },
      include: { role: true }
    })
    
    canCreateNote = orgUser?.role.canCreateNote || false
    canDeleteNote = orgUser?.role.canDeleteNote || false
    canEditNote = orgUser?.role.canEditNote || false
    currentUserRole = orgUser?.role.name
  }
  
  return (
    <ProjectClient 
      projectId={projectId} 
      canCreateNote={canCreateNote}
      canDeleteNote={canDeleteNote}
      canEditNote={canEditNote}
      currentUser={session?.user ? { id: session.user.id, role: currentUserRole } : undefined}
    />
  )
}
