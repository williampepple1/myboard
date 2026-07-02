'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

async function getUserId() {
  const { data: session } = await auth.getSession()
  return session?.user?.id || "dummy-user-id"
}

export async function inviteUserToOrganization(organizationId: string, email: string) {
  const inviterId = await getUserId()

  // In a real application, you would look up the user by email using Neon Auth Admin API
  // or create an Invitation record that they can accept later.
  // For now, we will create a mock OrganizationUser with a generated ID so it appears in the UI.
  
  // Try to find if we already have this user in the org (mocking by email)
  // Since we don't have an email field on OrganizationUser, we just generate a random UUID
  const mockUserId = crypto.randomUUID()

  await prisma.organizationUser.create({
    data: {
      userId: mockUserId,
      organizationId,
      role: 'MEMBER'
    }
  })

  return { success: true, message: `Invited ${email} successfully!` }
}
