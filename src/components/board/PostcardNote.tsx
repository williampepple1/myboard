'use client'

import { Trash2 } from 'lucide-react'
import { useState } from 'react'

export interface NoteAuthor {
  id: string
  name: string | null
  email: string | null
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
  canDelete?: boolean
}

export default function PostcardNote({ note, onDelete, canDelete }: PostcardNoteProps) {
  const [isHovered, setIsHovered] = useState(false)

  // A subtle rotation for that casual postcard feel
  // using the ID to generate a consistent rotation between -2 and 2 degrees
  const hash = note.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const rotation = (hash % 5) - 2

  // Default color if none provided
  const bgColor = note.color || '#FDFBF7' // slightly off-white warm color

  return (
    <div
      className="relative p-6 rounded shadow-md border border-gray-200 transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 group"
      style={{
        backgroundColor: bgColor,
        transform: `rotate(${rotation}deg)`,
        minHeight: '200px',
        maxWidth: '300px',
        width: '100%',
        backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")', // subtle paper texture
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Decorative Stamp area */}
      <div className="absolute top-4 right-4 w-10 h-12 border-2 border-dashed border-gray-300 opacity-50"></div>
      
      {/* Decorative lines like a postcard */}
      <div className="absolute inset-y-4 right-14 w-px bg-gray-200"></div>
      <div className="absolute bottom-16 right-4 w-10 h-px bg-gray-200"></div>
      <div className="absolute bottom-12 right-4 w-10 h-px bg-gray-200"></div>
      <div className="absolute bottom-8 right-4 w-10 h-px bg-gray-200"></div>

      {/* Delete button */}
      {canDelete && onDelete && (
        <button
          onClick={() => onDelete(note.id)}
          className={`absolute -top-2 -right-2 p-1.5 bg-white text-red-500 rounded-full shadow-md border border-gray-100 transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
          title="Delete note"
        >
          <Trash2 size={14} />
        </button>
      )}

      {/* Note Content */}
      <div className="pr-14 pt-2">
        <p className="text-gray-800 whitespace-pre-wrap font-medium" style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", sans-serif' }}>
          {note.content}
        </p>
      </div>

      {/* Author and Date */}
      <div className="absolute bottom-4 left-6 pr-14 text-xs text-gray-500 font-serif">
        <p>- {note.author.name || note.author.email || 'Anonymous'}</p>
        <p>{new Date(note.createdAt).toLocaleDateString()}</p>
      </div>
    </div>
  )
}
