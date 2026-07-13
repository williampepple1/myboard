'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { getNotes, createNote, deleteNote } from '@/actions/notes'
import PostcardNote, { NoteType } from './PostcardNote'

interface NotesSectionProps {
  organizationId?: string
  projectId?: string
  canCreate?: boolean
  canDelete?: boolean
  currentUser?: { id: string }
}

const COLORS = ['#FDFBF7', '#FEE2E2', '#FEF3C7', '#D1FAE5', '#DBEAFE', '#F3E8FF']

export default function NotesSection({
  organizationId,
  projectId,
  canCreate = false,
  canDelete = false,
  currentUser,
}: NotesSectionProps) {
  const [notes, setNotes] = useState<NoteType[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [selectedColor, setSelectedColor] = useState(COLORS[0])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    const fetchNotes = async () => {
      try {
        const fetched = await getNotes({ organizationId, projectId })
        if (mounted) {
          setNotes(fetched as NoteType[])
        }
      } catch (err) {
        console.error('Failed to fetch notes', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchNotes()
    return () => { mounted = false }
  }, [organizationId, projectId])

  const handleCreate = async () => {
    if (!newContent.trim()) return
    setSaving(true)
    try {
      const note = await createNote({
        content: newContent,
        organizationId,
        projectId,
        color: selectedColor,
      })
      setNotes((prev) => [note as NoteType, ...prev])
      setNewContent('')
      setIsAdding(false)
    } catch (err) {
      console.error('Failed to create note', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setNotes((prev) => prev.filter(n => n.id !== id))
      await deleteNote(id)
    } catch (err) {
      console.error('Failed to delete note', err)
      // Refresh to restore if failed
      const fetched = await getNotes({ organizationId, projectId })
      setNotes(fetched as NoteType[])
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground/80">Notes</h2>
        {canCreate && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors"
          >
            <Plus size={16} />
            Add Note
          </button>
        )}
      </div>

      {isAdding && (
        <div className="mb-8 p-4 bg-white border border-border/50 rounded-md shadow-sm max-w-md">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Write your note here..."
            className="w-full p-3 border border-border rounded-md text-sm mb-4 outline-none focus:border-primary resize-none h-32"
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className={`w-6 h-6 rounded-full border-2 ${selectedColor === c ? 'border-primary scale-110' : 'border-transparent hover:scale-110'} transition-all`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-sm text-foreground/70 hover:bg-panel rounded-md transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !newContent.trim()}
                className="px-3 py-1.5 text-sm bg-primary text-white hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-500">Loading notes...</div>
      ) : notes.length === 0 && !isAdding ? (
        <div className="text-sm text-gray-500 italic">No notes attached yet.</div>
      ) : (
        <div className="flex flex-wrap gap-8 py-4">
          {notes.map(note => {
            const hasDeletePermission = canDelete || note.author.id === currentUser?.id
            return (
              <PostcardNote
                key={note.id}
                note={note}
                onDelete={handleDelete}
                canDelete={hasDeletePermission}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
