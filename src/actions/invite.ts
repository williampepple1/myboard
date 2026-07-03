'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { sendInvitationEmail } from '@/lib/email'

export async function inviteUserToOrganization(organizationId: string, email: string) {
  const { data: session } = await auth.getSession()
  const userId = session?.user?.id
  const userName = session?.user?.name

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true }
  })

  if (!organization) {
    return { success: false, message: 'Organization not found' }
  }

  const existingInvite = await prisma.invitation.findFirst({
    where: {
      email,
      organizationId,
      acceptedAt: null,
      expiresAt: { gt: new Date() }
    }
  })

  if (existingInvite) {
    return { success: false, message: 'An invitation has already been sent to this email' }
  }

  const invitation = await prisma.invitation.create({
    data: {
      email,
      organizationId,
      inviterUserId: userId,
      inviterName: userName,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  })

  const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://myboard.space'}/invite/${invitation.token}`

  await sendInvitationEmail({
    to: email,
    organizationName: organization.name,
    inviterName: userName ?? undefined,
    acceptUrl,
  })

  return { success: true, message: `Invited ${email} successfully!` }
}

export async function acceptInvitation(token: string) {
  const { data: session } = await auth.getSession()
  if (!session?.user?.id || !session?.user?.email) {
    return { success: false, message: 'You must be logged in to accept an invitation' }
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token }
  })

  if (!invitation) {
    return { success: false, message: 'Invalid invitation link' }
  }

  if (invitation.acceptedAt) {
    return { success: false, message: 'This invitation has already been accepted' }
  }

  if (invitation.expiresAt < new Date()) {
    return { success: false, message: 'This invitation has expired' }
  }

  if (invitation.email.toLowerCase() !== session.user.email.toLowerCase()) {
    return {
      success: false,
      message: `This invitation was sent to ${invitation.email}, but you are logged in as ${session.user.email}. Please log in with the correct account.`
    }
  }

  const existing = await prisma.organizationUser.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: invitation.organizationId
      }
    }
  })

  if (existing) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() }
    })
    return { success: true, message: 'You are already a member of this organization' }
  }

  await prisma.organizationUser.create({
    data: {
      userId: session.user.id,
      organizationId: invitation.organizationId,
      role: 'MEMBER'
    }
  })

  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { acceptedAt: new Date() }
  })

  return { success: true, message: 'Invitation accepted!', organizationId: invitation.organizationId }
}
