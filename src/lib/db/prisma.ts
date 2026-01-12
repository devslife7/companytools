import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL!
  
  // For Supabase connections, ensure proper configuration for serverless environments
  let finalConnectionString = connectionString
  let pool: Pool | undefined
  
  if (connectionString.includes('supabase.co') || connectionString.includes('pooler.supabase.com')) {
    // Parse query parameters from the connection string
    const [baseUrl, queryString] = connectionString.split('?')
    const params = new URLSearchParams(queryString || '')
    
    // For Supabase pooler connections, use 'no-verify' SSL mode to handle certificate issues
    // This is safe for Supabase as they use valid certificates, but helps with connection issues
    // In production, you may want to use 'require' and configure proper certificate validation
    const sslMode = process.env.NODE_ENV === 'production' ? 'require' : 'no-verify'
    params.set('sslmode', sslMode)
    
    // For connection pooler (port 6543), ensure pgbouncer=true and connection_limit=1
    // This is required for Supabase's Transaction Mode pooler used in serverless environments
    if (connectionString.includes(':6543') || connectionString.includes('pooler.supabase.com')) {
      params.set('pgbouncer', 'true')
      params.set('connection_limit', '1')
    }
    
    // Reconstruct the connection string
    finalConnectionString = `${baseUrl}?${params.toString()}`
    
    // Create a pg Pool with proper SSL configuration for Supabase
    pool = new Pool({
      connectionString: finalConnectionString,
      max: 1, // Important for serverless/connection pooler
    })
    
    // Log the modified connection string in development (without password)
    if (process.env.NODE_ENV === 'development') {
      const maskedUrl = finalConnectionString.replace(/:[^:@]+@/, ':****@')
      console.log('[Prisma] Using Supabase connection:', maskedUrl)
    }
  }
  
  const adapter = pool 
    ? new PrismaPg(pool)
    : new PrismaPg({ connectionString: finalConnectionString })
  
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
