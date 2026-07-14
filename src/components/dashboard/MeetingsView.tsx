'use client'

import { useState } from 'react'
import { Plus, Calendar, Clock, Link as LinkIcon, Users, CheckCircle, XCircle, HelpCircle } from 'lucide-react'
import CreateMeetingModal from '@/components/modals/CreateMeetingModal'
import { updateAttendeeStatus } from '@/actions/meetings'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

type Meeting = any // In a real app we'd import the type from Prisma

interface MeetingsViewProps {
  meetings: Meeting[]
  currentUserEmail: string
  currentUserId: string
}

export default function MeetingsView({ meetings, currentUserEmail, currentUserId }: MeetingsViewProps) {
  const router = useRouter()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const handleUpdateStatus = async (attendeeId: string, status: 'ACCEPTED' | 'DECLINED') => {
    setIsUpdating(attendeeId)
    try {
      await updateAttendeeStatus(attendeeId, status)
      toast.success('RSVP updated')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update RSVP')
    } finally {
      setIsUpdating(null)
    }
  }

  const upcomingMeetings = meetings.filter(m => new Date(m.scheduledAt) >= new Date())
  const pastMeetings = meetings.filter(m => new Date(m.scheduledAt) < new Date())

  const renderMeetingCard = (meeting: Meeting) => {
    const meetingDate = new Date(meeting.scheduledAt)
    const isPast = meetingDate < new Date()
    
    // Find if current user is an attendee to show RSVP buttons
    const myAttendeeRecord = meeting.attendees.find((a: any) => a.email === currentUserEmail || a.userId === currentUserId)

    return (
      <div key={meeting.id} className={`bg-white rounded-lg border ${isPast ? 'border-slate-200 opacity-75' : 'border-border shadow-sm'} p-5 transition-shadow hover:shadow-md`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[#172B4D]">{meeting.title}</h3>
            {meeting.description && (
              <p className="text-sm text-[#44546F] mt-1">{meeting.description}</p>
            )}
          </div>
          <div className="flex flex-col items-end text-sm text-[#44546F]">
            <div className="flex items-center gap-1.5 font-medium">
              <Calendar size={14} />
              {meetingDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <Clock size={14} />
              {meetingDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {meeting.meetingUrl && (
          <a
            href={meeting.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-hover bg-[#E9F2FF] px-3 py-1.5 rounded-md transition-colors mb-4"
          >
            <LinkIcon size={14} />
            Join Meeting
          </a>
        )}

        <div className="border-t border-slate-100 pt-4 mt-2">
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-[#6B778C]" />
            <span className="text-sm font-medium text-[#42526E]">Attendees ({meeting.attendees.length})</span>
            <span className="text-xs text-[#6B778C] ml-auto">Created by {meeting.creator.name || meeting.creator.email}</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {meeting.attendees.map((attendee: any) => (
              <div 
                key={attendee.id} 
                className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1 text-xs text-[#42526E]"
                title={attendee.email}
              >
                {attendee.status === 'ACCEPTED' && <CheckCircle size={12} className="text-green-500" />}
                {attendee.status === 'DECLINED' && <XCircle size={12} className="text-red-500" />}
                {attendee.status === 'PENDING' && <HelpCircle size={12} className="text-amber-500" />}
                <span className="truncate max-w-[120px]">
                  {attendee.user?.name || attendee.email}
                </span>
              </div>
            ))}
          </div>

          {/* RSVP Actions if applicable */}
          {!isPast && myAttendeeRecord && myAttendeeRecord.status === 'PENDING' && (
            <div className="mt-4 flex items-center gap-2 bg-[#F4F5F7] p-3 rounded-md">
              <span className="text-sm font-medium text-[#172B4D] flex-1">Are you attending?</span>
              <button
                onClick={() => handleUpdateStatus(myAttendeeRecord.id, 'ACCEPTED')}
                disabled={isUpdating === myAttendeeRecord.id}
                className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded shadow-sm transition-colors disabled:opacity-50"
              >
                Accept
              </button>
              <button
                onClick={() => handleUpdateStatus(myAttendeeRecord.id, 'DECLINED')}
                disabled={isUpdating === myAttendeeRecord.id}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-[#172B4D] text-xs font-semibold rounded shadow-sm transition-colors disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F4F5F7]">
      {/* Header */}
      <header className="bg-white border-b border-border h-14 flex items-center justify-between px-6 shrink-0">
        <h1 className="text-lg font-semibold text-[#172B4D]">Organization Meetings</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Schedule Meeting
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <section>
            <h2 className="text-sm font-bold text-[#6B778C] uppercase tracking-wider mb-4">Upcoming Meetings</h2>
            {upcomingMeetings.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {upcomingMeetings.map(renderMeetingCard)}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-border border-dashed p-8 text-center">
                <Calendar className="mx-auto h-12 w-12 text-[#N80] mb-3 opacity-20" />
                <h3 className="text-[#172B4D] font-medium mb-1">No upcoming meetings</h3>
                <p className="text-[#6B778C] text-sm">Schedule a meeting to collaborate with your team.</p>
              </div>
            )}
          </section>

          {pastMeetings.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-[#6B778C] uppercase tracking-wider mb-4">Past Meetings</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {pastMeetings.map(renderMeetingCard)}
              </div>
            </section>
          )}

        </div>
      </div>

      {isCreateModalOpen && (
        <CreateMeetingModal onClose={() => setIsCreateModalOpen(false)} />
      )}
    </div>
  )
}
