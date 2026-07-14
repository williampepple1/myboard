'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import { FontFamily } from '@tiptap/extension-font-family'
import { Bold, Italic, Strikethrough, Type } from 'lucide-react'
import { useEffect } from 'react'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
}

const FONTS = [
  { name: 'Handwritten (Default)', value: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", sans-serif' },
  { name: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { name: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { name: 'Courier New', value: '"Courier New", Courier, monospace' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
]

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-white rounded-t-md">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-panel transition-colors ${editor.isActive('bold') ? 'bg-panel text-primary' : 'text-foreground/70'}`}
        title="Bold"
      >
        <Bold size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-panel transition-colors ${editor.isActive('italic') ? 'bg-panel text-primary' : 'text-foreground/70'}`}
        title="Italic"
      >
        <Italic size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded hover:bg-panel transition-colors ${editor.isActive('strike') ? 'bg-panel text-primary' : 'text-foreground/70'}`}
        title="Strikethrough"
      >
        <Strikethrough size={16} />
      </button>

      <div className="w-px h-5 bg-border mx-1" />

      <div className="relative flex items-center">
        <Type size={14} className="text-foreground/50 absolute left-2" />
        <select
          onChange={(e) => {
            const font = e.target.value
            if (font) {
              editor.chain().focus().setFontFamily(font).run()
            } else {
              editor.chain().focus().unsetFontFamily().run()
            }
          }}
          className="pl-7 pr-2 py-1 text-sm bg-transparent border border-transparent hover:border-border rounded outline-none cursor-pointer text-foreground/80"
          title="Font Family"
          value={editor.getAttributes('textStyle').fontFamily || FONTS[0].value}
        >
          {FONTS.map(font => (
            <option key={font.name} value={font.value}>
              {font.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontFamily,
    ],
    content,
    editorProps: {
      attributes: {
        class: 'p-3 focus:outline-none min-h-[120px] max-h-[250px] overflow-y-auto prose prose-sm max-w-none',
        style: 'font-family: "Comic Sans MS", "Chalkboard SE", "Marker Felt", sans-serif;',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Ensure initial content is synced if it changes from outside
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  return (
    <div className="border border-border rounded-md shadow-sm mb-4 bg-white focus-within:border-primary transition-colors">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
