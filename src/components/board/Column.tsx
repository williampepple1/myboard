'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import TaskCard from './TaskCard'
import type { ColumnWithTasks } from './Board'
import type { Task } from '@/components/modals/IssueDetailsModal'

export default function Column({ column, onAddTask, onTaskClick, readOnly = false }: { column: ColumnWithTasks, onAddTask: () => void, onTaskClick: (task: Task) => void, readOnly?: boolean }) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  })

  // Colour coding — status columns get a top border, grouped columns get colour by name
  let topBorderColor = 'border-t-transparent'
  const lowerName = column.name.toLowerCase()
  if (lowerName === 'in progress') topBorderColor = 'border-t-[#0C66E4]'
  else if (lowerName === 'in review') topBorderColor = 'border-t-[#E34935]'
  else if (lowerName === 'done') topBorderColor = 'border-t-[#22A06B]'
  // Priority colours
  else if (lowerName === 'urgent') topBorderColor = 'border-t-red-500'
  else if (lowerName === 'high') topBorderColor = 'border-t-orange-400'
  else if (lowerName === 'medium') topBorderColor = 'border-t-yellow-400'
  else if (lowerName === 'low') topBorderColor = 'border-t-slate-400'
  // Type colours
  else if (lowerName === 'bug') topBorderColor = 'border-t-red-400'
  else if (lowerName === 'epic') topBorderColor = 'border-t-purple-500'
  else if (lowerName === 'story') topBorderColor = 'border-t-green-500'

  return (
    <div className={`flex flex-col w-64 shrink-0 bg-[#F4F5F7] dark:bg-[#1D2125] rounded-md border-t-[3px] ${topBorderColor}`}>
      <div className="p-3 pb-2 flex items-center gap-2">
        <h3 className="text-[11px] font-bold text-[#6B778C] dark:text-[#9FADBC] uppercase tracking-wider">{column.name}</h3>
        <span className="text-[11px] bg-[#DFE1E6] dark:bg-[#454F59] text-[#42526E] dark:text-[#B6C2CF] px-1.5 rounded font-medium">
          {column.tasks.length}
        </span>
      </div>
      
      <div 
        ref={readOnly ? undefined : setNodeRef}
        className="px-2 pb-2 flex-1 overflow-y-auto flex flex-col gap-2 min-h-[150px]"
      >
        <SortableContext items={readOnly ? [] : column.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>
        
        {!readOnly && (
          <button 
            onClick={onAddTask}
            className="w-full flex items-center gap-1.5 py-1.5 px-2 mt-1 rounded text-[#42526E] dark:text-[#B6C2CF] hover:bg-[#EBECF0] dark:hover:bg-[#2D3236] transition-colors text-[13px] font-medium"
          >
            <Plus size={16} /> Create
          </button>
        )}
      </div>
    </div>
  )
}
