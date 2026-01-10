# Database Implementation Plan for Cocktail Recipes

## Overview
This document outlines the plan to migrate cocktail recipe data from static TypeScript files to a database-backed system, enabling dynamic CRUD operations, versioning, and future scalability.

## Current State
- **Data Storage**: Static array in `src/features/batch-calculator/data/cocktails.ts`
- **Data Structure**: `CocktailRecipe` interface with:
  - `name`: string
  - `garnish`: string
  - `method`: string
  - `ingredients`: Array of `{ name: string, amount: string }`
- **Usage**: Imported directly into components
- **Limitations**: No CRUD operations, no versioning, no user-specific recipes

## Goals
1. Enable CRUD operations for cocktail recipes
2. Support multiple users/tenants (future-proofing)
3. Maintain backward compatibility during migration
4. Enable recipe versioning and history
5. Support search and filtering capabilities
6. Prepare for future features (favorites, tags, categories)

---

## Phase 1: Database Selection & Setup

### Recommended Database: PostgreSQL
**Rationale:**
- Robust relational database with excellent JSON support
- Great for structured data (recipes, ingredients)
- Supports complex queries and relationships
- Industry standard, well-supported by ORMs
- Can store JSON for flexible ingredient structures
- Excellent performance and scalability

**Alternative Options:**
- **SQLite**: Good for development/small deployments, but limited scalability
- **MongoDB**: Overkill for structured recipe data, adds complexity
- **Supabase/PlanetScale**: Managed PostgreSQL options (good for production)

### ORM/Query Builder: Prisma
**Rationale:**
- Excellent TypeScript support (type-safe queries)
- Great developer experience
- Built-in migrations
- Works seamlessly with Next.js
- Strong community and documentation

**Alternative Options:**
- **Drizzle ORM**: Lightweight, SQL-like syntax
- **TypeORM**: More mature but heavier
- **Raw SQL**: Maximum control but less type safety

---

## Phase 2: Database Schema Design

### Core Tables

#### `cocktails` Table
```sql
CREATE TABLE cocktails (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  garnish TEXT NOT NULL,
  method TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255), -- For future user support
  is_active BOOLEAN DEFAULT TRUE,
  tags TEXT[], -- Array for future categorization
  category VARCHAR(100), -- e.g., "mocktail", "classic", "signature"
  
  -- Indexes
  INDEX idx_cocktails_name (name),
  INDEX idx_cocktails_active (is_active),
  INDEX idx_cocktails_category (category)
);
```

#### `ingredients` Table
```sql
CREATE TABLE ingredients (
  id SERIAL PRIMARY KEY,
  cocktail_id INTEGER NOT NULL REFERENCES cocktails(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  amount VARCHAR(100) NOT NULL, -- Keep as string for flexibility ("2 oz", "3 dashes", etc.)
  order_index INTEGER NOT NULL, -- For maintaining ingredient order
  
  -- Indexes
  INDEX idx_ingredients_cocktail_id (cocktail_id),
  INDEX idx_ingredients_name (name)
);
```

### Prisma Schema (`prisma/schema.prisma`)
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Cocktail {
  id         Int         @id @default(autoincrement())
  name       String      @unique @db.VarChar(255)
  garnish    String      @db.Text
  method     String      @db.Text
  createdAt  DateTime    @default(now()) @map("created_at")
  updatedAt  DateTime    @updatedAt @map("updated_at")
  createdBy  String?     @map("created_by") @db.VarChar(255)
  isActive   Boolean     @default(true) @map("is_active")
  tags       String[]    @default([])
  category   String?     @db.VarChar(100)
  
  ingredients Ingredient[]
  
  @@index([name])
  @@index([isActive])
  @@index([category])
  @@map("cocktails")
}

model Ingredient {
  id         Int      @id @default(autoincrement())
  cocktailId Int      @map("cocktail_id")
  name       String   @db.VarChar(255)
  amount     String   @db.VarChar(100)
  orderIndex Int      @map("order_index")
  
  cocktail   Cocktail @relation(fields: [cocktailId], references: [id], onDelete: Cascade)
  
  @@index([cocktailId])
  @@index([name])
  @@map("ingredients")
}
```

---

## Phase 3: Implementation Steps

### Step 1: Install Dependencies
```bash
npm install @prisma/client
npm install -D prisma
```

### Step 2: Initialize Prisma
```bash
npx prisma init
```

### Step 3: Create Database Migration Script
- Create seed script to migrate existing `COCKTAIL_DATA` to database
- Location: `prisma/seed.ts`

### Step 4: Create API Routes Structure
```
app/api/
  cocktails/
    route.ts          # GET (list), POST (create)
    [id]/
      route.ts        # GET (single), PUT (update), DELETE
    search/
      route.ts        # GET (search/filter)
```

### Step 5: Create Database Service Layer
```
src/lib/
  db/
    prisma.ts         # Prisma client singleton
    cocktails.ts      # Database operations for cocktails
```

### Step 6: Update Components
- Replace static imports with API calls
- Add loading states
- Add error handling
- Implement optimistic updates

---

## Phase 4: API Design

### GET `/api/cocktails`
**Query Parameters:**
- `search`: string (search by name)
- `category`: string (filter by category)
- `tags`: string[] (filter by tags)
- `active`: boolean (default: true)

**Response:**
```typescript
{
  cocktails: CocktailRecipe[],
  total: number
}
```

### GET `/api/cocktails/[id]`
**Response:**
```typescript
CocktailRecipe
```

### POST `/api/cocktails`
**Body:**
```typescript
{
  name: string,
  garnish: string,
  method: string,
  ingredients: { name: string, amount: string }[]
}
```

### PUT `/api/cocktails/[id]`
**Body:** Same as POST

### DELETE `/api/cocktails/[id]`
**Response:**
```typescript
{ success: boolean }
```

### GET `/api/cocktails/search?q=...`
**Response:**
```typescript
CocktailRecipe[]
```

---

## Phase 5: Migration Strategy

### Approach: Gradual Migration with Fallback

1. **Phase 5a: Dual Source Support**
   - Keep `COCKTAIL_DATA` as fallback
   - Add feature flag: `USE_DATABASE`
   - Components check flag and use appropriate source
   - Allows testing without breaking existing functionality

2. **Phase 5b: Data Migration**
   - Create seed script to populate database
   - Run migration script to transfer all existing recipes
   - Verify data integrity

3. **Phase 5c: Switch to Database**
   - Update feature flag to use database
   - Monitor for issues
   - Keep static data as backup for 1-2 weeks

4. **Phase 5d: Cleanup**
   - Remove static data file
   - Remove feature flag
   - Update all imports

---

## Phase 6: Code Structure

### New File Structure
```
prisma/
  schema.prisma
  seed.ts
  migrations/

src/lib/
  db/
    prisma.ts              # Prisma client instance
    cocktails.ts            # Database operations
    types.ts                # Database-specific types

app/api/
  cocktails/
    route.ts
    [id]/
      route.ts
    search/
      route.ts

src/features/batch-calculator/
  hooks/
    useCocktails.ts         # React hook for fetching cocktails
    useCocktail.ts          # React hook for single cocktail
```

### Example Service Layer (`src/lib/db/cocktails.ts`)
```typescript
import { prisma } from './prisma'
import type { CocktailRecipe } from '@/features/batch-calculator/types'

export async function getAllCocktails(filters?: {
  search?: string
  category?: string
  active?: boolean
}): Promise<CocktailRecipe[]> {
  // Implementation
}

export async function getCocktailById(id: number): Promise<CocktailRecipe | null> {
  // Implementation
}

export async function createCocktail(data: Omit<CocktailRecipe, 'id'>): Promise<CocktailRecipe> {
  // Implementation
}

export async function updateCocktail(id: number, data: Partial<CocktailRecipe>): Promise<CocktailRecipe> {
  // Implementation
}

export async function deleteCocktail(id: number): Promise<void> {
  // Implementation
}
```

---

## Phase 7: Environment Configuration

### `.env.local` (Development)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/companytools_dev"
```

### `.env.production` (Production)
```env
DATABASE_URL="postgresql://user:password@host:5432/companytools_prod"
```

### Environment-Specific Considerations
- **Development**: Use local PostgreSQL or Docker container
- **Staging**: Use managed database (Supabase, Railway, etc.)
- **Production**: Use managed database with backups

---

## Phase 8: Testing Strategy

### Unit Tests
- Test database service functions
- Test API route handlers
- Test data transformation logic

### Integration Tests
- Test API endpoints end-to-end
- Test database queries
- Test error handling

### Migration Tests
- Verify seed script accuracy
- Test data integrity after migration
- Compare static vs database results

---

## Phase 9: Performance Considerations

### Caching Strategy
- **Client-side**: React Query or SWR for caching API responses
- **Server-side**: Consider Redis for frequently accessed recipes
- **Static Generation**: Pre-generate popular cocktails at build time

### Optimization
- Add database indexes (already in schema)
- Implement pagination for large recipe lists
- Use database connection pooling
- Consider read replicas for production

---

## Phase 10: Future Enhancements

### Version 2 Features
1. **User Authentication**
   - Add `users` table
   - Link cocktails to users
   - Support private/public recipes

2. **Recipe Versioning**
   - Track recipe history
   - Allow reverting to previous versions
   - Show change history

3. **Advanced Features**
   - Favorites/bookmarks
   - Recipe ratings
   - Ingredient inventory tracking
   - Recipe cost calculation
   - Batch history tracking

4. **Search Improvements**
   - Full-text search
   - Search by ingredients
   - Filter by alcohol content
   - Filter by difficulty/complexity

---

## Implementation Timeline

### Week 1: Setup & Schema
- [ ] Install Prisma and dependencies
- [ ] Set up database (local or managed)
- [ ] Create Prisma schema
- [ ] Run initial migration
- [ ] Create seed script

### Week 2: API Development
- [ ] Create API routes
- [ ] Implement database service layer
- [ ] Add error handling
- [ ] Write API tests

### Week 3: Frontend Integration
- [ ] Create React hooks for data fetching
- [ ] Update components to use API
- [ ] Add loading/error states
- [ ] Implement feature flag system

### Week 4: Migration & Testing
- [ ] Run data migration
- [ ] Test thoroughly
- [ ] Switch to database (with fallback)
- [ ] Monitor and fix issues

### Week 5: Cleanup & Documentation
- [ ] Remove static data
- [ ] Remove feature flags
- [ ] Update documentation
- [ ] Deploy to production

---

## Risk Mitigation

### Risks
1. **Data Loss**: Mitigate with backups and migration verification
2. **Performance Issues**: Mitigate with caching and optimization
3. **Breaking Changes**: Mitigate with feature flags and gradual rollout
4. **Database Costs**: Mitigate by choosing appropriate hosting tier

### Rollback Plan
- Keep static data file until migration is verified
- Feature flag allows instant rollback
- Database backups before major changes

---

## Dependencies to Add

```json
{
  "dependencies": {
    "@prisma/client": "^5.0.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0"
  }
}
```

---

## Questions to Consider

1. **Hosting**: Where will the database be hosted? (Local, Supabase, Railway, AWS RDS, etc.)
2. **Authentication**: Will you need user authentication now or later?
3. **Multi-tenancy**: Will different users/companies need separate recipe sets?
4. **Backup Strategy**: How often should backups run?
5. **Monitoring**: What monitoring/logging tools will you use?

---

## Next Steps

1. Review and approve this plan
2. Choose database hosting solution
3. Set up development database
4. Begin Phase 1 implementation
5. Schedule regular check-ins to track progress

---

## References

- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [React Query](https://tanstack.com/query/latest) (for client-side caching)
