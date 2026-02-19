import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// DELETE /api/events/[id] - Delete a saved event
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const eventId = parseInt(id, 10)

    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    await prisma.savedEvent.delete({ where: { id: eventId } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    console.error('Error deleting event:', error)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}
