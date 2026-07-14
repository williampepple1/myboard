'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    throw new Error('Authentication required')
  }
  return session
}

export async function getNotifications() {
  const session = await requireAuth()
  return prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50 // Limit to recent 50 notifications
  })
}

export async function markAsRead(notificationId: string) {
  const session = await requireAuth()
  
  // Verify ownership before updating
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId }
  })
  
  if (!notification || notification.userId !== session.user.id) {
    throw new Error('Notification not found or access denied')
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true }
  })
}

export async function markAllAsRead() {
  const session = await requireAuth()
  return prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true }
  })
}
