'use client'

import { type Task } from '@/components/modals/IssueDetailsModal'
import { type ColumnWithTasks } from '@/components/board/Board'
import { ISSUE_TYPE_ICONS, PRIORITY_ICONS } from '@/lib/icons'
import { CheckSquare, Bug, BarChart3, Clock, AlertCircle, GitMerge, GitBranch, GitCommit, FileText, Calendar, Zap } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'Summary' | 'List' | 'Board' | 'Code' | 'Forms' | 'Timeline' | 'Docs'

interface TabViewProps {
  columns: ColumnWithTasks[]
  projectName: string
  onTaskClick: (task: Task) => void
}

// ─── Summary ──────────────────────────────────────────────────────────────────
export function SummaryView({ columns }: TabViewProps) {
  const allTasks = columns.flatMap(c => c.tasks)

  const byStatus = columns.map(col => ({
    name: col.name,
    count: col.tasks.length,
    percent: allTasks.length ? Math.round((col.tasks.length / allTasks.length) * 100) : 0
  }))

  const byPriority = (['URGENT', 'HIGH', 'MEDIUM', 'LOW'] as const).map(p => ({
    label: p.charAt(0) + p.slice(1).toLowerCase(),
    count: allTasks.filter(t => t.priority === p).length,
    icon: PRIORITY_ICONS[p]
  }))

  const byType = (['BUG', 'STORY', 'EPIC', 'TASK'] as const).map(ty => ({
    label: ty.charAt(0) + ty.slice(1).toLowerCase(),
    count: allTasks.filter(t => t.issueType === ty).length,
    icon: ISSUE_TYPE_ICONS[ty]
  })).filter(t => t.count > 0)

  const doneCol = columns.find(c => c.name.toLowerCase() === 'done')
  const doneCount = doneCol?.tasks.length ?? 0
  const progressPct = allTasks.length ? Math.round((doneCount / allTasks.length) * 100) : 0

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#F8F9FA]">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Hero stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total issues', value: allTasks.length, icon: <CheckSquare size={20} className="text-primary" /> },
            { label: 'In progress', value: columns.find(c => c.name.toLowerCase().includes('progress'))?.tasks.length ?? 0, icon: <Clock size={20} className="text-orange-500" /> },
            { label: 'Bugs', value: allTasks.filter(t => t.issueType === 'BUG').length, icon: <Bug size={20} className="text-red-500" /> },
            { label: 'Done', value: doneCount, icon: <BarChart3 size={20} className="text-green-500" /> },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-border p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#F4F5F7] flex items-center justify-center shrink-0">
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-[#172B4D]">{stat.value}</p>
                <p className="text-xs text-[#6B778C] mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[#172B4D]">Overall Progress</h3>
            <span className="text-sm font-bold text-primary">{progressPct}%</span>
          </div>
          <div className="h-2.5 bg-[#DFE1E6] rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-xs text-[#6B778C] mt-2">{doneCount} of {allTasks.length} issues completed</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status breakdown */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="font-semibold text-[#172B4D] mb-4">By Status</h3>
            <div className="space-y-3">
              {byStatus.map(s => (
                <div key={s.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-[#42526E] font-medium">{s.name}</span>
                    <span className="text-[#6B778C]">{s.count} ({s.percent}%)</span>
                  </div>
                  <div className="h-2 bg-[#F4F5F7] rounded-full overflow-hidden">
                    <div className="h-full bg-primary/70 rounded-full" style={{ width: `${s.percent}%` }} />
                  </div>
                </div>
              ))}
              {allTasks.length === 0 && <p className="text-sm text-[#6B778C] italic">No issues yet</p>}
            </div>
          </div>

          {/* Priority + Type */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-border p-6">
              <h3 className="font-semibold text-[#172B4D] mb-3">By Priority</h3>
              <div className="flex flex-wrap gap-2">
                {byPriority.map(p => (
                  <div key={p.label} className="flex items-center gap-2 px-3 py-1.5 bg-[#F4F5F7] rounded-lg text-sm">
                    {p.icon}
                    <span className="font-medium text-[#42526E]">{p.label}</span>
                    <span className="text-[#6B778C] font-bold">{p.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-border p-6">
              <h3 className="font-semibold text-[#172B4D] mb-3">By Type</h3>
              <div className="flex flex-wrap gap-2">
                {byType.length === 0 ? <p className="text-sm text-[#6B778C] italic">No issues yet</p> : byType.map(t => (
                  <div key={t.label} className="flex items-center gap-2 px-3 py-1.5 bg-[#F4F5F7] rounded-lg text-sm">
                    {t.icon}
                    <span className="font-medium text-[#42526E]">{t.label}</span>
                    <span className="text-[#6B778C] font-bold">{t.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── List ──────────────────────────────────────────────────────────────────────
export function ListView({ columns, onTaskClick }: TabViewProps) {
  const allTasks = columns.flatMap(c => c.tasks.map(t => ({
    ...t,
    statusName: columns.find(col => col.id === t.columnId)?.name ?? '—'
  })))

  if (allTasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#6B778C] flex-col gap-3 p-8">
        <CheckSquare size={48} className="text-[#DFE1E6]" />
        <p className="font-medium">No issues yet. Create one from the Board tab.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-white border-b border-border z-10">
          <tr className="text-[#6B778C] text-xs font-bold uppercase tracking-wider">
            <th className="text-left px-6 py-3 w-8">#</th>
            <th className="text-left px-4 py-3">Title</th>
            <th className="text-left px-4 py-3 w-28">Status</th>
            <th className="text-left px-4 py-3 w-28">Priority</th>
            <th className="text-left px-4 py-3 w-24">Type</th>
            <th className="text-left px-4 py-3 w-36">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {allTasks.map((task, i) => (
            <tr
              key={task.id}
              onClick={() => onTaskClick(task)}
              className="hover:bg-[#F4F5F7] cursor-pointer group transition-colors"
            >
              <td className="px-6 py-3 text-[#6B778C] text-xs">{i + 1}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {ISSUE_TYPE_ICONS[task.issueType]}
                  <span className="font-medium text-[#172B4D] group-hover:text-primary transition-colors">{task.title}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#F4F5F7] text-[#42526E]">{task.statusName}</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  {PRIORITY_ICONS[task.priority]}
                  <span className="text-[#42526E]">{task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-[#6B778C]">{task.issueType.charAt(0) + task.issueType.slice(1).toLowerCase()}</td>
              <td className="px-4 py-3 text-[#6B778C] text-xs">{new Date(task.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Timeline ─────────────────────────────────────────────────────────────────
export function TimelineView({ columns }: TabViewProps) {
  const allTasks = columns.flatMap(c => c.tasks)

  // Group by created week
  const now = new Date()
  const weeks = Array.from({ length: 4 }, (_, i) => {
    const start = new Date(now)
    start.setDate(start.getDate() - (3 - i) * 7)
    return {
      label: `Week of ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      tasks: allTasks.filter(t => {
        const d = new Date(t.createdAt)
        const end = new Date(start)
        end.setDate(end.getDate() + 7)
        return d >= start && d < end
      })
    }
  })

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#F8F9FA]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-6 text-[#6B778C] text-sm">
          <Calendar size={16} />
          <span>Issues grouped by creation week</span>
        </div>

        {weeks.every(w => w.tasks.length === 0) ? (
          <div className="flex items-center justify-center h-48 text-[#6B778C] flex-col gap-3 bg-white rounded-xl border border-border">
            <Calendar size={40} className="text-[#DFE1E6]" />
            <p className="font-medium">No issues to display on the timeline</p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-[#DFE1E6]" />

            <div className="space-y-8 pl-12">
              {weeks.map((week, wi) => (
                <div key={wi}>
                  <div className="relative mb-3">
                    <div className="absolute left-[-2.15rem] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-primary bg-white" />
                    <h3 className="text-xs font-bold text-[#6B778C] uppercase tracking-wider">{week.label}</h3>
                  </div>
                  {week.tasks.length === 0 ? (
                    <p className="text-sm text-[#A5ADBA] italic">No issues this week</p>
                  ) : (
                    <div className="space-y-2">
                      {week.tasks.map(task => (
                        <div key={task.id} className="bg-white border border-border rounded-lg px-4 py-3 flex items-center gap-3">
                          {ISSUE_TYPE_ICONS[task.issueType]}
                          <span className="flex-1 text-sm font-medium text-[#172B4D]">{task.title}</span>
                          {PRIORITY_ICONS[task.priority]}
                          <span className="text-xs text-[#6B778C] bg-[#F4F5F7] px-2 py-0.5 rounded">
                            {columns.find(c => c.id === task.columnId)?.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Code ─────────────────────────────────────────────────────────────────────
export function CodeView({ projectName }: TabViewProps) {
  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#F8F9FA]">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <GitMerge size={24} className="text-[#172B4D]" />
            <div>
              <h3 className="font-semibold text-[#172B4D]">Connect a repository</h3>
              <p className="text-sm text-[#6B778C]">Link this project to a GitHub or GitLab repository.</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-primary hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            Connect GitHub
          </button>
        </div>

        <div className="bg-white rounded-xl border border-border divide-y divide-border">
          {[
            { icon: <GitBranch size={16} className="text-purple-500" />, title: 'main', sub: 'Default branch · 0 commits ahead', meta: 'Updated just now' },
            { icon: <GitCommit size={16} className="text-[#6B778C]" />, title: `feature/${projectName.toLowerCase().replace(/\s+/g, '-')}-setup`, sub: 'Created from main', meta: '2 days ago' },
          ].map((row, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              {row.icon}
              <div className="flex-1">
                <p className="text-sm font-medium text-[#172B4D]">{row.title}</p>
                <p className="text-xs text-[#6B778C]">{row.sub}</p>
              </div>
              <span className="text-xs text-[#6B778C]">{row.meta}</span>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p>Repository integration is not yet connected. Branches and commits shown above are illustrative.</p>
        </div>
      </div>
    </div>
  )
}

// ─── Forms ────────────────────────────────────────────────────────────────────
export function FormsView() {
  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#F8F9FA]">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-5">
            <Zap size={22} className="text-primary" />
            <div>
              <h3 className="font-semibold text-[#172B4D]">Intake Form</h3>
              <p className="text-sm text-[#6B778C]">Share this form to collect issue submissions from your team.</p>
            </div>
          </div>

          <div className="space-y-4">
            {['Title', 'Description', 'Priority', 'Assignee'].map(field => (
              <div key={field} className="flex items-center gap-3 p-3 bg-[#F8F9FA] rounded-lg border border-border">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-sm font-medium text-[#172B4D] flex-1">{field}</span>
                <span className="text-xs text-[#6B778C] bg-white border border-border px-2 py-0.5 rounded">Required</span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button className="px-4 py-2 bg-primary hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
              Copy form link
            </button>
            <button className="px-4 py-2 border border-border hover:bg-[#F4F5F7] text-[#172B4D] text-sm font-medium rounded-lg transition-colors">
              Customize fields
            </button>
          </div>
        </div>

        <div className="flex items-start gap-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p>Form submissions are not yet wired to the database. This is a preview of the Forms feature.</p>
        </div>
      </div>
    </div>
  )
}

// ─── Docs ─────────────────────────────────────────────────────────────────────
export function DocsView({ projectName }: TabViewProps) {
  const docs = [
    { title: 'Project Overview', desc: 'Goals, scope, and success criteria.', updated: 'Today' },
    { title: 'Technical Spec', desc: 'Architecture decisions and tech stack.', updated: '2 days ago' },
    { title: 'Meeting Notes', desc: 'Standup and planning meeting records.', updated: '5 days ago' },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#F8F9FA]">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-[#172B4D]">Project documents</h3>
          <button className="px-3 py-1.5 bg-primary hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            + New page
          </button>
        </div>
        {docs.map((doc, i) => (
          <div key={i} className="bg-white rounded-xl border border-border p-5 flex items-center gap-4 cursor-pointer hover:border-primary/30 transition-colors group">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileText size={20} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-[#172B4D] group-hover:text-primary transition-colors">{projectName} — {doc.title}</p>
              <p className="text-sm text-[#6B778C] mt-0.5">{doc.desc}</p>
            </div>
            <span className="text-xs text-[#6B778C] shrink-0">Updated {doc.updated}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Export type ──────────────────────────────────────────────────────────────
export type { Tab }
