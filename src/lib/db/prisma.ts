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
  
  // Ensure SSL is enabled for Supabase connections if not already specified
  // Supabase requires SSL connections
  let finalConnectionString = connectionString
  if (connectionString.includes('supabase.co') && !connectionString.includes('sslmode')) {
    // Add SSL mode if not present (use 'require' for basic SSL, 'verify-full' for full verification)
    const separator = connectionString.includes('?') ? '&' : '?'
    finalConnectionString = `${connectionString}${separator}sslmode=require`
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
