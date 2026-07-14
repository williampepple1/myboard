'use client'

import { useEffect, useRef, useMemo, useState } from 'react'
import {
  Briefcase, Search, SlidersHorizontal, Share2, Maximize2,
  Minimize2, MoreHorizontal, Star, Check, Link2,
  LayoutGrid, Flag, Tag, Printer, Download
} from 'lucide-react'
import Board, { type ProjectWithColumns, type ColumnWithTasks } from '@/components/board/Board'
import { getProjectData } from '@/actions/board'
import { toggleStar, getUserStarsAndRecents, recordRecentView } from '@/actions/stars'
import { useBoardStore } from '@/store/boardStore'
import { useKeyboardShortcuts } from '@/lib/shortcuts'
import { BoardSkeleton } from '@/components/shared/Skeleton'
import {
  SummaryView, ListView, TimelineView, CodeView, FormsView, DocsView,
  type Tab
} from './ProjectTabViews'
import NotesSection from '@/components/board/NotesSection'

// Add 'Notes' to the Tab type locally if it's not in ProjectTabViews yet
type ExtendedTab = Tab | 'Notes'

// ─── tiny Tooltip ──────────────────────────────────────────────────────
function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false)
  return (
    <div
      className="relative"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#172B4D] text-white text-xs rounded whitespace-nowrap pointer-events-none z-50 animate-in fade-in duration-100">
          {label}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#172B4D]" />
        </div>
      )}
    </div>
  )
}

// ─── Group dropdown ─────────────────────────────────────────────────────
type GroupBy = 'none' | 'priority' | 'type'

const GROUP_OPTIONS: { value: GroupBy; label: string; icon: React.ReactNode }[] = [
  { value: 'none',     label: 'No grouping',     icon: <LayoutGrid size={14} /> },
  { value: 'priority', label: 'Priority',         icon: <Flag size={14} /> },
  { value: 'type',     label: 'Issue type',       icon: <Tag size={14} /> },
]

function GroupDropdown({ current, onChange }: { current: GroupBy; onChange: (v: GroupBy) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          open || current !== 'none'
            ? 'bg-primary text-white'
            : 'text-[#42526E] bg-[#F4F5F7] hover:bg-[#EBECF0]'
        }`}
      >
        <LayoutGrid size={14} />
        Group{current !== 'none' && `: ${GROUP_OPTIONS.find(o => o.value === current)?.label}`}
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1.5 w-52 bg-white border border-border shadow-xl rounded-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <p className="px-3 py-1 text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">Group by</p>
          {GROUP_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#172B4D] hover:bg-[#F4F5F7] transition-colors"
            >
              <span className="text-[#6B778C]">{opt.icon}</span>
              <span className="flex-1 text-left">{opt.label}</span>
              {current === opt.value && <Check size={14} className="text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Share button ────────────────────────────────────────────────────────
function ShareButton() {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select the URL from a temp input
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Tooltip label={copied ? 'Link copied!' : 'Copy link'}>
      <button
        onClick={handleShare}
        className={`p-1.5 rounded-md transition-all ${
          copied
            ? 'bg-green-100 text-green-600'
            : 'text-[#42526E] bg-[#F4F5F7] hover:bg-[#EBECF0]'
        }`}
      >
        {copied ? <Check size={16} /> : <Share2 size={16} />}
      </button>
    </Tooltip>
  )
}

// ─── More menu ───────────────────────────────────────────────────────────
function MoreMenu({ projectName, columns: allColumns }: { projectName: string; columns: ColumnWithTasks[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const exportCsv = () => {
    const rows = [['ID', 'Title', 'Status', 'Priority', 'Type', 'Created'].join(',')]
    for (const col of allColumns) {
      for (const task of col.tasks) {
        rows.push([task.id, `"${task.title.replace(/"/g, '""')}"`, col.name, task.priority, task.issueType, new Date(task.createdAt).toLocaleDateString()].join(','))
      }
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${projectName.replace(/\s+/g, '-')}.csv`
    a.click(); URL.revokeObjectURL(url)
    setOpen(false)
  }

  const actions = [
    {
      icon: <Link2 size={15} />,
      label: 'Copy link',
      action: () => { navigator.clipboard.writeText(window.location.href); setOpen(false) }
    },
    {
      icon: <Printer size={15} />,
      label: 'Print board',
      action: () => { window.print(); setOpen(false) }
    },
    {
      icon: <Download size={15} />,
      label: 'Export as CSV',
      action: exportCsv
    },
  ]

  return (
    <div ref={ref} className="relative">
      <Tooltip label="More actions">
        <button
          onClick={() => setOpen(v => !v)}
          className={`p-1.5 rounded-md transition-colors ${open ? 'bg-[#EBECF0] text-[#172B4D]' : 'text-[#42526E] bg-[#F4F5F7] hover:bg-[#EBECF0]'}`}
        >
          <MoreHorizontal size={16} />
        </button>
      </Tooltip>
      {open && (
        <div className="absolute top-full right-0 mt-1.5 w-52 bg-white border border-border shadow-xl rounded-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {actions.map((a, i) => (
            <button
              key={i}
              onClick={a.action}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#172B4D] hover:bg-[#F4F5F7] transition-colors"
            >
              <span className="text-[#6B778C]">{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────
export default function ProjectClient({ projectId, canCreateNote = false, canDeleteNote = false, canEditNote = false, currentUser }: { projectId: string, canCreateNote?: boolean, canDeleteNote?: boolean, canEditNote?: boolean, currentUser?: { id: string, role?: string } }) {
  const { projectData, setProjectData, stars, setStars, setRecents, boardGroupBy, setBoardGroupBy } = useBoardStore()
  const [loading, setLoading] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [activeTab, setActiveTab] = useState<ExtendedTab>('Board')

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      try {
        await recordRecentView(projectId, 'PROJECT')
        const { recents } = await getUserStarsAndRecents()
        if (isMounted) setRecents(recents)

        const data = await getProjectData(projectId)
        if (isMounted) setProjectData(data as ProjectWithColumns)
      } catch (e) {
        console.error('Failed to load project', e)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    init()
    return () => { isMounted = false }
  }, [projectId, setProjectData, setRecents])

  // Fullscreen via browser API
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.()
      setFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setFullscreen(false)
    }
  }

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  useKeyboardShortcuts(useMemo(() => [
    { key: 'c', handler: () => { document.querySelector<HTMLButtonElement>('[data-testid="create-task-btn"]')?.click() }, enabled: activeTab === 'Board' },
  ], [activeTab]))

  if (loading) {
    return <BoardSkeleton />
  }

  if (!projectData || projectData.id !== projectId) {
    return <div className="p-8 text-[#6B778C]">Project not found</div>
  }

  const isStarred = stars.some(s => s.entityType === 'PROJECT' && s.entityId === projectData.id)

  return (
    <div className="flex-1 bg-white overflow-hidden flex flex-col relative">
      {/* Project Header */}
      <div className="px-4 sm:px-8 pt-4 sm:pt-6 pb-2 bg-white border-b border-border shrink-0 z-0">
        <div className="text-sm text-[#6B778C] mb-2 flex items-center gap-1">
          <Briefcase size={14} />
          <span>Projects</span>
          <span>/</span>
          <span>{projectData.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-[#172B4D]">{projectData.name}</h1>
            <Tooltip label={isStarred ? 'Unstar project' : 'Star project'}>
              <button
                onClick={async () => {
                  try {
                    await toggleStar(projectData.id, 'PROJECT')
                    const { stars } = await getUserStarsAndRecents()
                    setStars(stars)
                  } catch (e) {
                    console.error('Failed to toggle star', e)
                  }
                }}
                className={`p-1.5 rounded-md transition-colors ${isStarred ? 'bg-yellow-100 text-yellow-500' : 'text-[#6B778C] hover:bg-[#F4F5F7]'}`}
              >
                <Star size={18} className={isStarred ? 'fill-yellow-500' : ''} />
              </button>
            </Tooltip>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 text-sm font-medium text-[#42526E] mt-4 overflow-x-auto scrollbar-none -mx-1 px-1">
          {(['Summary', 'List', 'Board', 'Code', 'Forms', 'Timeline', 'Docs', 'Notes'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 border-b-2 transition-colors shrink-0 ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent hover:text-[#172b4d]'
              }`}
            >
              {tab}
            </button>
          ))}
          <a
            href={`/${projectData.organizationId}/projects/${projectData.id}/expenses`}
            className="pb-2 border-b-2 border-transparent hover:text-[#172b4d] transition-colors shrink-0 flex items-center gap-1"
          >
            Finances
          </a>
        </div>
      </div>

      {/* Toolbar — only visible on Board tab */}
      {activeTab === 'Board' && (
        <div className="px-4 sm:px-8 py-3 flex flex-wrap items-center gap-3 justify-between shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B778C]" />
              <input
                type="text"
                placeholder="Search board"
                className="w-36 sm:w-48 pl-9 pr-3 py-1.5 bg-white border border-[#DFE1E6] hover:bg-[#F4F5F7] focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary rounded-md text-sm outline-none transition-all"
              />
            </div>
            <div className="hidden sm:flex items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white z-10 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" />
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-white -ml-3 z-20 flex items-center justify-center text-xs text-white">M</div>
              <div className="w-8 h-8 rounded-full bg-orange-400 border-2 border-white -ml-3 z-30 flex items-center justify-center text-xs text-white font-medium">ME</div>
            </div>
            <Tooltip label="Filter board">
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#42526E] bg-[#F4F5F7] hover:bg-[#EBECF0] rounded-md transition-colors">
                <SlidersHorizontal size={14} /> Filter
              </button>
            </Tooltip>
          </div>

          <div className="flex items-center gap-2">
            <GroupDropdown current={boardGroupBy} onChange={setBoardGroupBy} />
            <ShareButton />
            <Tooltip label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
              <button
                onClick={toggleFullscreen}
                className="hidden sm:flex p-1.5 text-[#42526E] bg-[#F4F5F7] hover:bg-[#EBECF0] rounded-md transition-colors"
              >
                {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </Tooltip>
            <MoreMenu projectName={projectData.name} columns={projectData.columns} />
          </div>
        </div>
      )}

      {/* Tab content */}
      {activeTab === 'Board' && (
        <div className="flex-1 overflow-hidden relative">
          <Board groupBy={boardGroupBy} />
        </div>
      )}
      {activeTab === 'Summary' && (
        <SummaryView columns={projectData.columns} projectName={projectData.name} onTaskClick={() => {}} />
      )}
      {activeTab === 'List' && (
        <ListView
          columns={projectData.columns}
          projectName={projectData.name}
          onTaskClick={() => {
            // Open issue details — reuse Board's modal by storing the task in a ref
            // For now, we just open it via the Board component's own state
            // This is handled by delegating back to the Board tab
            setActiveTab('Board')
          }}
        />
      )}
      {activeTab === 'Timeline' && (
        <TimelineView columns={projectData.columns} projectName={projectData.name} onTaskClick={() => {}} />
      )}
      {activeTab === 'Code' && (
        <CodeView columns={projectData.columns} projectName={projectData.name} onTaskClick={() => {}} />
      )}
      {activeTab === 'Forms' && (
        <FormsView />
      )}
      {activeTab === 'Docs' && (
        <DocsView columns={projectData.columns} projectName={projectData.name} onTaskClick={() => {}} />
      )}
      {activeTab === 'Notes' && (
        <div className="p-8 overflow-y-auto flex-1">
          <NotesSection
            projectId={projectData.id}
            canCreate={canCreateNote}
            canDelete={canDeleteNote}
            canEdit={canEditNote}
            currentUser={currentUser}
          />
        </div>
      )}
    </div>
  )
}
