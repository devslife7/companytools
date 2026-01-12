# Production Deployment Checklist

Use this checklist to ensure your database is properly configured for Vercel production deployment.

## Pre-Deployment

### Local Setup Verification
- [ ] Database connection works locally (`npm run dev` loads cocktails from DB)
- [ ] Migrations are created and tested locally
- [ ] Build succeeds locally (`npm run build`)
- [ ] All code changes are committed to Git

### Database Configuration
- [ ] Supabase project is set up and accessible
- [ ] Connection string uses **pooler** (port 6543) for serverless
- [ ] Connection string includes `pgbouncer=true&connection_limit=1`
- [ ] Database migrations are in `prisma/migrations/` directory

## Vercel Configuration

### Environment Variables
- [ ] `DATABASE_URL` is set in Vercel dashboard (Settings → Environment Variables)
- [ ] `DATABASE_URL` is added to **Production**, **Preview**, and **Development** environments
- [ ] Connection string uses Supabase pooler (port 6543)
- [ ] `NODE_ENV` is set to `production` for production environment (optional, auto-set by Vercel)

### Build Configuration
- [ ] `vercel.json` includes migration command: `prisma migrate deploy`
- [ ] `package.json` has `postinstall` script: `prisma generate`
- [ ] Build command: `prisma generate && prisma migrate deploy && next build`

## Deployment Steps

### Step 1: Push to Git
```bash
git add .
git commit -m "Configure for production deployment"
git push origin main
```

### Step 2: Monitor Build
- [ ] Watch Vercel build logs
- [ ] Verify Prisma Client generation succeeds
- [ ] Verify migrations run successfully
- [ ] Verify Next.js build completes

### Step 3: Verify Deployment
- [ ] Production site loads without errors
- [ ] Navigate to `/batch-calculator`
- [ ] Check for success message: "✓ Loaded X cocktails from database"
- [ ] Verify no fallback message appears
- [ ] Test API endpoint: `/api/cocktails`

## Post-Deployment

### Testing
- [ ] Database queries work (cocktails load from DB)
- [ ] No console errors in browser
- [ ] API routes respond correctly
- [ ] Static data fallback is NOT used

### Monitoring
- [ ] Check Vercel function logs for errors
- [ ] Monitor Supabase database usage
- [ ] Verify connection pooler is working

## Troubleshooting

If you see "Database unavailable, using static data fallback":

1. **Check Environment Variables**
   - Go to Vercel → Settings → Environment Variables
   - Verify `DATABASE_URL` is set correctly
   - Ensure it's enabled for Production environment

2. **Check Build Logs**
   - Review Vercel deployment logs
   - Look for Prisma generation errors
   - Check migration errors

3. **Test Connection**
   - Create test endpoint: `/api/test-db`
   - Check if it can connect to database

4. **Verify Connection String**
   - Must use Supabase pooler (port 6543)
   - Must include `pgbouncer=true&connection_limit=1`
   - SSL mode should be `require` for production

## Quick Commands

```bash
# Test local production build
NODE_ENV=production npm run build

# Check migration status
npx prisma migrate status

# Generate Prisma Client
npx prisma generate

# View Vercel env vars (requires Vercel CLI)
vercel env ls
```

## Success Indicators

✅ Build completes without errors  
✅ Migrations applied successfully  
✅ Site loads and shows database data  
✅ No fallback to static data  
✅ API routes return database results  

---

**Need help?** See `docs/vercel-production-deployment-guide.md` for detailed instructions.
