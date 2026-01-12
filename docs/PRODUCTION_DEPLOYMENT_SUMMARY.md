# Production Deployment Summary

## Quick Start Guide

### Essential Steps (5 minutes)

1. **Set Environment Variable in Vercel**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add `DATABASE_URL` with your Supabase connection string
   - Use the **pooler connection** (port 6543) from Supabase dashboard
   - Enable for Production, Preview, and Development

2. **Push to Git**
   ```bash
   git add .
   git commit -m "Ready for production"
   git push origin main
   ```

3. **Monitor Deployment**
   - Watch Vercel build logs
   - Verify migrations run: `prisma migrate deploy`
   - Check build completes successfully

4. **Test Production Site**
   - Visit your production URL
   - Go to `/batch-calculator`
   - Should see: "✓ Loaded X cocktails from database"
   - Test: `/api/test-db` to verify connection

## What's Already Configured

✅ **Prisma Client** - Auto-generates on install (`postinstall` script)  
✅ **Migrations** - Run automatically during build (`vercel.json`)  
✅ **SSL Configuration** - Uses `sslmode=require` for production  
✅ **Connection Pooling** - Configured for Supabase serverless  
✅ **Error Handling** - Falls back to static data if DB unavailable  

## Connection String Format

Your Supabase connection string should look like:
```
postgresql://postgres.[ref]:[password]@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

**Important:**
- Use **pooler** connection (port 6543)
- Include `pgbouncer=true&connection_limit=1`
- Get it from: Supabase Dashboard → Settings → Database → Connection string → Transaction mode

## Files Modified for Production

1. **`vercel.json`** - Added `prisma migrate deploy` to build command
2. **`src/lib/db/prisma.ts`** - Configured SSL for production (`sslmode=require`)
3. **`package.json`** - Already has `postinstall` script for Prisma generation

## Verification Checklist

After deployment, verify:

- [ ] `/api/test-db` returns `success: true`
- [ ] `/batch-calculator` shows database cocktails (not static fallback)
- [ ] No "Database unavailable" warning message
- [ ] Build logs show successful migrations

## Troubleshooting

**Problem:** "Database unavailable, using static data fallback"

**Solutions:**
1. Check `DATABASE_URL` is set in Vercel environment variables
2. Verify connection string uses pooler (port 6543)
3. Check build logs for migration errors
4. Test connection: Visit `/api/test-db`

**Problem:** Build fails with "DATABASE_URL not set"

**Solution:** Add `DATABASE_URL` to Vercel environment variables

**Problem:** SSL certificate error

**Solution:** Already handled - production uses `sslmode=require`

## Next Steps

1. ✅ Set `DATABASE_URL` in Vercel
2. ✅ Push code to trigger deployment
3. ✅ Monitor build logs
4. ✅ Test production site
5. ✅ Verify database connectivity

## Detailed Guides

- **Full Guide:** `docs/vercel-production-deployment-guide.md`
- **Checklist:** `docs/PRODUCTION_CHECKLIST.md`
- **Test Endpoint:** `/api/test-db`

---

**Ready to deploy?** Follow the Quick Start Guide above! 🚀
