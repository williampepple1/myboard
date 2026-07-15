'use server'
import { headers } from "next/headers";

import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { sendWelcomeEmail } from '@/lib/email'
import { type Permission, type RolePermissions } from './permissions'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type IssueType = 'TASK' | 'BUG' | 'STORY' | 'EPIC'
async function syncUser(session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>) {
  if (!session?.user?.id) return
  await prisma.user.upsert({
    where: { id: session.user.id },
    update: { name: session.user.name, email: session.user.email },
    create: { id: session.user.id, name: session.user.name, email: session.user.email },
  })
}

async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    throw new Error('Authentication required')
  }
  await syncUser(session)
  return session
}

export async function requireOrgMember(organizationId: string) {
  const session = await requireAuth()
  const membership = await prisma.organizationUser.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId,
      }
    },
    include: { role: true }
  })
  if (!membership) {
    throw new Error('You are not a member of this organization')
  }
  return { session, membership, role: membership.role }
}

export async function requirePermission(organizationId: string, permission: Permission) {
  const { session, membership, role } = await requireOrgMember(organizationId)
  if (!(role as unknown as RolePermissions)[permission]) {
    const label = permission.replace(/^can/, '').replace(/([A-Z])/g, ' $1').toLowerCase().trim()
    throw new Error(`You don't have permission to ${label}`)
  }
  return { session, membership, role }
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

export async function getOrganization(organizationId: string) {
  await requireOrgMember(organizationId)
  return prisma.organization.findUnique({
    where: { id: organizationId }
  })
}

export async function createOrganization(name: string) {
  const session = await requireAuth()

  const existingOrgs = await prisma.organizationUser.count({ where: { userId: session.user.id } })

  const org = await prisma.organization.create({ data: { name } })

  const adminRole = await prisma.organizationRole.create({
    data: { 
      name: 'Admin', 
      description: 'Full access to everything', 
      organizationId: org.id, 
      canManageSettings: true, 
      canManageRoles: true, 
      canManageGroups: true, 
      canInviteMembers: true, 
      canRemoveMembers: true, 
      canCreateProject: true, 
      canDeleteProject: true, 
      canCreateTask: true, 
      canDeleteTask: true, 
      canEditTask: true,
      canCreateNote: true,
      canEditNote: true,
      canDeleteNote: true,
      canManageFinance: true,
      canViewFinance: true
    },
  })
  await prisma.organizationRole.create({
    data: { name: 'Member', description: 'Can create and edit tasks and projects', organizationId: org.id, isDefault: true, canCreateProject: true, canCreateTask: true, canDeleteTask: true, canEditTask: true },
  })
  await prisma.organizationRole.create({
    data: { name: 'Viewer', description: 'Read-only access', organizationId: org.id },
  })

  await prisma.organizationUser.create({
    data: {
      userId: session.user.id,
      organizationId: org.id,
      roleId: adminRole.id,
    },
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
        assignee: true,
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

export async function createProject(organizationId: string, name: string, assigneeId?: string) {
  await requirePermission(organizationId, 'canCreateProject')
  return prisma.project.create({
    data: {
      name,
      organizationId,
      assigneeId: assigneeId || null,
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
  issueType?: IssueType,
  assigneeId?: string
) {
  const session = await auth.api.getSession({ headers: await headers() })
  const count = await prisma.task.count({ where: { columnId } })
  const task = await prisma.task.create({
    data: {
      title,
      description: description || null,
      priority: (priority || 'MEDIUM') as Priority,
      issueType: (issueType || 'TASK') as IssueType,
      columnId,
      projectId,
      order: count,
      assigneeId: assigneeId || null,
    }
  })

  if (assigneeId && session?.user?.id && assigneeId !== session.user.id) {
    await prisma.notification.create({
      data: {
        userId: assigneeId,
        title: 'New Task Assigned',
        message: `${session.user.name || 'Someone'} assigned you a new task: ${title}`,
        link: `/project/${projectId}?task=${task.id}` // A rough link, assuming this might be useful
      }
    })
  }

  return task
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

export async function updateProjectAssignee(projectId: string, assigneeId: string | null) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { organizationId: true } })
  if (!project) throw new Error('Project not found')
  await requirePermission(project.organizationId, 'canCreateProject') // Using canCreateProject as proxy for project admin right now
  return prisma.project.update({ where: { id: projectId }, data: { assigneeId } })
}

export async function deleteProject(projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { organizationId: true } })
  if (!project) throw new Error('Project not found')
  await requireOrgMember(project.organizationId)
  await prisma.project.delete({ where: { id: projectId } })
  return { success: true }
}

export async function getOrgMembers(organizationId: string) {
  await requireOrgMember(organizationId)
  return prisma.organizationUser.findMany({
    where: { organizationId },
    include: { user: true, role: true },
  })
}

export async function getOrgRoles(organizationId: string) {
  await requireOrgMember(organizationId)
  return prisma.organizationRole.findMany({ where: { organizationId }, orderBy: { createdAt: 'asc' } })
}

export async function getOrgGroups(organizationId: string) {
  await requireOrgMember(organizationId)
  return prisma.organizationGroup.findMany({
    where: { organizationId },
    include: { members: { include: { user: true } } },
    orderBy: { createdAt: 'asc' },
  })
}

export async function updateMemberRole(organizationId: string, userId: string, roleId: string) {
  await requirePermission(organizationId, 'canManageRoles')
  return prisma.organizationUser.update({
    where: { userId_organizationId: { userId, organizationId } },
    data: { roleId },
  })
}

export async function removeMember(organizationId: string, userId: string) {
  await requirePermission(organizationId, 'canRemoveMembers')
  await prisma.organizationUser.delete({ where: { userId_organizationId: { userId, organizationId } } })
  return { success: true }
}

export async function createRole(organizationId: string, data: { name: string; description?: string; canCreateProject?: boolean; canCreateTask?: boolean; canDeleteTask?: boolean; canEditTask?: boolean }) {
  await requirePermission(organizationId, 'canManageRoles')
  return prisma.organizationRole.create({
    data: { ...data, organizationId },
  })
}

export async function updateRole(roleId: string, data: Partial<{ name: string; description: string; canManageSettings: boolean; canManageRoles: boolean; canManageGroups: boolean; canInviteMembers: boolean; canRemoveMembers: boolean; canCreateProject: boolean; canDeleteProject: boolean; canCreateTask: boolean; canDeleteTask: boolean; canEditTask: boolean }>) {
  const role = await prisma.organizationRole.findUnique({ where: { id: roleId }, select: { organizationId: true } })
  if (!role) throw new Error('Role not found')
  await requirePermission(role.organizationId, 'canManageRoles')
  return prisma.organizationRole.update({ where: { id: roleId }, data })
}

export async function deleteRole(roleId: string) {
  const role = await prisma.organizationRole.findUnique({ where: { id: roleId }, select: { organizationId: true } })
  if (!role) throw new Error('Role not found')
  await requirePermission(role.organizationId, 'canManageRoles')
  await prisma.organizationRole.delete({ where: { id: roleId } })
  return { success: true }
}

export async function createGroup(organizationId: string, name: string, description?: string) {
  await requirePermission(organizationId, 'canManageGroups')
  return prisma.organizationGroup.create({ data: { name, description, organizationId } })
}

export async function deleteGroup(groupId: string) {
  const group = await prisma.organizationGroup.findUnique({ where: { id: groupId }, select: { organizationId: true } })
  if (!group) throw new Error('Group not found')
  await requirePermission(group.organizationId, 'canManageGroups')
  await prisma.organizationGroup.delete({ where: { id: groupId } })
  return { success: true }
}

export async function addGroupMember(groupId: string, userId: string) {
  const group = await prisma.organizationGroup.findUnique({ where: { id: groupId }, select: { organizationId: true } })
  if (!group) throw new Error('Group not found')
  await requirePermission(group.organizationId, 'canManageGroups')
  await prisma.organizationGroupMember.create({ data: { groupId, userId } })
  return { success: true }
}

export async function removeGroupMember(groupId: string, userId: string) {
  const group = await prisma.organizationGroup.findUnique({ where: { id: groupId }, select: { organizationId: true } })
  if (!group) throw new Error('Group not found')
  await requirePermission(group.organizationId, 'canManageGroups')
  await prisma.organizationGroupMember.delete({ where: { groupId_userId: { groupId, userId } } })
  return { success: true }
}

export async function createSpace(name: string, organizationId: string) {
  await requirePermission(organizationId, 'canCreateProject')
  return prisma.space.create({
    data: {
      name,
      organizationId
    }
  })
}

export async function createPlan(name: string, organizationId: string) {
  await requirePermission(organizationId, 'canCreateProject')
  return prisma.plan.create({
    data: {
      name,
      organizationId
    }
  })
}
