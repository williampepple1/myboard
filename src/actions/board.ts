'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { sendWelcomeEmail } from '@/lib/email'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type IssueType = 'TASK' | 'BUG' | 'STORY' | 'EPIC'
async function syncUser(session: NonNullable<Awaited<ReturnType<typeof auth.getSession>>['data']>) {
  if (!session?.user?.id) return
  await prisma.user.upsert({
    where: { id: session.user.id },
    update: { name: session.user.name, email: session.user.email },
    create: { id: session.user.id, name: session.user.name, email: session.user.email },
  })
}

async function requireAuth() {
  const { data: session } = await auth.getSession()
  if (!session?.user?.id) {
    throw new Error('Authentication required')
  }
  await syncUser(session)
  return session
}

async function requireOrgMember(organizationId: string) {
  const session = await requireAuth()
  const membership = await prisma.organizationUser.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId,
      }
    }
  })
  if (!membership) {
    throw new Error('You are not a member of this organization')
  }
  return session
}

export async function getOrganizations() {
  const session = await requireAuth()
  return prisma.organization.findMany({
    where: { users: { some: { userId: session.user.id } } },
    include: { 
      projects: true,
      spaces: true,
      plans: true
    }
  })
}

export async function createOrganization(name: string) {
  const session = await requireAuth()

  const existingOrgs = await prisma.organizationUser.count({ where: { userId: session.user.id } })

  const org = await prisma.organization.create({
    data: {
      name,
      users: {
        create: {
          userId: session.user.id,
          role: 'ADMIN'
        }
      }
    }
  })

  if (existingOrgs === 0 && session?.user?.email) {
    await sendWelcomeEmail({
      to: session.user.email,
      name: session.user.name ?? undefined,
    })
  }

  return org
}

export async function getProjectData(projectId: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organization: { select: { id: true } },
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
    if (!project) return null
    await requireOrgMember(project.organization.id)
    return project
  } catch {
    return null
  }
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

export async function deleteTask(taskId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { project: { select: { organizationId: true } } } })
  if (!task) throw new Error('Task not found')
  await requireOrgMember(task.project.organizationId)
  await prisma.task.delete({ where: { id: taskId } })
  return { success: true }
}

export async function updateProject(projectId: string, data: { name?: string }) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { organizationId: true } })
  if (!project) throw new Error('Project not found')
  await requireOrgMember(project.organizationId)
  return prisma.project.update({ where: { id: projectId }, data })
}

export async function deleteProject(projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { organizationId: true } })
  if (!project) throw new Error('Project not found')
  await requireOrgMember(project.organizationId)
  await prisma.project.delete({ where: { id: projectId } })
  return { success: true }
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
