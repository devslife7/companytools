import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/events - Get all saved events
export async function GET() {
  try {
    const events = await prisma.savedEvent.findMany({
      orderBy: { eventDate: 'desc' },
    })
    return NextResponse.json({ events })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

// POST /api/events - Create a saved event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, eventDate, recipes } = body

    if (!name || !eventDate || !Array.isArray(recipes)) {
      return NextResponse.json(
        { error: 'Missing required fields: name, eventDate, recipes' },
        { status: 400 }
      )
    }

    const event = await prisma.savedEvent.create({
      data: {
        name,
        eventDate: new Date(eventDate),
        recipes,
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}
