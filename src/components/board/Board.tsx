'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import Column from './Column'
import TaskCard from './TaskCard'
import CreateIssueModal from '@/components/modals/CreateIssueModal'
import IssueDetailsModal from '@/components/modals/IssueDetailsModal'
import { createTask, updateTaskColumn, type Priority, type IssueType } from '@/actions/board'
import type { Project, Column as PrismaColumn, User } from '@prisma/client'
import type { Task } from '@/components/modals/IssueDetailsModal'
import { useBoardStore } from '@/store/boardStore'

export type ColumnWithTasks = PrismaColumn & { tasks: Task[] }
export type ProjectWithColumns = Project & { columns: ColumnWithTasks[]; assignee?: User | null }

type GroupBy = 'none' | 'priority' | 'type'

export default function Board({ groupBy = 'none', currentUser }: { groupBy?: GroupBy, currentUser?: { id: string } }) {
  const project = useBoardStore(s => s.projectData)
  const setProjectData = useBoardStore(s => s.setProjectData)
  const filterAssignedToMe = useBoardStore(s => s.filterAssignedToMe)

  const [activeTask, setActiveTask] = useState<Task | null>(null)
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createModalColumnId, setCreateModalColumnId] = useState('')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  if (!project) return null

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const taskId = active.id
    // Find the task
    let task: Task | null = null
    for (const col of project.columns) {
      const found = col.tasks.find((t) => t.id === taskId)
      if (found) {
        task = found
        break
      }
    }
    setActiveTask(task)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    const activeColumn = findColumnOfTask(activeId)
    const overColumn = project.columns.find((c) => c.id === overId) || findColumnOfTask(overId)

    if (!activeColumn || !overColumn || activeColumn === overColumn) return

    setProjectData((prev) => {
      if (!prev) return prev
      const activeItems = activeColumn.tasks
      const overItems = overColumn.tasks
      const activeIndex = activeItems.findIndex((t) => t.id === activeId)
      const overIndex = overItems.findIndex((t) => t.id === overId)

      let newIndex
      if (prev.columns.some((c) => c.id === overId)) {
        newIndex = overItems.length + 1
      } else {
        const rect = active.rect?.current
        const isBelowOverItem =
          over &&
          rect?.translated &&
          rect.translated.top > over.rect.top + over.rect.height

        const modifier = isBelowOverItem ? 1 : 0
        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1
      }

      return {
        ...prev,
        columns: prev.columns.map((c) => {
          if (c.id === activeColumn.id) {
            return { ...c, tasks: activeItems.filter((t) => t.id !== activeId) }
          }
          if (c.id === overColumn.id) {
            return {
              ...c,
              tasks: [
                ...overItems.slice(0, newIndex),
                { ...activeItems[activeIndex], columnId: overColumn.id },
                ...overItems.slice(newIndex, overItems.length),
              ],
            }
          }
          return c
        })
      }
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    
    const activeColumn = findColumnOfTask(activeId)
    const overColumn = project.columns.find((c) => c.id === overId) || findColumnOfTask(overId)

    try {
      if (activeColumn && overColumn && activeColumn !== overColumn) {
        const movedTask = overColumn.tasks.find((t) => t.id === activeId)
        if (movedTask) {
          const newOrder = overColumn.tasks.findIndex((t) => t.id === activeId)
          await updateTaskColumn(activeId, overColumn.id, newOrder)
        }
      } else if (activeColumn && overColumn && activeColumn === overColumn) {
        const activeIndex = activeColumn.tasks.findIndex((t) => t.id === activeId)
        const overIndex = overColumn.tasks.findIndex((t) => t.id === overId)

        if (activeIndex !== overIndex) {
          setProjectData((prev) => {
            if (!prev) return prev
            return {
              ...prev,
              columns: prev.columns.map((c) => {
                if (c.id === activeColumn.id) {
                  return {
                    ...c,
                    tasks: arrayMove(c.tasks, activeIndex, overIndex)
                  }
                }
                return c
              })
            }
          })
          await updateTaskColumn(activeId, overColumn.id, overIndex)
        }
      }
    } catch (e) {
      console.error('Failed to persist task move', e)
    }
  }

  const findColumnOfTask = (taskId: string | number) => {
    return project.columns.find((c) => c.tasks.some((t) => t.id === taskId))
  }

  const handleAddTask = (columnId: string) => {
    setCreateModalColumnId(columnId)
    setIsCreateModalOpen(true)
  }

  const handleCreateSubmit = async (data: { title: string, description: string, issueType: IssueType, priority: Priority, columnId: string, assigneeId?: string }) => {
    const newTask = await createTask(data.columnId, project.id, data.title, data.description, data.priority, data.issueType, data.assigneeId)
    setProjectData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        columns: prev.columns.map((c) => 
          c.id === data.columnId ? { ...c, tasks: [...c.tasks, newTask as unknown as Task] } : c
        )
      }
    })
  }

  const handleTaskUpdate = (updatedTask: Task) => {
    setProjectData((prev) => {
      if (!prev) return prev
      // Remove from old column and add to new if column changed
      const oldCol = findColumnOfTask(updatedTask.id)
      if (oldCol && oldCol.id !== updatedTask.columnId) {
        return {
          ...prev,
          columns: prev.columns.map((c) => {
            if (c.id === oldCol.id) return { ...c, tasks: c.tasks.filter(t => t.id !== updatedTask.id) }
            if (c.id === updatedTask.columnId) return { ...c, tasks: [...c.tasks, updatedTask] }
            return c
          })
        }
      }

      // Otherwise just update in place
      return {
        ...prev,
        columns: prev.columns.map((c) => 
          c.id === updatedTask.columnId ? { ...c, tasks: c.tasks.map(t => t.id === updatedTask.id ? updatedTask : t) } : c
        )
      }
    })
    setSelectedTask(updatedTask)
  }

  const handleTaskDelete = (taskId: string) => {
    setProjectData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        columns: prev.columns.map((c) => ({
          ...c,
          tasks: c.tasks.filter(t => t.id !== taskId)
        }))
      }
    })
  }

  // Derive display columns based on groupBy
  // Apply assign to me filter
  const filteredColumns = project.columns.map(c => ({
    ...c,
    tasks: c.tasks.filter(t => !filterAssignedToMe || (currentUser && t.assigneeId === currentUser.id))
  }))

  const allTasks = filteredColumns.flatMap(c => c.tasks)

  const PRIORITY_ORDER = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'] as const
  const TYPE_ORDER = ['BUG', 'STORY', 'EPIC', 'TASK'] as const

  const displayColumns: ColumnWithTasks[] = groupBy === 'priority'
    ? PRIORITY_ORDER
        .filter(p => allTasks.some(t => t.priority === p))
        .map(p => ({
          id: `group-priority-${p}`,
          name: p.charAt(0) + p.slice(1).toLowerCase(),
          projectId: project.id,
          order: PRIORITY_ORDER.indexOf(p),
          tasks: allTasks.filter(t => t.priority === p),
        } as ColumnWithTasks))
    : groupBy === 'type'
    ? TYPE_ORDER
        .filter(ty => allTasks.some(t => t.issueType === ty))
        .map(ty => ({
          id: `group-type-${ty}`,
          name: ty.charAt(0) + ty.slice(1).toLowerCase(),
          projectId: project.id,
          order: TYPE_ORDER.indexOf(ty),
          tasks: allTasks.filter(t => t.issueType === ty),
        } as ColumnWithTasks))
    : filteredColumns

  // When grouped, disable drag-and-drop (read-only view)
  const isGrouped = groupBy !== 'none'

  return (
    <div className="h-full w-full p-6 overflow-x-auto flex gap-6 bg-white">
      {isGrouped ? (
        // Grouped view — read-only, no DnD
        <>
          {displayColumns.map((col) => (
            <Column
              key={col.id}
              column={col}
              onAddTask={() => {}}
              onTaskClick={(task) => setSelectedTask(task)}
              readOnly
            />
          ))}
        </>
      ) : (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {filteredColumns.map((col) => (
          <Column key={col.id} column={col} onAddTask={() => handleAddTask(col.id)} onTaskClick={(task) => setSelectedTask(task)} />
        ))}
        
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      )}

      <CreateIssueModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        columns={project.columns.map(c => ({ id: c.id, name: c.name }))}
        defaultColumnId={createModalColumnId}
        orgId={project.organizationId}
        onSubmit={handleCreateSubmit}
      />

      <IssueDetailsModal
        key={selectedTask?.id || 'none'}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        columns={project.columns.map(c => ({ id: c.id, name: c.name }))}
        onTaskUpdate={handleTaskUpdate}
        onTaskDelete={handleTaskDelete}
        orgId={project.organizationId}
      />
    </div>
  )
}
