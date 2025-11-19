# Salina Bookshelf ERP

Publishing operations management platform built with Next.js 15, TypeScript, and Tailwind CSS.

## Tech Stack

- **Framework:** Next.js 15 (App Router, React Server Components)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Database:** PostgreSQL 16 + Drizzle ORM
- **Package Manager:** pnpm

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- Docker (for local PostgreSQL and Redis)

### Installation

```bash
# 1. Install dependencies
pnpm install

# 2. Start local database services (PostgreSQL + Redis)
docker-compose up -d

# 3. Copy environment variables
cp .env.example .env.local
# Edit .env.local with your database connection (default is fine for local dev)

# 4. Run database migrations
pnpm db:generate
pnpm db:migrate

# 5. Start development server
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Development Commands

```bash
# Code Quality
pnpm lint                 # Run ESLint
pnpm format               # Format code with Prettier
pnpm format:check         # Check formatting

# Database Management
pnpm db:generate          # Generate migration from schema changes
pnpm db:migrate           # Apply migrations to database
pnpm db:studio            # Launch Drizzle Studio (visual database UI)

# Docker Services
docker-compose up -d      # Start PostgreSQL + Redis in background
docker-compose down       # Stop services
docker-compose logs -f    # View service logs
```

## Project Structure

```
salina-erp-bmad/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   │   └── ui/          # shadcn/ui components
│   └── lib/             # Utility functions
├── db/
│   ├── index.ts          # Database client (Drizzle + PostgreSQL)
│   ├── schema/           # Database table schemas
│   │   ├── base.ts      # Reusable schema patterns (tenantFields)
│   │   └── index.ts     # Schema exports
│   └── migrations/       # Generated database migrations
├── hono/                 # API routes for webhooks (future)
├── tests/                # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/                 # Project documentation
├── docker-compose.yml    # Local PostgreSQL + Redis services
└── drizzle.config.ts     # Drizzle ORM configuration
```

## Publishing Ink Theme

The application uses a professional Publishing Ink color palette:

- **Deep Blue** (#1e3a8a) - Primary brand color
- **Warm Amber** (#d97706) - Accent color
- **Slate** (#64748b) - Neutral text
- **Emerald** (#059669) - Success states
- **Red** (#dc2626) - Error states

## License

ISC