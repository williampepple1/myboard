'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { X, Calendar, Clock, Users, Link as LinkIcon, Loader2 } from 'lucide-react'
import { createMeeting } from '@/actions/meetings'
import { toast } from 'react-hot-toast'

interface CreateMeetingModalProps {
  onClose: () => void
}

export default function CreateMeetingModal({ onClose }: CreateMeetingModalProps) {
  const router = useRouter()
  const params = useParams()
  const orgId = params.orgId as string

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [meetingUrl, setMeetingUrl] = useState('')
  
  const [attendeeEmail, setAttendeeEmail] = useState('')
  const [attendees, setAttendees] = useState<string[]>([])
  
  const [isLoading, setIsLoading] = useState(false)

  const handleAddAttendee = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (attendeeEmail && attendees.length < 10) {
        if (!attendees.includes(attendeeEmail.toLowerCase())) {
          setAttendees([...attendees, attendeeEmail.toLowerCase()])
        }
        setAttendeeEmail('')
      } else if (attendees.length >= 10) {
        toast.error('Maximum 10 attendees allowed.')
      }
    }
  }

  const handleRemoveAttendee = (email: string) => {
    setAttendees(attendees.filter(a => a !== email))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !date || !time) return

    setIsLoading(true)
    try {
      // Combine date and time into a single Date object
      const scheduledAt = new Date(`${date}T${time}`)
      
      await createMeeting({
        title,
        description,
        scheduledAt,
        meetingUrl,
        organizationId: orgId,
        attendeeEmails: attendees,
      })

      toast.success('Meeting scheduled successfully!')
      router.refresh()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule meeting')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold text-[#172B4D]">Schedule Meeting</h2>
          <button
            onClick={onClose}
            className="text-[#6B778C] hover:text-[#42526E] transition-colors p-1 rounded-md hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-[#42526E] mb-1">
                Meeting Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-[#F4F5F7] border-2 border-transparent focus:bg-white focus:border-primary rounded-md text-sm outline-none transition-colors text-[#172B4D]"
                placeholder="E.g., Weekly Sync"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="date" className="block text-sm font-medium text-[#42526E] mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B778C]" />
                  <input
                    id="date"
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#F4F5F7] border-2 border-transparent focus:bg-white focus:border-primary rounded-md text-sm outline-none transition-colors text-[#172B4D]"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label htmlFor="time" className="block text-sm font-medium text-[#42526E] mb-1">
                  Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B778C]" />
                  <input
                    id="time"
                    type="time"
                    required
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#F4F5F7] border-2 border-transparent focus:bg-white focus:border-primary rounded-md text-sm outline-none transition-colors text-[#172B4D]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="url" className="block text-sm font-medium text-[#42526E] mb-1">
                Meeting URL (Optional)
              </label>
              <div className="relative">
                <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B778C]" />
                <input
                  id="url"
                  type="url"
                  value={meetingUrl}
                  onChange={e => setMeetingUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#F4F5F7] border-2 border-transparent focus:bg-white focus:border-primary rounded-md text-sm outline-none transition-colors text-[#172B4D]"
                  placeholder="https://meet.google.com/..."
                />
              </div>
            </div>

            <div>
              <label htmlFor="attendees" className="block text-sm font-medium text-[#42526E] mb-1">
                Attendees (Max 10)
              </label>
              <div className="relative">
                <Users size={16} className="absolute left-3 top-2.5 text-[#6B778C]" />
                <input
                  id="attendees"
                  type="email"
                  value={attendeeEmail}
                  onChange={e => setAttendeeEmail(e.target.value)}
                  onKeyDown={handleAddAttendee}
                  className="w-full pl-9 pr-3 py-2 bg-[#F4F5F7] border-2 border-transparent focus:bg-white focus:border-primary rounded-md text-sm outline-none transition-colors text-[#172B4D]"
                  placeholder="Type email and press Enter..."
                  disabled={attendees.length >= 10}
                />
              </div>
              {attendees.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {attendees.map(email => (
                    <div key={email} className="flex items-center gap-1 bg-[#E9F2FF] text-primary px-2.5 py-1 rounded-full text-xs font-medium">
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttendee(email)}
                        className="hover:text-red-500 transition-colors ml-1"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-[#42526E] mb-1">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-[#F4F5F7] border-2 border-transparent focus:bg-white focus:border-primary rounded-md text-sm outline-none transition-colors text-[#172B4D] resize-none"
                placeholder="Meeting agenda..."
              />
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#42526E] hover:bg-slate-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !title || !date || !time}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            Schedule
          </button>
        </div>
      </div>
    </div>
  )
}
