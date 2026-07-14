'use client'

import { useState } from 'react'
import { LogOut, Settings } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import SettingsModal from '@/components/modals/SettingsModal'

export default function UserMenu({ name, email }: { name?: string | null, email?: string | null }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const displayName = name || email?.split('@')[0] || 'User'

  const handleSignOut = async () => {
    try {
      await authClient.signOut()
      window.location.href = '/login'
    } catch (e) {
      console.error('Failed to sign out', e)
    }
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:bg-black/5 px-2 py-1.5 rounded-lg transition-colors focus:outline-none"
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-medium text-foreground/80 pr-1 hidden sm:block">{displayName}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-white border border-border rounded-md shadow-lg z-50 p-1 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-3 py-2 border-b border-border/50 mb-1">
              <p className="text-sm font-medium text-foreground truncate">{name || 'User'}</p>
              <p className="text-xs text-foreground/50 truncate">{email}</p>
            </div>
            <button onClick={() => { setIsSettingsOpen(true); setIsOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2 mb-1">
              <Settings size={16} className="text-foreground/60" />
              Settings
            </button>
            <button onClick={handleSignOut}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2">
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </>
      )}

      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  )
}
