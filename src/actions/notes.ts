'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function createNote({
  content,
  organizationId,
  projectId,
  color,
}: {
  content: string
  organizationId?: string
  projectId?: string
  color?: string
}) {
  const { data: session } = await auth.getSession()
  const userId = session?.user?.id
  if (!userId) throw new Error('Not authenticated')

  if (!organizationId && !projectId) {
    throw new Error('Note must belong to an organization or a project')
  }

  const note = await prisma.note.create({
    data: {
      content,
      color,
      organizationId,
      projectId,
      authorId: userId,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  if (projectId) {
    revalidatePath(`/[orgId]/projects/${projectId}`, 'page')
  }
  if (organizationId) {
    revalidatePath(`/${organizationId}`, 'page')
  }

  return note
}

export async function deleteNote(id: string) {
  const { data: session } = await auth.getSession()
  const userId = session?.user?.id
  if (!userId) throw new Error('Not authenticated')

  const note = await prisma.note.findUnique({
    where: { id },
  })

  if (!note) throw new Error('Note not found')
  
  // Basic author check - ideally you'd also check org/project role for canDeleteNote
  if (note.authorId !== userId) {
    // Check if the user has canDeleteNote permission in the org
    if (note.organizationId) {
      const orgUser = await prisma.organizationUser.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: note.organizationId
          }
        },
        include: { role: true }
      })
      if (!orgUser?.role?.canDeleteNote) {
        throw new Error('Not authorized to delete this note')
      }
    } else {
      throw new Error('Not authorized to delete this note')
    }
  }

  await prisma.note.delete({
    where: { id },
  })

  if (note.projectId) {
    revalidatePath(`/[orgId]/projects/${note.projectId}`, 'page')
  }
  if (note.organizationId) {
    revalidatePath(`/${note.organizationId}`, 'page')
  }

  return { success: true }
}

export async function getNotes({ organizationId, projectId }: { organizationId?: string, projectId?: string }) {
  if (!organizationId && !projectId) return []

  const notes = await prisma.note.findMany({
    where: {
      organizationId,
      projectId,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return notes
}
