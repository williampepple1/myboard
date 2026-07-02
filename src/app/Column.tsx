'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import TaskCard from './TaskCard'
import type { ColumnWithTasks } from './Board'

export default function Column({ column, onAddTask }: { column: ColumnWithTasks, onAddTask: () => void }) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  })

  return (
    <div className="flex flex-col w-80 shrink-0 bg-white rounded-xl border border-border/50 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-border/50 bg-panel flex items-center justify-between">
        <h3 className="font-semibold text-foreground/80">{column.name}</h3>
        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
          {column.tasks.length}
        </span>
      </div>
      
      <div 
        ref={setNodeRef}
        className="p-3 flex-1 overflow-y-auto flex flex-col gap-3 min-h-[150px]"
      >
        <SortableContext items={column.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
        
        <button 
          onClick={onAddTask}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 mt-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors text-xs font-medium shadow-sm"
        >
          <Plus size={14} /> Add Task
        </button>
      </div>
    </div>
  )
}
