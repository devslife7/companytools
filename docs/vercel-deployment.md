# Vercel Deployment Guide

## Database Setup

### 1. Set Environment Variables in Vercel

1. Go to your Vercel project settings
2. Navigate to **Settings** → **Environment Variables**
3. Add the following environment variables:

   **For Supabase (Recommended for Serverless):**
   
   - **Name**: `DATABASE_URL`
   - **Value**: Use Supabase's **Transaction Pooler** connection string (port 6543)
     - Format: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require`
     - Get this from: Supabase Dashboard → Settings → Database → Connection String → Transaction Pooler
   - **Environment**: Select all environments (Production, Preview, Development)
   
   - **Name**: `DIRECT_URL` (Optional, for local development only)
     - **⚠️ DO NOT SET THIS IN VERCEL** - The direct connection (port 5432) is not reachable from Vercel
     - Only set this locally if you want to use direct connections for faster migrations
     - Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require`
     - Get this from: Supabase Dashboard → Settings → Database → Connection String → Direct Connection
   
   **For Other PostgreSQL Databases:**
   
   - **Name**: `DATABASE_URL`
   - **Value**: Your PostgreSQL connection string with SSL (e.g., `postgresql://user:password@host:port/database?sslmode=require`)
   - **Environment**: Select all environments (Production, Preview, Development)

### 2. Database Migrations

Migrations will run automatically during build via `vercel.json`. The build command includes:
- `prisma generate` - Generates Prisma Client
- `prisma migrate deploy` - Applies pending migrations
- `next build` - Builds the Next.js application

### 3. First-Time Setup

If this is your first deployment:

1. **Run migrations locally** to create the migration files:
   ```bash
   npm run db:migrate
   ```

2. **Commit and push** the migration files to your repository

3. **Deploy to Vercel** - migrations will run automatically

### 4. Seeding the Database

After deployment, you can seed the database by:

**Option A: Run seed script locally** (if your DATABASE_URL points to production):
```bash
npm run db:seed
```

**Option B: Use Vercel CLI**:
```bash
vercel env pull .env.local
npm run db:seed
```

**Option C: Create a one-time API route** for seeding (not recommended for production, but useful for initial setup)

### 5. Troubleshooting

#### Database Connection Issues

**P1001 Error (Can't reach database server):**

This is a common issue when deploying to Vercel with Supabase. Solutions:

1. **Use Connection Pooler (Recommended)**: 
   - Use Supabase's Transaction Pooler connection string (port 6543) instead of direct connection (port 5432)
   - The pooler is designed for serverless environments and handles connection management
   - Format: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require`

2. **Check Connection String Format**:
   - Ensure `pgbouncer=true` and `connection_limit=1` are included for pooler connections
   - Ensure `sslmode=require` is included for SSL connections

3. **Check IP Allowlist**:
   - If using direct connection, ensure Supabase allows connections from Vercel's IP ranges
   - Better: Use the connection pooler which doesn't require IP allowlisting

4. **Verify Environment Variables**:
   - Check that `DATABASE_URL` is set correctly in Vercel environment variables
   - **IMPORTANT**: Do NOT set `DIRECT_URL` in Vercel - it will cause migration failures
   - Ensure `DATABASE_URL` uses the Transaction Pooler (port 6543), not the direct connection (port 5432)
   - Ensure it's set for the correct environment (Production, Preview, Development)
   - Redeploy after updating environment variables

#### Migration Issues

- **Check build logs**: Look for Prisma migration errors in Vercel build logs
- **Manual migration**: If automatic migration fails, you can run migrations manually:
  ```bash
  vercel env pull .env.local
  npx prisma migrate deploy
  ```

#### Prisma Client Issues

- **Clear cache**: If Prisma Client seems outdated, clear `.next` and `node_modules`:
  ```bash
  rm -rf .next node_modules
  npm install
  ```

### 6. Connection Pooling (Required for Supabase on Vercel)

**For Supabase Deployments:**

Supabase provides built-in connection pooling via Supavisor. For serverless environments like Vercel, you **must** use the Transaction Pooler connection string:

- **Transaction Pooler (Port 6543)**: Use for application runtime (DATABASE_URL)
  - Designed for serverless/short-lived connections
  - Requires `pgbouncer=true&connection_limit=1` parameters
  - Format: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require`

- **Direct Connection (Port 5432)**: Use for migrations (DIRECT_URL, optional)
  - Can be used for migrations if needed
  - Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require`

**Why use the pooler?**
- Vercel serverless functions have short-lived connections
- The pooler manages connections efficiently
- Avoids "too many connections" errors
- Works without IP allowlisting

**Other Options:**
- **Prisma Data Proxy**: Alternative pooling solution
- **PgBouncer**: Self-hosted connection pooler
