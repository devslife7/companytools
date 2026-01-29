#!/bin/bash
# Migration script for Vercel deployments
# This script runs migrations using the direct database connection

set -e

echo "Running database migrations..."

# Use DIRECT_URL if available, otherwise fall back to DATABASE_URL
if [ -n "$DIRECT_URL" ]; then
  echo "Using DIRECT_URL for migrations"
  DATABASE_URL=$DIRECT_URL npx prisma migrate deploy
else
  echo "DIRECT_URL not set, using DATABASE_URL"
  npx prisma migrate deploy
fi

echo "Migrations completed successfully"
