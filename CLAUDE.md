# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Generate Prisma client + Next.js production build
npm run lint         # Run ESLint

# Database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Apply migrations (development)
npm run db:export    # Sync DB → src/features/batch-calculator/data/cocktails.ts
npm run db:studio    # Open Prisma Studio
```

> **Do not run `npm run db:seed` without asking the user first.**

## Architecture

**Company Tools** is an internal utility suite for a catering company, built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, and PostgreSQL via Prisma 7 (hosted on Supabase, deployed on Vercel).

### Directory Layout

- **`app/`** — Next.js App Router. All user-facing tools live under `app/(tools)/`, sharing a sidebar layout. API routes under `app/api/`.
- **`src/features/batch-calculator/`** — The primary feature module. Self-contained with its own `components/`, `hooks/`, `lib/`, `data/`, and `types.ts`.
- **`src/components/`** — Reusable UI and layout components shared across features.
- **`src/lib/db/prisma.ts`** — Prisma singleton (important for serverless: prevents connection exhaustion).
- **`prisma/schema.prisma`** — Database schema (Cocktail, Ingredient, LiquorPrice models).

### Data Flow

Pages → custom hooks (`useCocktails`, `useCocktailMutations`) → `/api/cocktails` routes → Prisma → PostgreSQL.

State is managed purely with React `useState`/`useCallback`/`useMemo` — no Redux or Zustand.

The static file `src/features/batch-calculator/data/cocktails.ts` serves as a fallback when the database is unavailable. Keep it in sync using `npm run db:export` after schema/data changes.

### Routing

- `/` → redirects to `/batch-calculator`
- `/batch-calculator` — cocktail gallery + multi-select
- `/batch-calculator/review` — batch sheet, calculations, PDF export
- `/saved-events` — secondary feature (stub)

Selected recipes are passed to the review page via URL query params (`?recipes=1,2,3`).

### Key Business Logic

- **`src/features/batch-calculator/lib/calculations.ts`** — All unit conversion factors and batching math. The fixed batch target is `20L` (`FIXED_BATCH_LITERS`).
- **`src/features/batch-calculator/lib/pdf-generator.ts`** — PDF report generation (jsPDF).
- Ingredients use Prisma's `Decimal` type for precision. Conversion factors (oz, tsp, dash, etc.) are defined in `calculations.ts` — reuse them, don't hardcode.

## Conventions

- Use `@/` path aliases for all imports (configured in `tsconfig.json`).
- New tools belong under `app/(tools)/` with their logic isolated in `src/features/[tool-name]/`.
- Mark client components explicitly with `"use client"` — pages are server-rendered by default.
- Always use the Prisma singleton from `src/lib/db/prisma.ts` in API routes.

## Do Not
- Do not run `npm run db:seed` without asking the user first.