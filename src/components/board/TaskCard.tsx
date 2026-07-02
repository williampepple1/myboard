'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '@/components/modals/IssueDetailsModal'
import { ISSUE_TYPE_ICONS, PRIORITY_ICONS } from '@/components/modals/IssueDetailsModal'

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
      className={`bg-white border border-transparent hover:border-slate-300 p-3 rounded-md shadow-sm group hover:bg-[#F4F5F7] transition-all cursor-pointer flex flex-col gap-2 ${
        isOverlay ? 'shadow-xl scale-105 rotate-2 border-primary/30' : ''
      }`}
    >
      <div className="flex-1">
        <p className="text-[14px] text-[#172b4d] leading-snug">{task.title}</p>
      </div>
      
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2 text-[#6B778C]">
          <div title={task.issueType} className="flex items-center justify-center">
            {ISSUE_TYPE_ICONS[task.issueType]}
          </div>
          <span className="text-[12px] font-medium tracking-wide">
            KAN-{task.id.slice(0, 2)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div title={task.priority} className="flex items-center justify-center">
            {PRIORITY_ICONS[task.priority]}
          </div>
          <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-white text-[10px] shadow-sm ml-0.5" title="Unassigned">
            M
          </div>
        </div>
      </div>
    </div>
  )
}
