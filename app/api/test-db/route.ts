import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'

/**
 * Test endpoint to verify database connection in production
 * Visit /api/test-db to check if database is accessible
 */
export async function GET() {
  const diagnostics: any = {
    success: false,
    environment: process.env.NODE_ENV || 'unknown',
    timestamp: new Date().toISOString(),
    checks: {} as Record<string, any>,
  }

  // Check 1: Environment variables
  diagnostics.checks.envVars = {
    DATABASE_URL: {
      exists: !!process.env.DATABASE_URL,
      length: process.env.DATABASE_URL?.length || 0,
      isSupabase: process.env.DATABASE_URL?.includes('supabase') || false,
      hasPooler: process.env.DATABASE_URL?.includes('pooler') || process.env.DATABASE_URL?.includes(':6543') || false,
      masked: process.env.DATABASE_URL 
        ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@').substring(0, 100) + '...'
        : 'NOT SET',
    },
    NODE_ENV: process.env.NODE_ENV || 'not set',
    VERCEL: process.env.VERCEL || 'not set',
    VERCEL_ENV: process.env.VERCEL_ENV || 'not set',
  }

  // Check 2: Database connection
  try {
    // Test basic connection
    const testQuery = await prisma.$queryRaw`SELECT 1 as test`
    diagnostics.checks.connection = {
      status: 'success',
      rawQuery: 'passed',
    }
    
    // Get database info
    const dbInfo = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version() as version`
    diagnostics.checks.database = {
      status: 'connected',
      version: dbInfo[0]?.version?.substring(0, 50) || 'unknown',
    }
    
    // Get cocktail count
    const cocktailCount = await prisma.cocktail.count()
    diagnostics.checks.cocktailCount = {
      status: 'success',
      count: cocktailCount,
    }
    
    // Get a sample cocktail
    const sampleCocktail = await prisma.cocktail.findFirst({
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    })
    diagnostics.checks.sampleData = {
      status: 'success',
      sample: sampleCocktail || null,
    }

    diagnostics.success = true
    diagnostics.message = 'Database connection successful'
    diagnostics.database = {
      connected: true,
      cocktailCount,
      sampleCocktail: sampleCocktail || null,
    }

    return NextResponse.json(diagnostics)
  } catch (error) {
    console.error('Database test failed:', error)
    
    diagnostics.checks.connection = {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorCode: (error as any)?.code || 'N/A',
    }

    // Check for common error patterns
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const commonIssues: string[] = []
    
    if (errorMessage.includes('connect') || errorMessage.includes('ECONNREFUSED')) {
      commonIssues.push('Connection refused - check DATABASE_URL and network access')
    }
    if (errorMessage.includes('timeout')) {
      commonIssues.push('Connection timeout - check firewall and connection pooler settings')
    }
    if (errorMessage.includes('SSL') || errorMessage.includes('certificate')) {
      commonIssues.push('SSL error - verify SSL configuration in connection string')
    }
    if (errorMessage.includes('password') || errorMessage.includes('authentication')) {
      commonIssues.push('Authentication failed - verify DATABASE_URL credentials')
    }
    if (errorMessage.includes('does not exist') || errorMessage.includes('relation')) {
      commonIssues.push('Table not found - run database migrations')
    }
    
    diagnostics.checks.commonIssues = commonIssues.length > 0 ? commonIssues : ['No common issues detected']
    diagnostics.message = 'Database connection failed'
    diagnostics.error = errorMessage
    diagnostics.details = process.env.NODE_ENV === 'development' 
      ? (error instanceof Error ? error.stack : undefined)
      : undefined

    return NextResponse.json(diagnostics, { status: 500 })
  }
}
