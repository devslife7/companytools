import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/feedback - Get all feedback entries
export async function GET() {
  try {
    const feedback = await prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ feedback })
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
  }
}

// POST /api/feedback - Submit new feedback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, page, message } = body

    if (!type || !page || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: type, page, message' },
        { status: 400 }
      )
    }

    if (!['bug', 'improvement'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "bug" or "improvement"' },
        { status: 400 }
      )
    }

    const feedback = await prisma.feedback.create({
      data: { type, page, message },
    })

    return NextResponse.json(feedback, { status: 201 })
  } catch (error) {
    console.error('Error creating feedback:', error)
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
  }
}
