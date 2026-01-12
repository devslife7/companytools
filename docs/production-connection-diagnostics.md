# Production Supabase Connection Diagnostics

This guide helps diagnose and fix Supabase connection issues in production on Vercel.

## Quick Diagnostic Steps

### 1. Test the Connection Endpoint

Visit your production URL: `https://your-app.vercel.app/api/test-db`

This endpoint will show:
- ✅ Environment variable status
- ✅ Connection test results
- ✅ Database version info
- ✅ Common error patterns and solutions

### 2. Check Vercel Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify `DATABASE_URL` is set for **Production** environment
3. Ensure it uses the **Transaction Pooler** connection (port 6543)

**Correct format:**
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require
```

**Key requirements:**
- ✅ Port **6543** (pooler, not 5432)
- ✅ `pgbouncer=true`
- ✅ `connection_limit=1`
- ✅ `sslmode=require` (for production)

### 3. Common Issues and Solutions

#### Issue: "Connection refused" or "ECONNREFUSED"

**Causes:**
- Using direct connection (port 5432) instead of pooler (port 6543)
- Wrong hostname in connection string
- Network/firewall blocking connection

**Solution:**
1. Verify you're using the **Transaction Mode** pooler connection from Supabase
2. Check Supabase Dashboard → Settings → Database → Connection string
3. Select "Transaction mode" (not "Session mode" or "Direct connection")
4. Update `DATABASE_URL` in Vercel with the pooler connection string

#### Issue: "SSL certificate error" or "SSL required"

**Causes:**
- Missing SSL configuration in connection string
- Incorrect SSL mode

**Solution:**
1. Ensure connection string includes `sslmode=require`
2. The code now automatically sets SSL mode in production
3. Verify Supabase connection string includes SSL parameters

#### Issue: "Authentication failed" or "password authentication failed"

**Causes:**
- Incorrect password in connection string
- Password contains special characters that need URL encoding
- Database user doesn't exist or was deleted

**Solution:**
1. Reset database password in Supabase Dashboard
2. URL-encode special characters in password (`@` → `%40`, `#` → `%23`, etc.)
3. Update `DATABASE_URL` in Vercel with new password

#### Issue: "Table does not exist" or "relation does not exist"

**Causes:**
- Migrations not run in production
- Wrong database schema

**Solution:**
1. Verify migrations are running during build (check `vercel-build` script)
2. Check Vercel build logs for migration output
3. Manually run migrations if needed:
   ```bash
   vercel env pull .env.production
   npx prisma migrate deploy
   ```

#### Issue: "Connection timeout"

**Causes:**
- Firewall blocking connection
- Supabase project paused (free tier)
- Network issues

**Solution:**
1. Check Supabase project status (Dashboard → Project Settings)
2. Verify project is not paused
3. Check Supabase logs for connection attempts
4. Try connection from different network

### 4. Verify Build Configuration

**Check `vercel.json`:**
```json
{
  "buildCommand": "npm run vercel-build",
  "installCommand": "npm install"
}
```

**Check `package.json` scripts:**
```json
{
  "scripts": {
    "vercel-build": "prisma migrate deploy && next build",
    "postinstall": "prisma generate"
  }
}
```

**Build process should:**
1. ✅ Install dependencies (`npm install`)
2. ✅ Generate Prisma Client (`postinstall` script)
3. ✅ Run migrations (`prisma migrate deploy`)
4. ✅ Build Next.js app (`next build`)

### 5. Check Vercel Build Logs

1. Go to Vercel Dashboard → Deployments → Latest deployment
2. Check for:
   - ✅ "Generated Prisma Client" message
   - ✅ "Migration applied" messages
   - ❌ Any connection errors during build
   - ❌ "DATABASE_URL not set" errors

### 6. Test Connection Locally with Production URL

```bash
# Pull production environment variables
vercel env pull .env.production

# Test connection
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2-) npx prisma db pull

# Or test with the diagnostic endpoint locally
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2-) npm run dev
# Then visit http://localhost:3000/api/test-db
```

### 7. Enable Detailed Logging

The diagnostic endpoint (`/api/test-db`) now provides:
- Environment variable status
- Connection test results
- Database version
- Common error pattern detection
- Actionable solutions

### 8. Verify Supabase Configuration

**In Supabase Dashboard:**
1. Settings → Database → Connection Pooling
2. Ensure "Transaction mode" is enabled
3. Check connection limits (should allow serverless connections)
4. Verify IP allowlist (if enabled, ensure Vercel IPs are allowed)

## Testing Checklist

- [ ] `DATABASE_URL` is set in Vercel Production environment
- [ ] Connection string uses port **6543** (pooler)
- [ ] Connection string includes `pgbouncer=true`
- [ ] Connection string includes `connection_limit=1`
- [ ] Connection string includes `sslmode=require`
- [ ] Vercel build logs show successful Prisma Client generation
- [ ] Vercel build logs show successful migrations
- [ ] `/api/test-db` endpoint returns success
- [ ] Database queries work in production
- [ ] No fallback to static data

## Next Steps After Fixing

1. **Redeploy** your application in Vercel
2. **Monitor** the build logs for any errors
3. **Test** the `/api/test-db` endpoint
4. **Verify** your app is using database data (not static fallback)

## Getting Help

If issues persist:
1. Check Vercel Function logs (Dashboard → Functions → View Logs)
2. Check Supabase logs (Dashboard → Logs → Postgres Logs)
3. Review the diagnostic endpoint output (`/api/test-db`)
4. Verify all environment variables are set correctly
5. Test connection string format matches Supabase requirements
