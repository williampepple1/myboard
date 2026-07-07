'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar } from 'lucide-react'
import type { Task } from '@/components/modals/IssueDetailsModal'
import { ISSUE_TYPE_ICONS, PRIORITY_ICONS } from '@/lib/icons'

interface TaskCardProps {
  task: Task
  isOverlay?: boolean
  onClick?: () => void
}

export default function TaskCard({ task, isOverlay, onClick }: TaskCardProps) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'Task', task },
  })

  const style = { transition, transform: CSS.Transform.toString(transform) }
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date()

  if (isDragging && !isOverlay) {
    return <div ref={setNodeRef} style={style} className="bg-primary/5 border-2 border-primary/20 border-dashed rounded-lg p-4 min-h-[80px] opacity-50" />
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      onClick={() => { if (onClick && !isDragging) onClick() }}
      className={`bg-white dark:bg-[#2D3236] border border-transparent hover:border-slate-300 dark:hover:border-slate-500 p-3 rounded-md shadow-sm group hover:bg-[#F4F5F7] dark:hover:bg-[#383D42] transition-all cursor-pointer flex flex-col gap-2 ${isOverlay ? 'shadow-xl scale-105 rotate-2 border-primary/30' : ''}`}>
      
      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.labels.map(({ label }) => (
            <span key={label.id} className="px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{ backgroundColor: label.color + '20', color: label.color }}>
              {label.name}
            </span>
          ))}
        </div>
      )}

      <p className="text-[14px] text-[#172b4d] dark:text-[#B6C2CF] leading-snug">{task.title}</p>

      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2 text-[#6B778C] dark:text-[#9FADBC]">
          <div title={task.issueType}>{ISSUE_TYPE_ICONS[task.issueType]}</div>
          <span className="text-[12px] font-medium tracking-wide">KAN-{task.id.slice(0, 7)}</span>
          {task.dueDate && (
            <span className={`flex items-center gap-0.5 text-[11px] ${isOverdue ? 'text-red-500' : ''}`}>
              <Calendar size={11} />
              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <div title={task.priority}>{PRIORITY_ICONS[task.priority]}</div>
          {task.assigneeId && (
            <div className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center text-white text-[9px] font-bold" title="Assigned">
              A
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
