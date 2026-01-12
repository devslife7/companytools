import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'

/**
 * Test endpoint to verify database connection in production
 * Visit /api/test-db to check if database is accessible
 */
export async function GET() {
  try {
    // Test basic connection
    const testQuery = await prisma.$queryRaw`SELECT 1 as test`
    
    // Get cocktail count
    const cocktailCount = await prisma.cocktail.count()
    
    // Get a sample cocktail
    const sampleCocktail = await prisma.cocktail.findFirst({
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      environment: process.env.NODE_ENV,
      database: {
        connected: true,
        cocktailCount,
        sampleCocktail: sampleCocktail || null,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Database test failed:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: 'Database connection failed',
        environment: process.env.NODE_ENV,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.stack : undefined)
          : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
