# GEMINI.md - Project Context & Instructions

This document provides a comprehensive overview of the `companytools` project to guide AI interactions and development.

## Project Overview
`companytools` is an internal utility suite built for a catering company. Its primary feature is a **Batch Calculator** for cocktail recipes, allowing staff to calculate ingredient quantities for large-scale events based on servings or target volumes.

### Main Technologies
- **Framework:** Next.js 16 (App Router) with React 19.
- **Language:** TypeScript.
- **Database:** PostgreSQL via Prisma 7 (hosted on Supabase).
- **Styling:** Tailwind CSS 4.
- **Icons:** Lucide React.
- **Infrastructure:** Vercel (deployment), Supabase (database/pooling).

## Core Architecture
The project follows a modular, feature-based architecture:

- **`app/`**: Contains the Next.js App Router structure.
  - `(tools)/`: Route group for internal utilities, sharing a common sidebar layout.
  - `api/`: Backend API routes for cocktail management and database testing.
- **`src/features/`**: Self-contained modules for specific functionality.
  - `batch-calculator/`: Core logic, components, and types for the cocktail calculator.
- **`src/components//`**: Reusable UI and layout components.
- **`src/lib/db/`**: Prisma client initialization with specialized handling for Supabase connection pooling and SSL.

## Database Schema
The database (managed via Prisma) consists of two primary models:
- **Cocktail**: Stores recipe metadata (name, method, instructions, featured status).
- **Ingredient**: Linked to cocktails, storing amounts, units, and preferred batching units (e.g., quarts, cans).

## Development Workflows

### Building and Running
- **Development:** `npm run dev` (uses Next.js Turbopack).
- **Production Build:** `npm run build` (generates Prisma client and builds Next.js).
- **Linting:** `npm run lint`.

### Database Management
- **Generate Client:** `npm run db:generate`.
- **Apply Migrations:** `npm run db:migrate`.
- **Seed Data:** `npm run db:seed`.
- **Export Data:** `npm run db:export` (Syncs DB state to `src/features/batch-calculator/data/cocktails.ts`).
- **Prisma Studio:** `npm run db:studio`.

## Development Conventions
- **Path Aliases:** Always use `@/` for imports (e.g., `@/components/...`).
- **Feature Isolation:** Keep logic, types, and components specific to a tool within its `src/features/[feature-name]` directory.
- **Type Safety:** Ensure all new components and functions are fully typed.
- **Database Initialization:** Use the singleton pattern in `src/lib/db/prisma.ts` to prevent connection exhaustion in serverless environments.
- **Calculations:** Core batching logic resides in `src/features/batch-calculator/lib/calculations.ts`. Use the existing conversion factors and parsing utilities for consistency.

## Key Files for Context
- `prisma/schema.prisma`: Data model definition.
- `src/features/batch-calculator/lib/calculations.ts`: Unit conversion and batching logic.
- `src/lib/db/prisma.ts`: Database client configuration.
- `app/(tools)/layout.tsx`: Shared UI structure for all tools.
