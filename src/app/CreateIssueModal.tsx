'use client'

import { useState } from 'react'
import { X, CheckSquare, Bug, Bookmark, ArrowUp, ChevronUp, ChevronDown, Check } from 'lucide-react'
import type { Priority, IssueType } from '@/actions/board'

interface Column {
  id: string
  name: string
}

interface CreateIssueModalProps {
  isOpen: boolean
  onClose: () => void
  columns: Column[]
  defaultColumnId?: string
  onSubmit: (data: { title: string, description: string, issueType: IssueType, priority: Priority, columnId: string }) => Promise<void>
}

const ISSUE_TYPE_ICONS = {
  TASK: <CheckSquare size={16} className="text-blue-500" />,
  BUG: <Bug size={16} className="text-red-500" />,
  STORY: <Bookmark size={16} className="text-green-500" />,
  EPIC: <CheckSquare size={16} className="text-purple-500" />
}

const PRIORITY_ICONS = {
  URGENT: <ArrowUp size={16} className="text-red-600" />,
  HIGH: <ChevronUp size={16} className="text-red-400" />,
  MEDIUM: <Check size={16} className="text-orange-400" />,
  LOW: <ChevronDown size={16} className="text-blue-400" />
}

export default function CreateIssueModal({ isOpen, onClose, columns, defaultColumnId, onSubmit }: CreateIssueModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [issueType, setIssueType] = useState<IssueType>('TASK')
  const [priority, setPriority] = useState<Priority>('MEDIUM')
  const [columnId, setColumnId] = useState(defaultColumnId || (columns.length > 0 ? columns[0].id : ''))
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !columnId) return

    setIsSubmitting(true)
    try {
      await onSubmit({ title: title.trim(), description: description.trim(), issueType, priority, columnId })
      setTitle('')
      setDescription('')
      setIssueType('TASK')
      setPriority('MEDIUM')
      onClose()
    } catch (error) {
      console.error("Failed to create issue:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-panel">
          <h2 className="text-lg font-semibold text-foreground">Create Issue</h2>
          <button onClick={onClose} className="p-2 hover:bg-background rounded-md text-foreground/50 hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col p-6 gap-6">
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground/80 mb-1 block">Issue Type</label>
              <div className="relative">
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value as IssueType)}
                  className="w-full p-2.5 pl-9 bg-background border border-border rounded-md text-sm focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                  required
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

            <div className="flex-1">
              <label className="text-sm font-medium text-foreground/80 mb-1 block">Status</label>
              <select
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
                className="w-full p-2.5 bg-background border border-border rounded-md text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                required
              >
                {columns.map(col => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground/80 mb-1 block">Summary</label>
            <input
              type="text"
              autoFocus
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              placeholder="What needs to be done?"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground/80 mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[120px] px-3 py-2 bg-background border border-border rounded-md outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm resize-y"
              placeholder="Add more details..."
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground/80 mb-1 block">Priority</label>
            <div className="relative w-1/2">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full p-2.5 pl-9 bg-background border border-border rounded-md text-sm focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                required
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

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-background rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              ) : null}
              Create
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
