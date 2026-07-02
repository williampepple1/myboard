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
import type { Project, Column as PrismaColumn } from '@prisma/client'
import type { Task } from '@/components/modals/IssueDetailsModal'
import { useBoardStore } from '@/store/boardStore'

export type ColumnWithTasks = PrismaColumn & { tasks: Task[] }
export type ProjectWithColumns = Project & { columns: ColumnWithTasks[] }

export default function Board() {
  const project = useBoardStore(s => s.projectData)
  const setProjectData = useBoardStore(s => s.setProjectData)

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
      if (overId in prev.columns.map((c) => c.id)) {
        newIndex = overItems.length + 1
      } else {
        const isBelowOverItem =
          over &&
          active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height

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

    if (activeColumn && overColumn && activeColumn !== overColumn) {
      // It was moved in handleDragOver, we just need to persist it
      const movedTask = overColumn.tasks.find((t) => t.id === activeId)
      if (movedTask) {
        // Find index in new column
        const newOrder = overColumn.tasks.findIndex((t) => t.id === activeId)
        await updateTaskColumn(activeId, overColumn.id, newOrder)
      }
    } else if (activeColumn && overColumn && activeColumn === overColumn) {
      // Reordering in same column
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
        // Note: For a robust system we'd persist the new order to DB here
        await updateTaskColumn(activeId, overColumn.id, overIndex)
      }
    }
  }

  const findColumnOfTask = (taskId: string | number) => {
    return project.columns.find((c) => c.tasks.some((t) => t.id === taskId))
  }

  const handleAddTask = (columnId: string) => {
    setCreateModalColumnId(columnId)
    setIsCreateModalOpen(true)
  }

  const handleCreateSubmit = async (data: { title: string, description: string, issueType: IssueType, priority: Priority, columnId: string }) => {
    const newTask = await createTask(data.columnId, project.id, data.title, data.description, data.priority, data.issueType)
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

  return (
    <div className="h-full w-full p-6 overflow-x-auto flex gap-6 bg-white">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {project.columns.map((col) => (
          <Column key={col.id} column={col} onAddTask={() => handleAddTask(col.id)} onTaskClick={(task) => setSelectedTask(task)} />
        ))}
        
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      <CreateIssueModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        columns={project.columns.map(c => ({ id: c.id, name: c.name }))}
        defaultColumnId={createModalColumnId}
        onSubmit={handleCreateSubmit}
      />

      <IssueDetailsModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        columns={project.columns.map(c => ({ id: c.id, name: c.name }))}
        onTaskUpdate={handleTaskUpdate}
      />
    </div>
  )
}
