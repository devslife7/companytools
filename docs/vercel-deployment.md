# Vercel Deployment Guide

## Database Setup

### 1. Set Environment Variables in Vercel

1. Go to your Vercel project settings
2. Navigate to **Settings** → **Environment Variables**
3. Add the following environment variable:
   - **Name**: `DATABASE_URL`
   - **Value**: Your PostgreSQL connection string (e.g., `postgresql://user:password@host:port/database?sslmode=require`)
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

- **Check DATABASE_URL**: Ensure it's set correctly in Vercel environment variables
- **Check SSL**: Most cloud databases require SSL. Add `?sslmode=require` to your connection string
- **Check Network**: Ensure your database allows connections from Vercel's IP ranges

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

### 6. Connection Pooling (Recommended for Production)

For better performance and connection management in serverless environments, consider using:

- **Prisma Data Proxy** (recommended)
- **PgBouncer** connection pooler
- **Supabase** or **Neon** (they provide built-in connection pooling)

To use Prisma Data Proxy:
1. Set up Prisma Data Proxy
2. Update `DATABASE_URL` to use the proxy URL
3. No code changes needed
