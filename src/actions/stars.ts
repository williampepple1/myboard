'use server'
import { headers } from "next/headers";

import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { EntityType } from '@prisma/client'

async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    throw new Error('Authentication required')
  }
  return session.user.id
}

export async function toggleStar(entityId: string, entityType: EntityType) {
  const userId = await requireUserId()
  
  const existing = await prisma.userStar.findUnique({
    where: {
      userId_entityId_entityType: {
        userId,
        entityId,
        entityType
      }
    }
  })

  if (existing) {
    await prisma.userStar.delete({
      where: { id: existing.id }
    })
    return { starred: false }
  } else {
    await prisma.userStar.create({
      data: {
        userId,
        entityId,
        entityType
      }
    })
    return { starred: true }
  }
}

export async function recordRecentView(entityId: string, entityType: EntityType) {
  const userId = await requireUserId()

  await prisma.userRecent.upsert({
    where: {
      userId_entityId_entityType: {
        userId,
        entityId,
        entityType
      }
    },
    update: {
      viewedAt: new Date()
    },
    create: {
      userId,
      entityId,
      entityType,
      viewedAt: new Date()
    }
  })

  return { success: true }
}

export async function getUserStarsAndRecents() {
  const userId = await requireUserId()
  
  const [stars, recents] = await Promise.all([
    prisma.userStar.findMany({
      where: { userId }
    }),
    prisma.userRecent.findMany({
      where: { userId },
      orderBy: { viewedAt: 'desc' },
      take: 20
    })
  ])

  return { stars, recents }
}
