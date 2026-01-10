# Database Setup Guide

This guide will help you set up the database for the cocktail recipes application.

## Prerequisites

- Node.js installed
- PostgreSQL database (local or cloud-hosted)

## Step 1: Set Up Database

### Option A: Local PostgreSQL

1. Install PostgreSQL on your machine
2. Create a database:
   ```bash
   createdb companytools_dev
   ```

### Option B: Cloud Database (Recommended for Production)

Choose one of these options:

- **Supabase**: https://supabase.com (Free tier available)
- **Railway**: https://railway.app (Free tier available)
- **Neon**: https://neon.tech (Free tier available)
- **AWS RDS**: For production use

## Step 2: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set your database URL:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/companytools_dev"
   ```

   For cloud databases, use the connection string provided by your hosting service.

3. (Optional) Enable database mode:
   ```env
   NEXT_PUBLIC_USE_DATABASE=true
   ```
   
   If set to `false` or not set, the app will use static data as fallback.

## Step 3: Run Database Migrations

1. Generate Prisma Client:
   ```bash
   npm run db:generate
   ```

2. Create and apply migrations:
   ```bash
   npm run db:migrate
   ```
   
   This will:
   - Create the `cocktails` and `ingredients` tables
   - Set up indexes and relationships

## Step 4: Seed the Database

Populate the database with existing cocktail data:

```bash
npm run db:seed
```

This will migrate all cocktails from `src/features/batch-calculator/data/cocktails.ts` to the database.

## Step 5: Verify Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open Prisma Studio to view your data:
   ```bash
   npm run db:studio
   ```

3. Test the API:
   - Visit `http://localhost:3000/api/cocktails` to see all cocktails
   - Visit `http://localhost:3000/api/cocktails/search?q=martini` to search

## Troubleshooting

### Database Connection Issues

- Verify your `DATABASE_URL` is correct
- Ensure PostgreSQL is running (if using local database)
- Check firewall settings (if using cloud database)
- Verify database credentials

### Migration Errors

- If tables already exist, you may need to reset:
  ```bash
  npx prisma migrate reset
  ```
  ⚠️ **Warning**: This will delete all data!

### Prisma Client Not Found

- Regenerate the client:
  ```bash
  npm run db:generate
  ```

## Available Scripts

- `npm run db:generate` - Generate Prisma Client
- `npm run db:migrate` - Create and apply migrations
- `npm run db:seed` - Seed database with cocktail data
- `npm run db:studio` - Open Prisma Studio (database GUI)

## Feature Flag

The application uses a feature flag to switch between database and static data:

- **`NEXT_PUBLIC_USE_DATABASE=true`**: Uses database (requires database setup)
- **`NEXT_PUBLIC_USE_DATABASE=false`** or unset: Uses static data (fallback)

This allows you to:
- Develop without a database initially
- Gradually migrate to database
- Have a fallback if database is unavailable

## Next Steps

Once the database is set up:

1. Test CRUD operations via API routes
2. Verify the frontend loads cocktails from the database
3. Consider adding authentication for future features
4. Set up database backups for production

## Production Deployment

For production:

1. Use a managed PostgreSQL database (Supabase, Railway, etc.)
2. Set up environment variables in your hosting platform
3. Run migrations as part of your deployment process
4. Set up automated backups
5. Monitor database performance
