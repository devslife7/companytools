import { NextResponse } from 'next/server'
import { getAllLiquorPrices } from '@/lib/db/liquor-prices'

// GET /api/liquor-prices - Get all liquor prices
export async function GET() {
  try {
    const prices = await getAllLiquorPrices()
    return NextResponse.json(prices)
  } catch (error) {
    console.error('Failed to fetch liquor prices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch liquor prices' },
      { status: 500 }
    )
  }
}
