# Company Tools

A collection of internal utility tools built with Next.js to streamline workflows and boost productivity.

## Features

### 🍹 Batch Calculator
Calculate ingredient quantities for batch cocktail recipes with precise measurements and conversions. Features include:
- Multi-cocktail selection and batch management
- Real-time ingredient calculations based on servings or target volume
- Editable recipes with custom ingredients, garnishes, and methods
- PDF report generation for print-ready batch sheets
- Popular cocktail quick-select

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Build Tool**: Turbopack

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd companytools
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

The page auto-updates as you edit files.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
companytools/
├── app/                    # Next.js App Router
│   ├── (tools)/           # Route group for tools
│   │   ├── layout.tsx     # Shared layout with navigation
│   │   ├── page.tsx       # Tools dashboard
│   │   └── batch-calculator/
│   │       └── page.tsx   # Batch calculator tool
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
│
├── src/
│   ├── components/        # Shared components
│   │   └── ui/           # UI component library
│   │
│   └── features/         # Feature modules
│       └── batch-calculator/
│           ├── components/  # Feature-specific components
│           ├── lib/         # Business logic & calculations
│           ├── data/        # Static data (cocktails)
│           └── types.ts     # TypeScript types
│
├── docs/                 # Documentation
└── public/               # Static assets
```

## Development Guidelines

- **Add new tools** under `app/(tools)/` using the App Router
- **Keep tools focused**: Prefer client components only where needed
- **Feature modules**: Each tool should be self-contained in `src/features/`
- **Type safety**: Use TypeScript for all new code
- **Path aliases**: Use `@/` imports instead of relative paths (configured in `tsconfig.json`)

For detailed architecture information, see [docs/architecture.md](./docs/architecture.md).

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## License

Private - Internal use only
