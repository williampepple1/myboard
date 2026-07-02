'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import type { Task } from './IssueDetailsModal'
import { ISSUE_TYPE_ICONS, PRIORITY_ICONS } from './IssueDetailsModal'

interface TaskCardProps {
  task: Task
  isOverlay?: boolean
  onClick?: () => void
}

export default function TaskCard({ task, isOverlay, onClick }: TaskCardProps) {
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
        className="bg-primary/5 border-2 border-primary/20 border-dashed rounded-lg p-4 min-h-[100px] opacity-50"
      />
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => {
        // Prevent drag events from triggering the click
        if (onClick && !isDragging) {
          onClick()
        }
      }}
      className={`bg-panel border border-border p-3.5 rounded-lg shadow-sm group hover:shadow-md hover:border-primary/30 transition-all cursor-pointer flex flex-col gap-3 ${
        isOverlay ? 'shadow-xl scale-105 rotate-2' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5 text-foreground/30 group-hover:text-foreground/50 transition-colors cursor-grab active:cursor-grabbing">
          <GripVertical size={16} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground leading-snug">{task.title}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-auto pt-1 pl-6">
        <div className="flex items-center gap-2">
          <div title={task.issueType} className="p-1 bg-background rounded border border-border">
            {ISSUE_TYPE_ICONS[task.issueType]}
          </div>
          <div title={task.priority} className="p-1 bg-background rounded border border-border">
            {PRIORITY_ICONS[task.priority]}
          </div>
          <span className="text-[10px] font-medium text-foreground/50 uppercase tracking-wider">
            {task.id.slice(0, 5)}
          </span>
        </div>
        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-[10px] shadow-sm border border-blue-200" title="Unassigned">
          UN
        </div>
      </div>
    </div>
  )
}
