'use client'

import { Trash2, Pencil } from 'lucide-react'
import { useState } from 'react'
import RichTextEditor from './RichTextEditor'

export interface NoteAuthor {
  id: string
  name: string | null
  email: string | null
  organizationUsers?: { role: { name: string } }[]
}

export interface NoteType {
  id: string
  content: string
  color: string | null
  createdAt: Date
  author: NoteAuthor
}

interface PostcardNoteProps {
  note: NoteType
  onDelete?: (id: string) => void
  onEdit?: (id: string, newContent: string, newColor?: string) => void
  canDelete?: boolean
  canEdit?: boolean
}

const COLORS = ['#FDFBF7', '#FEE2E2', '#FEF3C7', '#D1FAE5', '#DBEAFE', '#F3E8FF']

export default function PostcardNote({ note, onDelete, onEdit, canDelete, canEdit }: PostcardNoteProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(note.content)
  const [editColor, setEditColor] = useState(note.color || COLORS[0])
  const [isSaving, setIsSaving] = useState(false)

  // A subtle rotation for that casual postcard feel
  // using the ID to generate a consistent rotation between -2 and 2 degrees
  const hash = note.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const rotation = isEditing ? 0 : (hash % 5) - 2

  // Default color if none provided
  const bgColor = isEditing ? editColor : (note.color || COLORS[0])

  const handleSave = async () => {
    if (!onEdit || !editContent.trim()) return
    setIsSaving(true)
    try {
      await onEdit(note.id, editContent, editColor)
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditContent(note.content)
    setEditColor(note.color || COLORS[0])
    setIsEditing(false)
  }

  return (
    <div
      className={`relative p-6 rounded shadow-md border border-gray-200 transition-all duration-300 group ${
        isEditing ? 'z-10 shadow-xl ring-2 ring-primary/20' : 'hover:shadow-lg hover:-translate-y-1'
      }`}
      style={{
        backgroundColor: bgColor,
        transform: `rotate(${rotation}deg)`,
        minHeight: '200px',
        maxWidth: isEditing ? '400px' : '300px',
        width: '100%',
        backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")', // subtle paper texture
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Decorative Stamp area */}
      {!isEditing && <div className="absolute top-4 right-4 w-10 h-12 border-2 border-dashed border-gray-300 opacity-50 pointer-events-none"></div>}
      
      {/* Decorative lines like a postcard */}
      {!isEditing && (
        <>
          <div className="absolute inset-y-4 right-14 w-px bg-gray-200 pointer-events-none"></div>
          <div className="absolute bottom-16 right-4 w-10 h-px bg-gray-200 pointer-events-none"></div>
          <div className="absolute bottom-12 right-4 w-10 h-px bg-gray-200 pointer-events-none"></div>
          <div className="absolute bottom-8 right-4 w-10 h-px bg-gray-200 pointer-events-none"></div>
        </>
      )}

      {/* Action buttons */}
      {!isEditing && (canDelete || canEdit) && (
        <div 
          className={`absolute -top-3 -right-3 flex items-center gap-1 transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {canEdit && onEdit && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 bg-white text-primary-hover hover:bg-primary/5 rounded-full shadow-md border border-gray-100 transition-colors"
              title="Edit note"
            >
              <Pencil size={14} />
            </button>
          )}
          {canDelete && onDelete && (
            <button
              onClick={() => onDelete(note.id)}
              className="p-1.5 bg-white text-red-500 hover:bg-red-50 rounded-full shadow-md border border-gray-100 transition-colors"
              title="Delete note"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}

      {isEditing ? (
        <div className="flex flex-col h-full bg-white/50 p-2 -m-2 rounded-lg backdrop-blur-sm">
          <div className="flex-1 mb-4">
            <RichTextEditor
              content={editContent}
              onChange={setEditContent}
            />
          </div>
          <div className="flex items-center justify-between mt-auto">
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setEditColor(c)}
                  className={`w-6 h-6 rounded-full border-2 ${editColor === c ? 'border-primary scale-110' : 'border-transparent hover:scale-110'} transition-all`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !editContent.trim() || editContent === '<p></p>'}
                className="px-3 py-1.5 text-xs font-semibold bg-primary-hover text-white hover:bg-[#0047B3] rounded-md transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="pr-14 pt-2">
          <div 
            className="text-gray-800 font-medium prose prose-sm max-w-none prose-p:my-1 prose-headings:my-1 break-all" 
            style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", sans-serif' }}
            dangerouslySetInnerHTML={{ __html: note.content }}
          />
        </div>
      )}

      {/* Author and Date */}
      {!isEditing && (
        <div className="absolute bottom-4 left-6 pr-14 text-xs text-gray-500 font-serif">
          <p>- {note.author.name || note.author.email || 'Anonymous'}</p>
          <p>{new Date(note.createdAt).toLocaleDateString()}</p>
        </div>
      )}
    </div>
  )
}
