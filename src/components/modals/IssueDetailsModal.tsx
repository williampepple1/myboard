'use client'

import { useState, useEffect } from 'react'
import { X, AlignLeft, Trash2, Calendar, User, MessageSquare, Plus, CheckSquare, Square } from 'lucide-react'
import type { Task as PrismaTask, Label, Comment as PrismaComment } from '@prisma/client'
import { updateTaskDetails, deleteTask, type Priority, type IssueType } from '@/actions/board'
import { getTaskComments, addComment, deleteComment, getAllLabels, createLabel, setTaskLabels, setTaskAssignee, setTaskDueDate, getOrgMembersForAssignee, getSubtasks, createSubtask, toggleSubtask, deleteSubtask } from '@/actions/tasks'
import { ISSUE_TYPE_ICONS, PRIORITY_ICONS } from '@/lib/icons'

export type Task = PrismaTask & {
  priority: Priority
  issueType: IssueType
  createdAt: Date
  updatedAt: Date
  dueDate?: Date | null
  labels?: { label: Label }[]
  assigneeId?: string | null
}

type Column = { id: string; name: string }
type MemberItem = { user: { id: string; name: string | null; email: string | null } }

const LABEL_PRESETS = [
  { name: 'Bug', color: '#E34935' },
  { name: 'Feature', color: '#0C66E4' },
  { name: 'Improvement', color: '#22A06B' },
  { name: 'Question', color: '#F5CD47' },
  { name: 'Documentation', color: '#8C6BDF' },
  { name: 'Design', color: '#E76E99' },
]

export default function IssueDetailsModal({ isOpen, onClose, task, columns, onTaskUpdate, onTaskDelete, orgId }: {
  isOpen: boolean
  onClose: () => void
  task: Task | null
  columns: Column[]
  onTaskUpdate: (t: Task) => void
  onTaskDelete?: (id: string) => void
  orgId?: string
}) {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [priority, setPriority] = useState<Priority>(task?.priority || 'MEDIUM')
  const [issueType, setIssueType] = useState<IssueType>(task?.issueType || 'TASK')
  const [columnId, setColumnId] = useState(task?.columnId || '')
  const [isUpdating, setIsUpdating] = useState(false)

  const [comments, setComments] = useState<(PrismaComment & { author: { id: string; name: string | null; email: string | null } })[]>([])
  const [newComment, setNewComment] = useState('')
  const [allLabels, setAllLabels] = useState<Label[]>([])
  const [taskLabelIds, setTaskLabelIds] = useState<string[]>([])
  const [members, setMembers] = useState<MemberItem[]>([])
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId || '')
  const [dueDate, setDueDate] = useState(task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '')
  const [subtasks, setSubtasks] = useState<PrismaTask[]>([])
  const [newSubtask, setNewSubtask] = useState('')
  const [showNewLabel, setShowNewLabel] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState('#0C66E4')

  useEffect(() => {
    if (!task || !orgId) return
    getAllLabels().then(setAllLabels)
    getTaskComments(task.id).then(setComments)
    getOrgMembersForAssignee(orgId).then(setMembers)
    getSubtasks(task.id).then(setSubtasks)
  }, [task?.id, orgId])

  const handleUpdate = async (field: string, value: string) => {
    setIsUpdating(true)
    try {
      await updateTaskDetails(task!.id, { [field]: value })
      onTaskUpdate({ ...task!, [field]: value } as Task)
    } catch (e) { console.error(e) }
    finally { setIsUpdating(false) }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !orgId) return
    const comment = await addComment(task!.id, newComment.trim(), orgId)
    setComments(prev => [...prev, comment])
    setNewComment('')
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!orgId) return
    await deleteComment(commentId, orgId)
    setComments(prev => prev.filter(c => c.id !== commentId))
  }

  const handleToggleLabel = async (labelId: string) => {
    if (!orgId) return
    const ids = taskLabelIds.includes(labelId) ? taskLabelIds.filter(id => id !== labelId) : [...taskLabelIds, labelId]
    setTaskLabelIds(ids)
    await setTaskLabels(task!.id, ids, orgId)
  }

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return
    const label = await createLabel(newLabelName.trim(), newLabelColor)
    setAllLabels(prev => [...prev, label])
    setTaskLabelIds(prev => [...prev, label.id])
    await setTaskLabels(task!.id, [...taskLabelIds, label.id], orgId!)
    setNewLabelName('')
    setShowNewLabel(false)
  }

  const handleAssigneeChange = async (id: string) => {
    setAssigneeId(id)
    if (!orgId) return
    await setTaskAssignee(task!.id, id || null, orgId)
    onTaskUpdate({ ...task!, assigneeId: id || null } as Task)
  }

  const handleDueDateChange = async (date: string) => {
    setDueDate(date)
    if (!orgId) return
    const d = date ? new Date(date) : null
    await setTaskDueDate(task!.id, d, orgId)
    onTaskUpdate({ ...task!, dueDate: d } as Task)
  }

  if (!isOpen || !task) return null

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-full bg-white dark:bg-[#1D2125] border border-border rounded-md shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-panel">
          <div className="flex items-center gap-3 text-sm text-foreground/60 font-medium uppercase tracking-wide">
            {ISSUE_TYPE_ICONS[issueType]}
            <span>{task.id.slice(0, 8)}</span>
          </div>
          <div className="flex items-center gap-1">
            {onTaskDelete && (
              <button onClick={async () => {
                if (!confirm('Delete this task?')) return
                try { await deleteTask(task.id); onTaskDelete(task.id); onClose() }
                catch (e) { console.error(e) }
              }} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-foreground/50 hover:text-red-500 transition-colors" title="Delete task">
                <Trash2 size={18} />
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-background rounded-md text-foreground/50 hover:text-foreground transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
            <div>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                onBlur={() => { if (title !== task.title) handleUpdate('title', title) }}
                className="w-full text-2xl font-semibold text-foreground bg-transparent border-2 border-transparent hover:border-border hover:bg-background focus:bg-background focus:border-primary/50 focus:ring-0 rounded-lg px-3 py-2 -ml-3 transition-colors outline-none"
                placeholder="Task title..." />
            </div>

            {/* Labels */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Labels</span>
                <button onClick={() => setShowNewLabel(!showNewLabel)} className="p-0.5 text-foreground/40 hover:text-foreground"><Plus size={14} /></button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allLabels.map(label => (
                  <button key={label.id} onClick={() => handleToggleLabel(label.id)}
                    className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${taskLabelIds.includes(label.id) ? 'ring-2 ring-offset-1 dark:ring-offset-[#1D2125]' : 'opacity-50 hover:opacity-80'}`}
                    style={{ backgroundColor: label.color + '20', color: label.color, boxShadow: taskLabelIds.includes(label.id) ? `0 0 0 2px ${label.color}` : 'none' }}>
                    {label.name}
                  </button>
                ))}
              </div>
              {showNewLabel && (
                <div className="flex items-center gap-2 mt-2">
                  <input value={newLabelName} onChange={e => setNewLabelName(e.target.value)} placeholder="Label name" className="flex-1 px-2 py-1 text-sm bg-background border border-border rounded outline-none" />
                  <input type="color" value={newLabelColor} onChange={e => setNewLabelColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer" />
                  <button onClick={handleCreateLabel} className="px-2 py-1 text-xs font-medium bg-primary text-white rounded">Add</button>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center gap-2 mb-4 font-medium text-foreground/80">
                <AlignLeft size={18} />
                <h3>Description</h3>
              </div>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                onBlur={() => { if (description !== (task.description || '')) handleUpdate('description', description) }}
                placeholder="Add a more detailed description..."
                className="w-full min-h-[150px] p-4 bg-background border border-border rounded-lg outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm resize-y" />
            </div>

            {/* Subtasks */}
            <div>
              <div className="flex items-center gap-2 mb-4 font-medium text-foreground/80">
                <CheckSquare size={18} />
                <h3>Subtasks ({subtasks.filter(s => s.completed).length}/{subtasks.length})</h3>
              </div>
              <div className="space-y-1 mb-3">
                {subtasks.map(s => (
                  <div key={s.id} className="flex items-center gap-2 group">
                    <button onClick={async () => {
                      const updated = await toggleSubtask(s.id, !s.completed, orgId!)
                      setSubtasks(prev => prev.map(st => st.id === s.id ? { ...st, completed: updated.completed } : st))
                    }} className="shrink-0 text-foreground/40 hover:text-primary transition-colors">
                      {s.completed ? <CheckSquare size={16} className="text-green-500" /> : <Square size={16} />}
                    </button>
                    <span className={`text-sm flex-1 ${s.completed ? 'line-through text-foreground/40' : 'text-foreground/80'}`}>{s.title}</span>
                    <button onClick={async () => {
                      await deleteSubtask(s.id, orgId!)
                      setSubtasks(prev => prev.filter(st => st.id !== s.id))
                    }} className="opacity-0 group-hover:opacity-100 p-0.5 text-foreground/30 hover:text-red-500 transition-all">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={newSubtask} onChange={e => setNewSubtask(e.target.value)}
                  onKeyDown={async e => {
                    if (e.key === 'Enter' && newSubtask.trim()) {
                      e.preventDefault()
                      const s = await createSubtask(task.id, newSubtask.trim(), orgId!)
                      setSubtasks(prev => [...prev, s as PrismaTask])
                      setNewSubtask('')
                    }
                  }}
                  placeholder="Add a subtask..."
                  className="flex-1 px-3 py-1.5 text-sm bg-background border border-border rounded outline-none focus:border-primary/50" />
              </div>
            </div>

            {/* Comments */}
            <div>
              <div className="flex items-center gap-2 mb-4 font-medium text-foreground/80">
                <MessageSquare size={18} />
                <h3>Comments ({comments.length})</h3>
              </div>
              <div className="space-y-4 mb-4">
                {comments.map(c => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                      {(c.author.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{c.author.name || 'Unknown'}</span>
                        <span className="text-xs text-foreground/50">{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-foreground/80 mt-1">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={newComment} onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment() } }}
                  placeholder="Write a comment..." className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:border-primary/50" />
                <button onClick={handleAddComment} disabled={!newComment.trim()} className="px-3 py-2 bg-primary text-white text-sm font-medium rounded-lg disabled:opacity-50">Send</button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full md:w-72 bg-panel border-l border-border p-6 flex flex-col gap-5 overflow-y-auto shrink-0">
            <div>
              <label className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2 block">Status</label>
              <select value={columnId} onChange={e => { setColumnId(e.target.value); handleUpdate('columnId', e.target.value) }}
                className="w-full p-2.5 bg-background border border-border rounded-md text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none" disabled={isUpdating}>
                {columns.map(col => <option key={col.id} value={col.id}>{col.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2 block">Issue Type</label>
              <select value={issueType} onChange={e => { setIssueType(e.target.value as IssueType); handleUpdate('issueType', e.target.value) }}
                className="w-full p-2.5 pl-9 bg-background border border-border rounded-md text-sm font-medium appearance-none focus:ring-2 focus:ring-primary/20 outline-none" disabled={isUpdating}>
                <option value="TASK">Task</option>
                <option value="BUG">Bug</option>
                <option value="STORY">Story</option>
                <option value="EPIC">Epic</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2 block">Priority</label>
              <select value={priority} onChange={e => { setPriority(e.target.value as Priority); handleUpdate('priority', e.target.value) }}
                className="w-full p-2.5 pl-9 bg-background border border-border rounded-md text-sm font-medium appearance-none focus:ring-2 focus:ring-primary/20 outline-none" disabled={isUpdating}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2 flex items-center gap-1">
                <User size={12} /> Assignee
              </label>
              <select value={assigneeId} onChange={e => handleAssigneeChange(e.target.value)}
                className="w-full p-2.5 bg-background border border-border rounded-md text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none">
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.user.id} value={m.user.id}>{m.user.name || m.user.email || m.user.id}</option>
                ))}
              </select>
            </div>

            {/* Due date */}
            <div>
              <label className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Calendar size={12} /> Due date
              </label>
              <input type="date" value={dueDate} onChange={e => handleDueDateChange(e.target.value)}
                className={`w-full p-2.5 bg-background border rounded-md text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 ${isOverdue ? 'border-red-400 text-red-600' : 'border-border'}`} />
            </div>

            <div className="mt-auto pt-6 border-t border-border/50 text-xs text-foreground/40 space-y-2">
              <p>Created: {new Date(task.createdAt).toLocaleString()}</p>
              <p>Updated: {new Date(task.updatedAt).toLocaleString()}</p>
              {task.dueDate && <p className={isOverdue ? 'text-red-500 font-medium' : ''}>Due: {new Date(task.dueDate).toLocaleDateString()}{isOverdue ? ' (overdue)' : ''}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
