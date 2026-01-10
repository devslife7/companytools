import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

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
  
  if (connectionString.includes('supabase.co') || connectionString.includes('pooler.supabase.com')) {
    // Ensure SSL is enabled for Supabase connections
    if (!connectionString.includes('sslmode')) {
      const separator = connectionString.includes('?') ? '&' : '?'
      finalConnectionString = `${connectionString}${separator}sslmode=require`
    }
    
    // For connection pooler (port 6543), ensure pgbouncer=true and connection_limit=1
    // This is required for Supabase's Transaction Mode pooler used in serverless environments
    if (connectionString.includes(':6543') || connectionString.includes('pooler.supabase.com')) {
      if (!connectionString.includes('pgbouncer=true')) {
        const separator = finalConnectionString.includes('?') ? '&' : '?'
        finalConnectionString = `${finalConnectionString}${separator}pgbouncer=true`
      }
      if (!connectionString.includes('connection_limit')) {
        const separator = finalConnectionString.includes('?') ? '&' : '?'
        finalConnectionString = `${finalConnectionString}${separator}connection_limit=1`
      }
    }
  }
  
  const adapter = new PrismaPg({ connectionString: finalConnectionString })
  
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
