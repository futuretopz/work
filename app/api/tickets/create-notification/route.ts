import { NextRequest, NextResponse } from 'next/server'
import { createNotification } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const { userId, type, ticketId, subject } = await request.json()

    let title = ''
    let message = ''
    let link = `/support`

    switch (type) {
      case 'ticket_created':
        title = 'Support Ticket Created'
        message = `Your ticket "${subject}" has been created. Our team will respond soon.`
        break
      case 'ticket_replied':
        title = 'New Reply on Your Ticket'
        message = `An admin has replied to your ticket "${subject}".`
        break
      case 'ticket_closed':
        title = 'Ticket Closed'
        message = `Your ticket "${subject}" has been marked as resolved.`
        break
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    await createNotification(userId, type, title, message, link)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Create ticket notification error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
