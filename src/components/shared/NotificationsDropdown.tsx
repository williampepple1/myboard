'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Check, ExternalLink } from 'lucide-react'
import { getNotifications, markAsRead, markAllAsRead } from '@/actions/notifications'
import type { Notification } from '@prisma/client'
import Link from 'next/link'

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch on mount and set up an interval for polling
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await getNotifications()
        setNotifications(data)
      } catch (e) {
        console.error('Failed to fetch notifications', e)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000) // poll every 30s
    return () => clearInterval(interval)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch (e) {
      console.error('Failed to mark as read', e)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (e) {
      console.error('Failed to mark all as read', e)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
      >
        <Bell size={20} className="text-foreground/70 hover:text-foreground transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-border rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col max-h-112">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-slate-50 shrink-0">
            <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary hover:text-primary-hover font-medium transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {loading && notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-foreground/50">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-foreground/50">No notifications yet.</div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-3 rounded-md transition-colors flex items-start gap-3 relative group ${notif.read ? 'hover:bg-slate-50' : 'bg-primary/5 hover:bg-primary/10'}`}
                >
                  <div className="flex-1 min-w-0 pr-6">
                    <p className={`text-sm ${notif.read ? 'text-foreground/80' : 'text-foreground font-medium'}`}>
                      {notif.title}
                    </p>
                    {notif.message && (
                      <p className="text-xs text-foreground/60 mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                    )}
                    <span className="text-[10px] text-foreground/40 mt-1 block">
                      {new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-3">
                    {!notif.read && (
                      <button 
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="p-1.5 text-foreground/40 hover:text-primary hover:bg-white rounded-md transition-all shadow-sm"
                        title="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    {notif.link && (
                      <Link 
                        href={notif.link}
                        onClick={() => {
                          if (!notif.read) handleMarkAsRead(notif.id)
                          setIsOpen(false)
                        }}
                        className="p-1.5 text-foreground/40 hover:text-primary hover:bg-white rounded-md transition-all shadow-sm"
                        title="View details"
                      >
                        <ExternalLink size={14} />
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
