'use server'

import prisma from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

async function getUserId() {
  const session = await verifySession()
  // For development fallback if no auth is present, we could use a dummy user
  // return session?.sub || "dummy-user-id"
  return session?.sub || "dummy-user-id"
}

export async function getOrganizations() {
  const userId = await getUserId()
  return prisma.organization.findMany({
    where: { users: { some: { userId } } },
    include: { projects: true }
  })
}

export async function createOrganization(name: string) {
  const userId = await getUserId()
  
  return prisma.organization.create({
    data: {
      name,
      users: {
        create: {
          userId,
          role: 'ADMIN'
        }
      }
    }
  })
}

export async function getProjectData(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      columns: {
        orderBy: { order: 'asc' },
        include: {
          tasks: {
            orderBy: { order: 'asc' }
          }
        }
      }
    }
  })
}

export async function createProject(organizationId: string, name: string) {
  return prisma.project.create({
    data: {
      name,
      organizationId,
      columns: {
        create: [
          { name: 'To Do', order: 0 },
          { name: 'In Progress', order: 1 },
          { name: 'Done', order: 2 }
        ]
      }
    }
  })
}

export async function createTask(columnId: string, projectId: string, title: string) {
  const count = await prisma.task.count({ where: { columnId } })
  return prisma.task.create({
    data: {
      title,
      columnId,
      projectId,
      order: count,
    }
  })
}

export async function updateTaskColumn(taskId: string, newColumnId: string, newOrder: number) {
  // In a real app we'd reorder everything properly.
  // For now we just update the dragged task's column and order.
  return prisma.task.update({
    where: { id: taskId },
    data: {
      columnId: newColumnId,
      order: newOrder
    }
  })
}
