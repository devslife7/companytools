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
  const isProduction = process.env.NODE_ENV === 'production'
  
  // For Supabase connections, ensure proper configuration for serverless environments
  let finalConnectionString = connectionString
  let pool: Pool | undefined
  
  const isSupabase = connectionString.includes('supabase.co') || connectionString.includes('pooler.supabase.com')
  
  if (isSupabase) {
    // Parse query parameters from the connection string
    const [baseUrl, queryString] = connectionString.split('?')
    const params = new URLSearchParams(queryString || '')
    
    // Remove any existing sslmode - we'll handle SSL via Pool config
    params.delete('sslmode')
    
    // For connection pooler (port 6543), ensure pgbouncer=true and connection_limit=1
    // This is required for Supabase's Transaction Mode pooler used in serverless environments
    if (connectionString.includes(':6543') || connectionString.includes('pooler.supabase.com')) {
      params.set('pgbouncer', 'true')
      params.set('connection_limit', '1')
    }
    
    // Reconstruct the connection string without sslmode
    finalConnectionString = `${baseUrl}?${params.toString()}`
    
    // Create a pg Pool with proper SSL configuration for Supabase
    // We handle SSL entirely via the Pool's SSL config, not the connection string
    // rejectUnauthorized: false allows certificate chain validation issues
    pool = new Pool({
      connectionString: finalConnectionString,
      max: 1, // Important for serverless/connection pooler
      ssl: {
        rejectUnauthorized: false, // Supabase uses valid certs, but chain validation can fail
      },
    })
    
    // Log connection info (without password) for debugging
    const maskedUrl = finalConnectionString.replace(/:[^:@]+@/, ':****@')
    console.log(`[Prisma] Using Supabase connection (${process.env.NODE_ENV || 'unknown'}):`, maskedUrl)
  } else if (isProduction) {
    // For production non-Supabase connections, configure SSL to handle self-signed certificates
    // This handles cases where the database uses self-signed certificates or certificate chain issues
    const sslConfig = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true' 
      ? { rejectUnauthorized: true }
      : { rejectUnauthorized: false } // Default to false to handle self-signed certs
    
    pool = new Pool({
      connectionString: finalConnectionString,
      ssl: sslConfig,
    })
    
    const maskedUrl = finalConnectionString.replace(/:[^:@]+@/, ':****@')
    console.log(`[Prisma] Using production connection with SSL (${process.env.NODE_ENV || 'unknown'}):`, maskedUrl)
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
