'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { sendMeetingInviteEmail } from '@/lib/email'

export async function createMeeting({
  title,
  description,
  scheduledAt,
  meetingUrl,
  organizationId,
  attendeeEmails,
}: {
  title: string
  description?: string
  scheduledAt: Date
  meetingUrl?: string
  organizationId: string
  attendeeEmails: string[]
}) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user) {
    throw new Error('Not authenticated')
  }

  if (attendeeEmails.length > 10) {
    throw new Error('Maximum of 10 attendees allowed per meeting.')
  }

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId }
  })
  if (!organization) {
    throw new Error('Organization not found')
  }

  const meeting = await prisma.meeting.create({
    data: {
      title,
      description,
      scheduledAt,
      meetingUrl,
      organizationId,
      creatorId: session.user.id,
      attendees: {
        create: attendeeEmails.map(email => ({
          email,
          status: 'PENDING'
        }))
      }
    },
    include: {
      attendees: true
    }
  })

  const meetingDateStr = new Date(scheduledAt).toLocaleDateString()
  const meetingTimeStr = new Date(scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  for (const attendee of meeting.attendees) {
    const user = await prisma.user.findUnique({
      where: { email: attendee.email }
    })

    if (user) {
      await prisma.meetingAttendee.update({
        where: { id: attendee.id },
        data: { userId: user.id }
      })
    }

    await sendMeetingInviteEmail({
      to: attendee.email,
      meetingTitle: title,
      meetingDate: meetingDateStr,
      meetingTime: meetingTimeStr,
      meetingUrl,
      organizationName: organization.name,
      inviterName: session.user.name || 'A team member'
    })
  }

  return meeting
}

export async function getMeetings(organizationId: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user) {
    throw new Error('Not authenticated')
  }

  return prisma.meeting.findMany({
    where: { organizationId },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      },
      attendees: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          }
        }
      }
    },
    orderBy: {
      scheduledAt: 'asc'
    }
  })
}

export async function updateAttendeeStatus(attendeeId: string, status: 'ACCEPTED' | 'DECLINED') {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user) {
    throw new Error('Not authenticated')
  }

  const attendee = await prisma.meetingAttendee.findUnique({
    where: { id: attendeeId }
  })
  
  if (!attendee) {
    throw new Error('Attendee not found')
  }

  if (attendee.email !== session.user.email && attendee.userId !== session.user.id) {
    throw new Error('Unauthorized')
  }

  return prisma.meetingAttendee.update({
    where: { id: attendeeId },
    data: { status }
  })
}
