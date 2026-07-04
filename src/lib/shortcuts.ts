'use client'

import { useEffect } from 'react'

type Shortcut = { key: string; ctrl?: boolean; meta?: boolean; handler: () => void; enabled?: boolean }

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      for (const s of shortcuts) {
        if (s.enabled === false) continue
        const mod = s.ctrl || s.meta
        if (mod && !e.ctrlKey && !e.metaKey) continue
        if (!mod && (e.ctrlKey || e.metaKey)) continue
        if (e.key.toLowerCase() === s.key.toLowerCase()) {
          e.preventDefault()
          s.handler()
          return
        }
      }
    }
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [shortcuts])
}
