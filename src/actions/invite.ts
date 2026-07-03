'use server'

import prisma from '@/lib/prisma'
import { sendInvitationEmail } from '@/lib/email'


export async function inviteUserToOrganization(organizationId: string, email: string) {

  // Fetch the organization name so we can include it in the email
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true }
  })

  // In a real application, you would look up the user by email using Neon Auth Admin API
  // or create an Invitation record that they can accept later.
  // For now, we will create a mock OrganizationUser with a generated ID so it appears in the UI.
  const mockUserId = crypto.randomUUID()

  await prisma.organizationUser.create({
    data: {
      userId: mockUserId,
      organizationId,
      role: 'MEMBER'
    }
  })

  // Send a branded invitation email via Brevo
  await sendInvitationEmail({
    to: email,
    organizationName: organization?.name ?? 'your organization',
  })

  return { success: true, message: `Invited ${email} successfully!` }
}
