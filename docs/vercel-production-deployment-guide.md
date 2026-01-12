# Vercel Production Deployment Guide

This guide provides step-by-step instructions to deploy your database-backed Next.js application to Vercel production.

## Prerequisites

- ✅ Supabase database is set up and accessible
- ✅ Local development environment is working
- ✅ Database migrations are created and tested locally
- ✅ Vercel account and project created

---

## Step-by-Step Deployment Plan

### Step 1: Verify Local Database Setup

**1.1 Check your local database connection:**
```bash
# Test database connection locally
npm run db:generate
npx prisma migrate status
```

**1.2 Verify migrations are up to date:**
```bash
# Check migration status
npx prisma migrate status

# If migrations are pending, apply them:
npx prisma migrate deploy
```

**1.3 Test your local build:**
```bash
# Ensure build works locally
npm run build
```

---

### Step 2: Configure Environment Variables in Vercel

**2.1 Access Vercel Dashboard:**
1. Go to [vercel.com](https://vercel.com) and log in
2. Navigate to your project dashboard
3. Click on your project name

**2.2 Add Environment Variables:**
1. Go to **Settings** → **Environment Variables**
2. Add the following variables:

   | Variable Name | Value | Environment |
   |--------------|-------|-------------|
   | `DATABASE_URL` | Your Supabase connection string | Production, Preview, Development |
   | `NODE_ENV` | `production` | Production only |

**2.3 Get your Supabase Connection String:**
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Under **Connection string**, select **Transaction mode** (port 6543)
4. Copy the connection string (it should look like):
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   ```
5. Paste this into Vercel's `DATABASE_URL` environment variable

**2.4 Important Notes:**
- ✅ Use the **pooler connection** (port 6543) for serverless environments
- ✅ Ensure `pgbouncer=true` and `connection_limit=1` are in the connection string
- ✅ The connection string should include SSL parameters
- ⚠️ **Never commit** your `.env` file or connection strings to git

---

### Step 3: Update Vercel Build Configuration

**3.1 Verify `vercel.json` configuration:**

Your `vercel.json` should look like this:
```json
{
  "buildCommand": "prisma generate && next build",
  "installCommand": "npm install"
}
```

**3.2 Ensure `package.json` has correct scripts:**
```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

**Note:** The `postinstall` script ensures Prisma Client is generated during Vercel's install phase.

---

### Step 4: Configure Prisma for Production

**4.1 Update `src/lib/db/prisma.ts` for production SSL:**

The current configuration uses `sslmode=no-verify` for development and `sslmode=require` for production. This is already configured correctly.

**4.2 Verify production SSL mode:**
- Production uses `sslmode=require` (secure)
- Development uses `sslmode=no-verify` (for local testing)

---

### Step 5: Set Up Database Migrations

**5.1 Create a migration script (if needed):**

Create `scripts/migrate.sh`:
```bash
#!/bin/bash
set -e
echo "Running database migrations..."
npx prisma migrate deploy
echo "Migrations completed successfully!"
```

**5.2 Configure Vercel Build Command:**

Update `vercel.json` to run migrations during build:
```json
{
  "buildCommand": "prisma generate && prisma migrate deploy && next build",
  "installCommand": "npm install"
}
```

**Alternative:** Use Vercel's Build Command in the dashboard:
```
prisma generate && prisma migrate deploy && next build
```

---

### Step 6: Deploy to Vercel

**6.1 Push your code to Git:**
```bash
# Ensure all changes are committed
git add .
git commit -m "Configure for Vercel production deployment"
git push origin main
```

**6.2 Trigger deployment:**
- If connected to Git, Vercel will auto-deploy on push
- Or manually trigger from Vercel dashboard: **Deployments** → **Redeploy**

**6.3 Monitor the build:**
- Watch the build logs in Vercel dashboard
- Check for any errors during:
  - Install phase (Prisma Client generation)
  - Build phase (migrations and Next.js build)
  - Deploy phase

---

### Step 7: Verify Production Deployment

**7.1 Check deployment logs:**
1. Go to **Deployments** in Vercel dashboard
2. Click on the latest deployment
3. Review build logs for:
   - ✅ Prisma Client generation success
   - ✅ Database migrations applied
   - ✅ Next.js build completion

**7.2 Test the production site:**
1. Visit your production URL
2. Test database connectivity:
   - Navigate to `/batch-calculator`
   - Check if cocktails load from database (not static fallback)
   - Look for success message: "✓ Loaded X cocktails from database"

**7.3 Check for errors:**
- Open browser console (F12)
- Check for any connection errors
- Verify API routes are working: `/api/cocktails`

---

### Step 8: Set Up Database Seeding (Optional)

**8.1 Seed production database (if needed):**

Create a one-time seed script or use Vercel's CLI:

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Run seed script in production environment
vercel env pull .env.production
npx prisma db seed
```

**8.2 Or seed via Supabase Dashboard:**
- Use Supabase SQL Editor to run seed queries
- Or use Prisma Studio: `npx prisma studio` (connect to production DB)

---

### Step 9: Monitor and Troubleshoot

**9.1 Common Issues and Solutions:**

| Issue | Solution |
|-------|----------|
| **Build fails: "DATABASE_URL not set"** | Verify environment variable is set in Vercel dashboard |
| **Connection timeout** | Check Supabase connection pooler settings, ensure using port 6543 |
| **SSL certificate error** | Verify `sslmode=require` is set for production |
| **Migrations fail** | Check migration files are committed, verify database permissions |
| **Prisma Client not found** | Ensure `postinstall` script runs `prisma generate` |

**9.2 Enable Vercel Logs:**
- Go to **Functions** → **View Logs** in Vercel dashboard
- Monitor API route logs for database connection issues

**9.3 Test database connection:**
Create a test API route: `app/api/test-db/route.ts`:
```typescript
import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const count = await prisma.cocktail.count()
    return NextResponse.json({ 
      success: true, 
      cocktailCount: count,
      environment: process.env.NODE_ENV 
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
```

Visit `/api/test-db` to verify database connectivity.

---

### Step 10: Production Best Practices

**10.1 Security:**
- ✅ Never expose `DATABASE_URL` in client-side code
- ✅ Use environment variables for all sensitive data
- ✅ Enable Supabase Row Level Security (RLS) if needed
- ✅ Use connection pooling (already configured)

**10.2 Performance:**
- ✅ Connection pooler is configured (`connection_limit=1`)
- ✅ Prisma Client is cached globally (singleton pattern)
- ✅ Use Supabase's connection pooler (port 6543) for serverless

**10.3 Monitoring:**
- Set up Vercel Analytics
- Monitor Supabase database usage
- Set up error tracking (e.g., Sentry)

**10.4 Backup:**
- Configure Supabase automated backups
- Document your migration process
- Keep migration files in version control

---

## Quick Reference Checklist

- [ ] Database migrations created and tested locally
- [ ] `DATABASE_URL` environment variable set in Vercel
- [ ] `NODE_ENV=production` set in Vercel (production environment)
- [ ] `vercel.json` configured with build command
- [ ] `package.json` has `postinstall` script
- [ ] Code pushed to Git repository
- [ ] Vercel deployment triggered
- [ ] Build logs show successful Prisma generation
- [ ] Build logs show successful migrations
- [ ] Production site loads correctly
- [ ] Database queries work in production
- [ ] No fallback to static data

---

## Troubleshooting Commands

```bash
# Test local production build
NODE_ENV=production npm run build

# Check Prisma migration status
npx prisma migrate status

# Generate Prisma Client
npx prisma generate

# Test database connection locally with production URL
DATABASE_URL="your-production-url" npx prisma db pull

# View Vercel environment variables (requires Vercel CLI)
vercel env ls
```

---

## Additional Resources

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

## Support

If you encounter issues:
1. Check Vercel build logs
2. Review Supabase connection logs
3. Test database connection locally with production URL
4. Verify all environment variables are set correctly
