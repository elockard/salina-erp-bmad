# Salina Bookshelf ERP

Publishing operations management platform built with Next.js 15, TypeScript, and Tailwind CSS.

## Tech Stack

- **Framework:** Next.js 15 (App Router, React Server Components)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Package Manager:** pnpm

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

### Development Commands

```bash
# Run linting
pnpm lint

# Format code with Prettier
pnpm format

# Check formatting
pnpm format:check
```

## Project Structure

```
salina-erp-bmad/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   │   └── ui/          # shadcn/ui components
│   └── lib/             # Utility functions
├── db/                  # Database schemas and migrations (future)
├── hono/                # API routes for webhooks (future)
├── tests/               # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── docs/                # Project documentation
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