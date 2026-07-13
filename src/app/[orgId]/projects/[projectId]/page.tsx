import ProjectClient from '@/components/dashboard/ProjectClient'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export default async function ProjectPage(props: { params: Promise<{ orgId: string, projectId: string }> }) {
  const params = await props.params;
  const { orgId, projectId } = params;
  
  const { data: session } = await auth.getSession()
  
  let canCreateNote = false
  let canDeleteNote = false
  
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
    
    // @ts-expect-error Prisma types might be out of sync in the editor
    canCreateNote = orgUser?.role.canCreateNote || false
    // @ts-expect-error Prisma types might be out of sync in the editor
    canDeleteNote = orgUser?.role.canDeleteNote || false
  }
  
  return (
    <ProjectClient 
      projectId={projectId} 
      canCreateNote={canCreateNote}
      canDeleteNote={canDeleteNote}
      currentUser={session?.user ? { id: session.user.id } : undefined}
    />
  )
}
