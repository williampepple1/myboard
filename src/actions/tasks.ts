'use server'

import prisma from '@/lib/prisma'
import { requirePermission } from './board'

export async function getTaskComments(taskId: string) {
  return prisma.comment.findMany({
    where: { taskId },
    include: { author: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  })
}

export async function addComment(taskId: string, content: string, organizationId: string) {
  const { session } = await requirePermission(organizationId, 'canEditTask')
  return prisma.comment.create({
    data: { content, taskId, authorId: session.user.id },
    include: { author: { select: { id: true, name: true, email: true } } },
  })
}

export async function deleteComment(commentId: string, organizationId: string) {
  await requirePermission(organizationId, 'canEditTask')
  await prisma.comment.delete({ where: { id: commentId } })
  return { success: true }
}

export async function getTaskLabels(taskId: string) {
  return prisma.taskLabel.findMany({
    where: { taskId },
    include: { label: true },
  })
}

export async function setTaskLabels(taskId: string, labelIds: string[], organizationId: string) {
  await requirePermission(organizationId, 'canEditTask')
  await prisma.taskLabel.deleteMany({ where: { taskId } })
  if (labelIds.length > 0) {
    await prisma.taskLabel.createMany({
      data: labelIds.map(labelId => ({ taskId, labelId })),
    })
  }
  return prisma.taskLabel.findMany({ where: { taskId }, include: { label: true } })
}

export async function getAllLabels() {
  return prisma.label.findMany({ orderBy: { name: 'asc' } })
}

export async function createLabel(name: string, color: string) {
  return prisma.label.upsert({
    where: { name_color: { name, color } },
    update: {},
    create: { name, color },
  })
}

export async function setTaskAssignee(taskId: string, assigneeId: string | null, organizationId: string) {
  await requirePermission(organizationId, 'canEditTask')
  return prisma.task.update({
    where: { id: taskId },
    data: { assigneeId },
  })
}

export async function setTaskDueDate(taskId: string, dueDate: Date | null, organizationId: string) {
  await requirePermission(organizationId, 'canEditTask')
  return prisma.task.update({
    where: { id: taskId },
    data: { dueDate },
  })
}

export async function getOrgMembersForAssignee(organizationId: string) {
  await requirePermission(organizationId, 'canEditTask')
  return prisma.organizationUser.findMany({
    where: { organizationId },
    include: { user: { select: { id: true, name: true, email: true } } },
  })
}

export async function createNotification(userId: string, title: string, message?: string, link?: string) {
  return prisma.notification.create({ data: { userId, title, message, link } })
}

export async function getNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

export async function markNotificationRead(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  })
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  })
  return { success: true }
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({ where: { userId, read: false } })
}

const LABEL_COLORS = ['#4338CA', '#22A06B', '#E34935', '#F5CD47', '#8C6BDF', '#E76E99', '#4BCE97', '#6B778C']

export async function getSubtasks(taskId: string) {
  return prisma.task.findMany({
    where: { parentTaskId: taskId },
    orderBy: { order: 'asc' },
  })
}

export async function createSubtask(parentTaskId: string, title: string, organizationId: string) {
  await requirePermission(organizationId, 'canCreateTask')
  const parent = await prisma.task.findUnique({ where: { id: parentTaskId }, select: { columnId: true, projectId: true } })
  if (!parent) throw new Error('Parent task not found')
  const count = await prisma.task.count({ where: { parentTaskId } })
  return prisma.task.create({
    data: { title, columnId: parent.columnId, projectId: parent.projectId, parentTaskId, order: count },
  })
}

export async function toggleSubtask(taskId: string, completed: boolean, organizationId: string) {
  await requirePermission(organizationId, 'canEditTask')
  return prisma.task.update({ where: { id: taskId }, data: { completed } })
}

export async function deleteSubtask(taskId: string, organizationId: string) {
  await requirePermission(organizationId, 'canDeleteTask')
  await prisma.task.delete({ where: { id: taskId } })
  return { success: true }
}

export async function ensureDefaultLabels() {
  const existing = await prisma.label.count()
  if (existing > 0) return
  const defaults = [
    { name: 'Bug', color: LABEL_COLORS[2] },
    { name: 'Feature', color: LABEL_COLORS[0] },
    { name: 'Improvement', color: LABEL_COLORS[1] },
    { name: 'Question', color: LABEL_COLORS[3] },
    { name: 'Documentation', color: LABEL_COLORS[4] },
    { name: 'Design', color: LABEL_COLORS[5] },
  ]
  await prisma.label.createMany({ data: defaults })
}
