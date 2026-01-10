import { NextRequest, NextResponse } from 'next/server'
import { searchCocktails } from '@/lib/db/cocktails'

// GET /api/cocktails/search?q=... - Search cocktails
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.trim() === '') {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    const cocktails = await searchCocktails(query.trim())

    return NextResponse.json({
      cocktails,
      total: cocktails.length,
      query: query.trim(),
    })
  } catch (error) {
    console.error('Error searching cocktails:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Failed to search cocktails',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}
