import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { acceptInvitation } from '@/actions/invite'
import AcceptInviteClient from './AcceptInviteClient'

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { organization: { select: { name: true } } }
  })

  if (!invitation) {
    return <AcceptInviteClient error="Invalid invitation link." />
  }

  if (invitation.acceptedAt) {
    return <AcceptInviteClient error="This invitation has already been accepted." />
  }

  if (invitation.expiresAt < new Date()) {
    return <AcceptInviteClient error="This invitation has expired." />
  }

  const { data: session } = await auth.getSession()

  if (!session?.user) {
    redirect(`/login?redirect=/invite/${token}`)
  }

  if (session.user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
    return (
      <AcceptInviteClient
        error={`This invitation was sent to ${invitation.email}, but you are logged in as ${session.user.email}. Please log in with the correct account.`}
      />
    )
  }

  const result = await acceptInvitation(token)

  if (!result.success) {
    return <AcceptInviteClient error={result.message} />
  }

  redirect(`/${invitation.organizationId}`)
}
