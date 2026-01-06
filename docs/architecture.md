# Company Tools - Architecture Documentation

## Project Structure

This project follows industry-standard Next.js App Router conventions with a clean separation of concerns.

### Directory Layout

```
companytools/
├── app/                          # Next.js App Router
│   ├── (tools)/                  # Route group for tools
│   │   ├── layout.tsx            # Shared layout with navigation
│   │   ├── page.tsx              # Tools dashboard
│   │   └── batch-calculator/     # Batch calculator tool
│   │       └── page.tsx
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Homepage
│
├── src/                          # Source code
│   ├── components/               # Shared components
│   │   ├── ui/                   # UI components (design system)
│   │   │   ├── batch-input.tsx
│   │   │   ├── cocktail-selector.tsx
│   │   │   └── index.ts
│   │   └── common/               # Common app components
│   │
│   ├── features/                 # Feature modules
│   │   └── batch-calculator/
│   │       ├── components/       # Feature-specific components
│   │       ├── lib/              # Business logic
│   │       │   └── calculations.ts
│   │       ├── data/             # Static data
│   │       │   └── cocktails.ts
│   │       └── types.ts          # TypeScript types
│   │
│   ├── lib/                      # Shared utilities
│   │   ├── server/               # Server-only utilities
│   │   ├── client/               # Client-only utilities
│   │   └── shared/               # Universal utilities
│   │
│   ├── hooks/                    # Shared React hooks
│   └── types/                    # Global TypeScript types
│
├── public/                       # Static assets
└── docs/                         # Documentation
```

## Design Principles

### 1. Separation of Concerns
- **UI Components** (`src/components/ui`): Reusable, presentational components
- **Feature Logic** (`src/features/*/lib`): Business logic and calculations
- **Data** (`src/features/*/data`): Static data and constants
- **Types** (`src/features/*/types.ts`): TypeScript interfaces and types

### 2. Route Organization
- **Route Groups**: `(tools)` groups related routes without affecting URL structure
- **Feature Routes**: Each tool gets its own route (e.g., `/batch-calculator`)
- **Shared Layouts**: Common navigation and styling via layout components

### 3. TypeScript Path Aliases
Configured in `tsconfig.json` for clean imports:
- `@/components/*` → `src/components/*`
- `@/features/*` → `src/features/*`
- `@/lib/*` → `src/lib/*`
- `@/hooks/*` → `src/hooks/*`
- `@/types/*` → `src/types/*`

### 4. Scalability
- **Feature Modules**: Each tool is self-contained in `src/features/`
- **Shared UI Kit**: Reusable components in `src/components/ui/`
- **Type Safety**: Strong TypeScript typing throughout

## Adding New Tools

To add a new tool:

1. Create feature module: `src/features/your-tool/`
2. Add types: `src/features/your-tool/types.ts`
3. Add logic: `src/features/your-tool/lib/`
4. Add components: `src/features/your-tool/components/`
5. Create route: `app/(tools)/your-tool/page.tsx`
6. Update navigation in `app/(tools)/layout.tsx`
7. Add to dashboard in `app/(tools)/page.tsx`

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build**: Turbopack

## Best Practices

1. **Keep routes thin**: Move logic to feature modules
2. **Use path aliases**: Avoid relative imports like `../../../`
3. **Colocate related code**: Keep feature code together
4. **Type everything**: Leverage TypeScript for safety
5. **Memoize expensive operations**: Use `useMemo` and `useCallback`
6. **Extract reusable UI**: Build a component library in `src/components/ui/`

