'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { sendWelcomeEmail } from '@/lib/email'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type IssueType = 'TASK' | 'BUG' | 'STORY' | 'EPIC'
async function getSession() {
  const { data: session } = await auth.getSession()
  return session
}

async function getUserId() {
  const session = await getSession()
  // For development fallback if no auth is present, we could use a dummy user
  // return session?.user.id || "dummy-user-id"
  return session?.user?.id || "dummy-user-id"
}

export async function getOrganizations() {
  const userId = await getUserId()
  return prisma.organization.findMany({
    where: { users: { some: { userId } } },
    include: { 
      projects: true,
      spaces: true,
      plans: true
    }
  })
}

export async function createOrganization(name: string) {
  const session = await getSession()
  const userId = session?.user?.id || "dummy-user-id"

  // Check if this is the user's first organization (send welcome email only once)
  const existingOrgs = await prisma.organizationUser.count({ where: { userId } })

  const org = await prisma.organization.create({
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

  // Send a welcome email on first org creation
  if (existingOrgs === 0 && session?.user?.email) {
    await sendWelcomeEmail({
      to: session.user.email,
      name: session.user.name ?? undefined,
    })
  }

  return org
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

export async function createTask(
  columnId: string, 
  projectId: string, 
  title: string, 
  description?: string, 
  priority?: Priority, 
  issueType?: IssueType
) {
  const count = await prisma.task.count({ where: { columnId } })
  return prisma.task.create({
    data: {
      title,
      description: description || null,
      priority: (priority || 'MEDIUM') as Priority,
      issueType: (issueType || 'TASK') as IssueType,
      columnId,
      projectId,
      order: count,
    }
  })
}

export async function updateTaskDetails(
  taskId: string,
  data: {
    title?: string
    description?: string | null
    priority?: Priority
    issueType?: IssueType
    columnId?: string
  }
) {
  return prisma.task.update({
    where: { id: taskId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.priority !== undefined && { priority: data.priority as Priority }),
      ...(data.issueType !== undefined && { issueType: data.issueType as IssueType }),
      ...(data.columnId !== undefined && { columnId: data.columnId }),
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

export async function createSpace(name: string, organizationId: string) {
  return prisma.space.create({
    data: {
      name,
      organizationId
    }
  })
}

export async function createPlan(name: string, organizationId: string) {
  return prisma.plan.create({
    data: {
      name,
      organizationId
    }
  })
}
