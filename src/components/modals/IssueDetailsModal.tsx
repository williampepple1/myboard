'use client'

import { useState } from 'react'
import { X, AlignLeft, Trash2 } from 'lucide-react'
import type { Task as PrismaTask } from '@prisma/client'
import { updateTaskDetails, deleteTask, type Priority, type IssueType } from '@/actions/board'
import { ISSUE_TYPE_ICONS, PRIORITY_ICONS } from '@/lib/icons'

export type Task = PrismaTask & {
  priority: Priority
  issueType: IssueType
  createdAt: Date
  updatedAt: Date
}

interface Column {
  id: string
  name: string
}

interface IssueDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  task: Task | null
  columns: Column[]
  onTaskUpdate: (updatedTask: Task) => void
  onTaskDelete?: (taskId: string) => void
}

export default function IssueDetailsModal({ isOpen, onClose, task, columns, onTaskUpdate, onTaskDelete }: IssueDetailsModalProps) {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [issueType, setIssueType] = useState<IssueType>(task?.issueType || 'TASK')
  const [priority, setPriority] = useState<Priority>(task?.priority || 'MEDIUM')
  const [columnId, setColumnId] = useState(task?.columnId || '')
  const [isUpdating, setIsUpdating] = useState(false)

  if (!isOpen || !task) return null

  const handleUpdate = async (field: keyof Task, value: string) => {
    setIsUpdating(true)
    try {
      await updateTaskDetails(task.id, { [field]: value })
      onTaskUpdate({ ...task, [field]: value } as Task)
    } catch (e) {
      console.error("Failed to update task", e)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-full bg-white border border-border rounded-md shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-panel">
          <div className="flex items-center gap-3 text-sm text-foreground/60 font-medium uppercase tracking-wide">
            {ISSUE_TYPE_ICONS[issueType]}
            <span>{task.id.slice(0, 8)}</span>
          </div>
          <div className="flex items-center gap-1">
            {onTaskDelete && (
              <button
                onClick={async () => {
                  if (!confirm('Delete this task?')) return
                  try {
                    await deleteTask(task.id)
                    onTaskDelete(task.id)
                    onClose()
                  } catch (e) {
                    console.error('Failed to delete task', e)
                  }
                }}
                className="p-2 hover:bg-red-50 rounded-md text-foreground/50 hover:text-red-500 transition-colors"
                title="Delete task"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-background rounded-md text-foreground/50 hover:text-foreground transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          
          {/* Main Column */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  if (title !== task.title) handleUpdate('title', title)
                }}
                className="w-full text-2xl font-semibold text-foreground bg-transparent border-2 border-transparent hover:border-border hover:bg-background focus:bg-background focus:border-primary/50 focus:ring-0 rounded-lg px-3 py-2 -ml-3 transition-colors outline-none"
                placeholder="Task title..."
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4 font-medium text-foreground/80">
                <AlignLeft size={18} />
                <h3>Description</h3>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => {
                  if (description !== (task.description || '')) handleUpdate('description', description)
                }}
                placeholder="Add a more detailed description..."
                className="w-full min-h-[150px] p-4 bg-background border border-border rounded-lg outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm resize-y hover:bg-background/80"
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full md:w-80 bg-panel border-l border-border p-6 flex flex-col gap-6 overflow-y-auto shrink-0">
            <div>
              <label className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2 block">Status</label>
              <select
                value={columnId}
                onChange={(e) => {
                  setColumnId(e.target.value)
                  handleUpdate('columnId', e.target.value)
                }}
                className="w-full p-2.5 bg-background border border-border rounded-md text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none hover:bg-background/80 transition-colors"
                disabled={isUpdating}
              >
                {columns.map(col => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2 block">Issue Type</label>
              <div className="relative">
                <select
                  value={issueType}
                  onChange={(e) => {
                    setIssueType(e.target.value as IssueType)
                    handleUpdate('issueType', e.target.value)
                  }}
                  className="w-full p-2.5 pl-9 bg-background border border-border rounded-md text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none hover:bg-background/80 transition-colors appearance-none"
                  disabled={isUpdating}
                >
                  <option value="TASK">Task</option>
                  <option value="BUG">Bug</option>
                  <option value="STORY">Story</option>
                  <option value="EPIC">Epic</option>
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  {ISSUE_TYPE_ICONS[issueType]}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2 block">Priority</label>
              <div className="relative">
                <select
                  value={priority}
                  onChange={(e) => {
                    setPriority(e.target.value as Priority)
                    handleUpdate('priority', e.target.value)
                  }}
                  className="w-full p-2.5 pl-9 bg-background border border-border rounded-md text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none hover:bg-background/80 transition-colors appearance-none"
                  disabled={isUpdating}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  {PRIORITY_ICONS[priority]}
                </div>
              </div>
            </div>

            {/* Simulated Assignee for now */}
            <div>
              <label className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2 block">Assignee</label>
              <div className="flex items-center gap-3 p-2 bg-background border border-border rounded-md">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                  UN
                </div>
                <span className="text-sm font-medium text-foreground/70">Unassigned</span>
              </div>
            </div>
            
            <div className="mt-auto pt-6 border-t border-border/50 text-xs text-foreground/40 space-y-2">
              <p>Created: {new Date(task.createdAt).toLocaleString()}</p>
              <p>Updated: {new Date(task.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
