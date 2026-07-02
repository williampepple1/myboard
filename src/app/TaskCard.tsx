'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import type { Task } from '@prisma/client'

export default function TaskCard({ task, isOverlay }: { task: Task, isOverlay?: boolean }) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  })

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  }

  if (isDragging && !isOverlay) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-primary/5 border-2 border-primary/20 border-dashed rounded-lg p-4 min-h-[80px] opacity-50"
      />
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-panel border border-border p-3 rounded-lg shadow-sm group hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing flex gap-2 ${
        isOverlay ? 'shadow-xl scale-105 rotate-2' : ''
      }`}
    >
      <div className="mt-1 text-foreground/30 group-hover:text-foreground/50 transition-colors">
        <GripVertical size={16} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{task.title}</p>
        {task.description && (
          <p className="text-xs text-foreground/60 mt-1 line-clamp-2">{task.description}</p>
        )}
      </div>
    </div>
  )
}
