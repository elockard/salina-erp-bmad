# Architecture

## Executive Summary

Salina Bookshelf ERP uses a **modern, pragmatic architecture** built on proven technologies optimized for multi-tenant SaaS. The foundation leverages **Next.js 15 App Router** for the web application layer, **Hono** for API routes, **PostgreSQL with Drizzle ORM** for database operations with schema-per-tenant isolation, and **Clerk** for authentication and role-based access control.

This architecture prioritizes **developer productivity**, **type safety**, and **scalability** while avoiding over-engineering. The stack uses boring, reliable technologies that work well together and have strong ecosystem support.

**Key Architectural Principles:**
- **Multi-tenant from Day 1** - Database schema isolation per tenant, enforced at application layer
- **Type Safety Throughout** - TypeScript end-to-end, Drizzle for type-safe SQL, Zod for runtime validation
- **Boring Tech That Works** - Proven tools (Postgres, Next.js, Tailwind) over trendy frameworks
- **Desktop-First UX** - Optimized for data-dense ERP workflows, responsive for tablet/mobile
- **Integration-Ready** - Clean API boundaries for Shopify, QuickBooks, EasyPost webhooks

---

## Project Initialization

**First implementation story should execute:**

```bash
# Initialize Next.js 15 project with TypeScript, Tailwind, App Router
npx create-next-app@latest salina-erp \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

This establishes the base architecture with these foundational decisions:

**Provided by create-next-app:**
- ✅ **Next.js 15** - App Router, React Server Components, Server Actions
- ✅ **TypeScript 5** - Type safety throughout application
- ✅ **Tailwind CSS 4** - Utility-first styling (required for shadcn/ui)
- ✅ **ESLint** - Code quality and consistency
- ✅ **Turbopack** - Fast dev mode bundler
- ✅ **src/ directory structure** - Clean separation of application code
- ✅ **Import aliases (@/*)** - Clean imports across codebase

**Manual additions after initialization:**
1. **shadcn/ui** - Run `npx shadcn@latest init` to add component library
2. **Drizzle ORM** - Install drizzle-orm, drizzle-kit, postgres driver
3. **Clerk** - Install @clerk/nextjs for authentication
4. **Hono** - Install hono for API route layer (middleware, validation)
5. **Database** - PostgreSQL with multi-tenant schema setup

## Decision Summary

| Category | Decision | Version | Affects FR Categories | Rationale |
|----------|----------|---------|----------------------|-----------|
| **Foundation** | create-next-app | Latest | All | Official Next.js starter with TypeScript, Tailwind, App Router |
| **Framework** | Next.js | 15.x | All | App Router, React Server Components, Server Actions |
| **Language** | TypeScript | 5.x | All | Type safety throughout stack |
| **Styling** | Tailwind CSS | 4.x | All | Utility-first, required for shadcn/ui |
| **UI Components** | shadcn/ui | CLI v2.x | All | Radix UI + Tailwind, WCAG AA accessible, code ownership |
| **Database** | PostgreSQL | 16.x | All | Industry standard, RLS support, JSON types |
| **ORM** | Drizzle | 0.44.7 | All | Type-safe SQL, native RLS policies, migration tools |
| **Multi-Tenancy** | Row-Level Security (RLS) | Native PG | All | Database-level tenant isolation, single schema |
| **Authentication** | Clerk | 6.35.1 | User Mgmt (FR10-17) | Organizations map to tenants, custom roles, OAuth |
| **Authorization** | Clerk Roles + App RBAC | Custom | User Mgmt (FR10-17) | 8 roles, field-level permissions in app layer |
| **API Layer** | Hono (webhooks) + Server Actions (app) | Hono 4.x | Integrations (FR86-99), All | Hybrid: Server Actions for internal, Hono for external |
| **State Management** | TanStack Query | 5.x | All | Server state caching, optimistic updates, devtools |
| **Form Handling** | React Hook Form + Zod | RHF 7.x, Zod 3.x | Titles, Orders, Settings | Validation shared client/server, minimal re-renders |
| **Real-Time** | Ably | 2.14.0 | Inventory (FR54-62), Orders, Dashboard | WebSocket updates, usage-based pricing, tenant isolation |
| **Background Jobs** | Inngest | 3.45.1 | Integrations (FR86-99), Alerts | Event-driven, retries, visual monitoring, long-running support |
| **File Storage** | AWS S3 + CloudFront | - | Titles (FR27-40) | Cover images, PDFs, marketing assets, CDN delivery |
| **Caching** | TanStack Query + Next.js + Redis | Redis 7.x | All | Multi-layer: client (TQ), server (Next.js), shared (Redis) |
| **Error Handling** | AppError classes + Sentry | 10.25.0 | All | Structured errors, global boundaries, tracking |
| **Logging** | Pino | 9.x | All | Structured JSON logs, never log sensitive data |
| **Testing** | Vitest + Playwright | 4.0.8 / 1.56.1 | All | Unit/integration (Vitest), E2E (Playwright), test DB for RLS |
| **Rate Limiting** | Upstash Redis | 1.35.6 | Integrations | Per-tenant limits, sliding window, serverless-friendly |
| **Feature Flags** | Database table | Custom | All | `tenant_features` table, simple on/off per tenant |
| **Deployment** | Docker (Railway/Fly.io/Render) | - | All | Self-hosted, long-running processes, no timeout limits |
| **Monitoring** | Sentry + Pino | 10.25.0 / 9.x | All | Error tracking, structured logging, query logs (dev) |
| **Migrations** | Drizzle Kit | 0.31.6 | All | Schema-based, RLS policies auto-generated, zero-downtime |

## Project Structure

```
salina-erp/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth layout group
│   │   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   │   └── sign-up/[[...sign-up]]/page.tsx
│   │   ├── (dashboard)/              # Main app layout (Sidebar + TopBar)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Dashboard
│   │   │   ├── titles/               # Title management
│   │   │   ├── customers/            # Customer management
│   │   │   ├── orders/               # Order processing
│   │   │   ├── inventory/            # Inventory management
│   │   │   ├── contributors/         # Contributor management
│   │   │   ├── reports/              # Reporting
│   │   │   └── settings/             # Settings (company, users, ISBN blocks, integrations)
│   │   ├── api/[[...route]]/route.ts # Hono API (webhooks, public API)
│   │   ├── error.tsx                 # Global error boundary
│   │   ├── layout.tsx                # Root layout (Clerk provider)
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                       # shadcn/ui (auto-generated)
│   │   ├── layout/                   # Layout components
│   │   ├── titles/                   # Title-specific (wizard, cards, table)
│   │   ├── isbn/                     # ISBN components (visualizer, picker)
│   │   ├── orders/                   # Order components (fulfillment panel)
│   │   ├── contributors/             # Contributor components (card, modal, calculator)
│   │   ├── inventory/                # Inventory components (alerts, indicators)
│   │   ├── dashboard/                # Dashboard widgets (KPIs, charts)
│   │   └── shared/                   # Shared (data-table, file-upload, date-picker)
│   ├── lib/                          # Utilities
│   │   ├── utils.ts, logger.ts, errors.ts, permissions.ts
│   │   ├── isbn.ts, storage.ts, email.ts, constants.ts
│   ├── hooks/                        # React hooks (use-tenant, use-permissions, use-debounce)
│   ├── actions/                      # Server Actions (titles.ts, orders.ts, inventory.ts, etc.)
│   ├── validators/                   # Zod schemas (title.ts, order.ts, etc.)
│   └── middleware.ts                 # Clerk auth + tenant context
│
├── db/
│   ├── index.ts                      # Database client
│   ├── tenant-context.ts             # withTenantContext wrapper
│   ├── schema/
│   │   ├── base.ts                   # tenantFields, common patterns
│   │   ├── tenants.ts, users.ts, titles.ts, formats.ts
│   │   ├── isbn-blocks.ts, isbns.ts  # ISBN management
│   │   ├── contributors.ts, title-contributors.ts
│   │   ├── customers.ts, orders.ts, order-line-items.ts
│   │   ├── inventory.ts, inventory-transactions.ts
│   │   ├── bisac-codes.ts            # Reference data (no RLS)
│   │   ├── tenant-features.ts        # Feature flags
│   │   └── index.ts
│   └── migrations/                   # Drizzle migrations
│
├── inngest/
│   ├── client.ts
│   ├── functions/
│   │   ├── shopify-webhook.ts
│   │   ├── quickbooks-export.ts
│   │   ├── easypost-tracking.ts
│   │   ├── email-notifications.ts
│   │   └── low-isbn-alert.ts
│   └── index.ts
│
├── hono/
│   ├── app.ts                        # Main Hono app
│   ├── middleware/                   # Auth, tenant, rate-limit, error-handler
│   └── routes/
│       ├── webhooks/                 # Shopify, EasyPost
│       └── public/                   # Future public API
│
├── tests/
│   ├── unit/                         # ISBN, permissions, validators
│   ├── integration/                  # Titles, ISBN blocks, orders (with test DB)
│   └── e2e/                          # Title wizard, order fulfillment, ISBN management
│
├── docs/                             # Documentation
├── .env.example
├── components.json                   # shadcn/ui config
├── drizzle.config.ts
├── next.config.js
├── tailwind.config.ts                # Publishing Ink theme
├── vitest.config.ts
├── playwright.config.ts
├── Dockerfile
├── docker-compose.yml                # Local dev (Postgres + Redis)
└── package.json
```

## FR Category to Architecture Mapping

This table maps each functional requirement category to the architectural components that support it.

| FR Category | FR Range | Database Schema | Server Actions | Components | Inngest Jobs | API Routes | Key Libraries |
|-------------|----------|-----------------|----------------|------------|--------------|------------|---------------|
| **Tenant & Subscription** | FR1-9 | `tenants`, `tenant_features` | `src/actions/tenants.ts` | `src/app/(auth)/sign-up` | - | - | Clerk Organizations |
| **User Management** | FR10-17 | `users` (Clerk synced) | `src/actions/users.ts` | `src/app/(dashboard)/settings/users` | `email-notifications.ts` | - | Clerk, `permissions.ts` |
| **ISBN Block Management** | FR18-26 | `isbn_blocks`, `isbns` (no RLS) | `src/actions/isbn-blocks.ts` | `ISBNBlockVisualizer`, `ISBNPicker` | `low-isbn-alert.ts` | - | `lib/isbn.ts` (Modulo 10) |
| **Title & Metadata** | FR27-40 | `titles`, `formats`, `bisac_codes` | `src/actions/titles.ts` | `TitleWizard`, `TitleCard`, `TitleFormatManager` | - | - | S3 (cover images, PDFs) |
| **Contributor Management** | FR41-47 | `contributors`, `title_contributors` | `src/actions/contributors.ts` | `ContributorCard`, `ContributorModal` | - | - | - |
| **Customer Management** | FR48-53 | `customers`, `customer_pricing` | `src/actions/customers.ts` | `CustomerTable`, `CustomerModal` | - | - | - |
| **Inventory Management** | FR54-62 | `inventory`, `inventory_transactions` | `src/actions/inventory.ts` | `InventoryTable`, `InventoryAlertBadge` | - | - | Redis (real-time cache) |
| **Order Management** | FR63-72 | `orders`, `order_line_items` | `src/actions/orders.ts` | `OrderTable`, `OrderModal` | `shopify-webhook.ts` | `POST /webhooks/shopify` | Shopify SDK, TanStack Query |
| **Fulfillment & Shipping** | FR73-80 | `shipments` | `src/actions/fulfillment.ts` | `OrderFulfillmentPanel`, `PickList` | `easypost-tracking.ts` | - | EasyPost SDK |
| **Returns Management** | FR81-85 | `returns`, `credit_memos` | `src/actions/returns.ts` | `ReturnsTable`, `ReturnModal` | - | - | - |
| **Integrations** | FR86-99 | `integration_configs`, `integration_logs` | `src/actions/integrations.ts` | `IntegrationSettings` | `shopify-webhook.ts`, `quickbooks-export.ts` | `POST /webhooks/shopify`, `POST /webhooks/easypost` | Hono (webhooks), Inngest (jobs) |
| **Dashboards & Reporting** | FR100-106 | (reads from all tables) | `src/actions/reports.ts` | `DashboardWidget`, `KPICard`, `ReportTable` | - | - | TanStack Query, Recharts |
| **System Administration** | FR107-114 | `audit_logs` | `src/actions/admin.ts` | `OnboardingWizard`, `SettingsPanel` | - | - | Pino (logging) |
| **Contracts & Royalties** (Post-MVP) | FR115-125 | `contracts`, `royalty_statements` | `src/actions/contracts.ts` | `RoyaltyCalculator`, `ContractModal` | `calculate-royalties.ts` | - | - |
| **Production & Scheduling** (Post-MVP) | FR126-134 | `production_projects`, `production_tasks` | `src/actions/production.ts` | `GanttChart`, `KanbanBoard` | `production-alerts.ts` | - | - |
| **ONIX & Metadata Export** (Post-MVP) | FR135-138 | (reads `titles`, `formats`) | `src/actions/onix.ts` | `ONIXExporter` | `onix-export.ts` | - | ONIX validation library |
| **Advanced Analytics** (Post-MVP) | FR139-144 | (reads all tables) | `src/actions/analytics.ts` | `ProfitLossReport`, `InventoryAging` | - | - | - |

**Key Cross-Cutting Concerns:**
- **Multi-Tenancy:** `withTenantContext()` wrapper in `db/tenant-context.ts` sets `app.current_tenant_id` for RLS enforcement
- **Real-Time Updates:** Ably channels scoped by tenant (`tenant_{id}_inventory`, `tenant_{id}_orders`)
- **Caching:** TanStack Query keys prefixed with tenant ID (`['tenant', tenantId, 'titles']`)
- **Error Handling:** `AppError` classes in `lib/errors.ts` with Sentry integration
- **Logging:** Pino structured logs with `tenantId` and `userId` in context (no sensitive data)

## Technology Stack Details

### Core Technologies

**Next.js 15 (App Router)**
- **Why:** React Server Components reduce client bundle, Server Actions eliminate API boilerplate, automatic code splitting
- **Key Features Used:**
  - Server Components for data fetching (no client-side waterfalls)
  - Server Actions for mutations (`createTitle`, `fulfillOrder`)
  - Route groups for layout organization (`(auth)`, `(dashboard)`)
  - Parallel routes for modals and dynamic panels
  - Streaming with Suspense for progressive page loading
- **File Patterns:**
  - `app/(dashboard)/titles/page.tsx` - Server Component (default)
  - `app/(dashboard)/titles/[id]/edit/page.tsx` - Dynamic routes
  - `app/api/[[...route]]/route.ts` - Hono catch-all for webhooks

**TypeScript 5**
- **Why:** Catch errors at compile time, excellent IDE support, self-documenting code
- **Strict Mode:** Enabled with `strict: true`, `noUncheckedIndexedAccess: true`
- **Key Patterns:**
  - Drizzle schema generates types automatically (`InferSelectModel`, `InferInsertModel`)
  - Zod schemas generate TypeScript types (`z.infer<typeof titleSchema>`)
  - Branded types for ISBNs: `type ISBN = string & { __brand: 'ISBN' }`
  - Discriminated unions for Server Action returns: `{ success: true, data } | { success: false, error }`

**PostgreSQL 16**
- **Why:** Rock-solid ACID compliance, native RLS, excellent JSON support, mature ecosystem
- **Key Features Used:**
  - Row-Level Security policies for multi-tenant isolation
  - Session variables (`app.current_tenant_id`) for RLS context
  - JSONB columns for flexible metadata (`title.sales_metadata`)
  - Partial indexes for performance (`CREATE INDEX CONCURRENTLY`)
  - Generated columns for computed values (e.g., `total_line_price`)
- **Connection Pool:** `pg` driver with `pgBouncer` in transaction mode (100 connections)

**Drizzle ORM**
- **Why:** Type-safe SQL builder, native RLS support via `pgPolicy()`, best-in-class DX
- **Schema Patterns:**
  ```typescript
  export const titles = pgTable('titles', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    title: text('title').notNull(),
    ...tenantFields, // mixin for tenant_id, created_at, updated_at
  }, (table) => ({
    rlsPolicy: pgPolicy('titles_tenant_isolation', {
      for: 'all',
      to: 'authenticated',
      using: sql`tenant_id = current_setting('app.current_tenant_id')::uuid`,
    }),
  }))
  ```
- **Query Patterns:**
  - `db.select().from(titles).where(eq(titles.id, id))` - Type-safe queries
  - `withTenantContext(tenantId, async () => { ... })` - Automatic RLS context

**shadcn/ui + Tailwind CSS 4**
- **Why:** Copy-paste components (full ownership), WCAG AA accessible, customizable with Tailwind
- **Publishing Ink Theme:**
  ```typescript
  colors: {
    brand: {
      deep: '#1e3a8a',    // Navy blue (primary)
      warm: '#d97706',     // Amber (accents)
      neutral: '#64748b',  // Slate (text)
      success: '#059669',  // Emerald (positive)
      error: '#dc2626',    // Red (alerts)
    }
  }
  ```
- **Custom Components:** All in `src/components/ui/` (Button, Dialog, Table, Form, etc.)
- **Desktop-First:** Base styles for 1920x1080, responsive down to tablet (1024px) and mobile (375px)

**Clerk**
- **Why:** Organizations = tenants, custom roles, OAuth providers, webhook syncing
- **Multi-Tenant Mapping:**
  - Clerk Organization ID = Salina Tenant ID (1:1)
  - Organization membership = user-tenant association
  - Custom roles stored in Clerk metadata: `user.publicMetadata.roles`
- **8 Custom Roles:**
  1. `publisher_owner` (full access)
  2. `managing_editor` (titles, contributors, production)
  3. `production_staff` (titles, files, production tasks)
  4. `sales_marketing` (customers, orders, reports - no costs)
  5. `warehouse_operations` (inventory, fulfillment, shipping)
  6. `accounting` (financials, exports, reports)
  7. `author` (view own titles, royalties)
  8. `illustrator` (view own titles, royalties)
- **Middleware Pattern:**
  ```typescript
  export default clerkMiddleware((auth, req) => {
    const { userId, orgId } = auth()
    if (orgId) setTenantContext(orgId) // Sets app.current_tenant_id
  })
  ```

**TanStack Query 5**
- **Why:** Server state caching, optimistic updates, automatic refetching, devtools
- **Query Key Pattern:** `['tenant', tenantId, 'titles', filters]` - Tenant-scoped keys
- **Mutation Pattern:**
  ```typescript
  const mutation = useMutation({
    mutationFn: createTitle,
    onSuccess: () => queryClient.invalidateQueries(['tenant', tenantId, 'titles'])
  })
  ```
- **Real-Time Integration:** Ably messages trigger `queryClient.invalidateQueries()`

**React Hook Form 7 + Zod 3**
- **Why:** Validation shared between client/server, minimal re-renders, excellent UX
- **Validation Pattern:**
  ```typescript
  // src/validators/title.ts
  export const titleSchema = z.object({
    title: z.string().min(1, 'Title required'),
    isbn: z.string().regex(/^978-\d-\d{6}-\d{2}-\d$/, 'Invalid ISBN'),
  })

  // Client (React Hook Form)
  const form = useForm({ resolver: zodResolver(titleSchema) })

  // Server (Server Action)
  const validated = titleSchema.parse(formData) // Throws if invalid
  ```

**Ably**
- **Why:** WebSocket-based real-time, usage-based pricing, built-in tenant isolation via channels
- **Channel Pattern:** `tenant_{tenantId}_inventory`, `tenant_{tenantId}_orders`
- **Use Cases:**
  - Inventory updates: Publish on order fulfillment, subscribe in dashboard/inventory views
  - Order status: Publish on status change, subscribe in order lists
  - Dashboard KPIs: Publish on sales/returns, subscribe in dashboard widgets
- **Client Pattern:**
  ```typescript
  const channel = ably.channels.get(`tenant_${tenantId}_inventory`)
  channel.subscribe('update', (message) => {
    queryClient.invalidateQueries(['tenant', tenantId, 'inventory'])
  })
  ```

**Inngest**
- **Why:** Event-driven background jobs, automatic retries, visual monitoring, no infrastructure management
- **Job Patterns:**
  - `shopify-webhook.ts` - Process Shopify order webhooks (retries on failure)
  - `quickbooks-export.ts` - Generate QB export files (scheduled daily)
  - `easypost-tracking.ts` - Fetch tracking updates (scheduled hourly)
  - `email-notifications.ts` - Send user invites, order confirmations
  - `low-isbn-alert.ts` - Alert when ISBN block < 5 remaining
- **Event Pattern:**
  ```typescript
  // Trigger job
  await inngest.send({ name: 'shopify/order.created', data: { orderId } })

  // Job definition
  inngest.createFunction(
    { id: 'process-shopify-order', retries: 3 },
    { event: 'shopify/order.created' },
    async ({ event }) => { /* process order */ }
  )
  ```

**Hono 4**
- **Why:** Fast, lightweight, excellent middleware ecosystem, native Web Standards
- **Use Cases:** Webhooks, future public API (Server Actions handle internal app)
- **Route Pattern:**
  ```typescript
  // hono/routes/webhooks/shopify.ts
  app.post('/webhooks/shopify',
    rateLimitMiddleware({ limit: 100, window: '1m' }),
    tenantAuthMiddleware,
    async (c) => {
      const payload = await c.req.json()
      await inngest.send({ name: 'shopify/order.created', data: payload })
      return c.json({ received: true })
    }
  )
  ```
- **Middleware Stack:** Auth → Tenant Context → Rate Limit → Validation → Handler → Error Handler

### Integration Points

**Clerk (Authentication & Organizations)**
- **Direction:** Bidirectional (Clerk → App via webhooks, App → Clerk via SDK)
- **Data Flow:**
  - User signs up → Clerk creates user → Webhook to `/api/webhooks/clerk` → Create `users` record
  - User creates org → Clerk creates org → Webhook → Create `tenants` record
  - User updates profile → Clerk webhook → Update `users` record
- **Security:** Webhook signature verification via `@clerk/clerk-sdk-node`

**Shopify (E-commerce Platform)**
- **Direction:** Bidirectional (orders from Shopify, inventory to Shopify)
- **Data Flow:**
  - Customer places order on Shopify → Webhook to `/webhooks/shopify` → Inngest job → Create `orders` + `order_line_items`
  - Order fulfilled in Salina → Update Shopify order status via API
  - Inventory updated in Salina → Push to Shopify via Inventory API
- **Authentication:** OAuth 2.0 with refresh tokens stored encrypted in `integration_configs`
- **Rate Limiting:** Shopify allows 2 req/sec, use Bottleneck library for throttling

**QuickBooks (Accounting)**
- **Direction:** Unidirectional (Salina → QuickBooks via file export)
- **Data Flow:**
  - Scheduled job (daily/weekly) → Generate IIF/CSV files → Upload to S3 → Email link to user
  - Files include: Sales invoices, COGS journal entries, inventory adjustments
- **Mapping:** `account_mappings` table maps Salina accounts to QB chart of accounts
- **Format:** IIF (QuickBooks Desktop) or CSV (QuickBooks Online)

**EasyPost (Shipping)**
- **Direction:** Bidirectional (rate quotes and label generation)
- **Data Flow:**
  - User creates shipment → Call EasyPost `/rates` → Display options
  - User selects rate → Call EasyPost `/shipments` → Get label PDF and tracking
  - Scheduled job (hourly) → Call EasyPost `/trackers` → Update shipment status
- **Authentication:** API key stored encrypted in `integration_configs`
- **Webhook:** EasyPost tracking updates → `/webhooks/easypost` → Inngest job → Update shipment status

**AWS S3 + CloudFront (File Storage & CDN)**
- **Direction:** Unidirectional (App → S3)
- **Data Flow:**
  - User uploads cover image → Presigned POST to S3 → Store URL in `titles.cover_url`
  - User uploads PDF → Presigned POST to S3 → Store URL in `titles.interior_pdf_url`
  - Files served via CloudFront CDN with signed URLs (1-hour expiry)
- **Bucket Structure:**
  - `{bucket}/tenants/{tenantId}/covers/{titleId}.jpg`
  - `{bucket}/tenants/{tenantId}/pdfs/{titleId}.pdf`
  - `{bucket}/tenants/{tenantId}/marketing/{fileId}.{ext}`
- **Security:** Presigned URLs with 15-min upload window, CloudFront signed URLs for downloads

**Upstash Redis (Rate Limiting & Caching)**
- **Direction:** Unidirectional (App → Redis)
- **Use Cases:**
  - Rate limiting: Sliding window counters per tenant/IP
  - Session cache: Tenant context, user permissions (5-min TTL)
  - Hot data cache: Dashboard KPIs (1-min TTL)
- **Key Patterns:**
  - `ratelimit:tenant:{id}:{endpoint}` - Rate limit counters
  - `cache:tenant:{id}:dashboard` - Dashboard data
  - `session:{userId}:permissions` - User permission cache

**Sentry (Error Tracking)**
- **Direction:** Unidirectional (App → Sentry)
- **Data Flow:**
  - Client error → Sentry browser SDK → Error report with user context
  - Server error → Sentry Node SDK → Error report with request context
  - Performance monitoring → Transaction traces for slow queries/requests
- **Privacy:** Never send PII (use `beforeSend` to scrub sensitive fields)
- **Context:** Always include `tenantId`, `userId`, `requestId` in error context

## Novel Pattern Designs

These patterns solve publishing-specific challenges that are unique to this domain:

### Pattern 1: ISBN Block Generation with Modulo 10 Check Digit

**Problem:** Publishers purchase ISBN prefixes (978-1-234567) and must generate the full 100-ISBN range (00-99) with mathematically valid check digits. The check digit uses the Modulo 10 algorithm which alternates weights of 1 and 3.

**Solution:**
```typescript
// lib/isbn.ts
export function calculateISBN13CheckDigit(prefix: string): string {
  // prefix = "978-1-234567-42" (12 digits without check digit)
  const digits = prefix.replace(/-/g, '').split('').map(Number)

  // Multiply each digit by 1 or 3 alternating
  const sum = digits.reduce((acc, digit, idx) => {
    return acc + digit * (idx % 2 === 0 ? 1 : 3)
  }, 0)

  // Check digit = 10 - (sum % 10), unless that equals 10, then 0
  const checkDigit = (10 - (sum % 10)) % 10
  return checkDigit.toString()
}

export async function generateISBNBlock(prefix: string) {
  // prefix = "978-1-234567"
  const isbns = []

  for (let i = 0; i < 100; i++) {
    const sequence = i.toString().padStart(2, '0') // "00" to "99"
    const withoutCheck = `${prefix}-${sequence}` // "978-1-234567-42"
    const checkDigit = calculateISBN13CheckDigit(withoutCheck)
    const fullISBN = `${withoutCheck}-${checkDigit}` // "978-1-234567-42-7"

    isbns.push({
      isbn: fullISBN,
      prefix,
      sequence,
      checkDigit,
      status: 'available',
    })
  }

  // Insert all 100 ISBNs into global isbns table (no RLS)
  await db.insert(isbns).values(isbns)
}
```

**Key Architectural Decision:** The `isbns` table has NO Row-Level Security policy. This allows the uniqueness constraint to work globally across all tenants while the `isbn_blocks` table (which has RLS) tracks which tenant owns which block.

**Database Schema:**
```typescript
// db/schema/isbns.ts - NO RLS POLICY
export const isbns = pgTable('isbns', {
  isbn: varchar('isbn', { length: 17 }).primaryKey(), // Global uniqueness
  prefix: varchar('prefix', { length: 13 }).notNull(),
  blockId: uuid('block_id').references(() => isbnBlocks.id),
  assignedToTenantId: uuid('assigned_to_tenant_id'), // Which tenant owns this
  assignedToTitleId: uuid('assigned_to_title_id').references(() => titles.id),
  status: varchar('status').notNull(), // 'available' | 'reserved' | 'assigned'
  createdAt: timestamp('created_at').defaultNow(),
})

// db/schema/isbn-blocks.ts - HAS RLS POLICY
export const isbnBlocks = pgTable('isbn_blocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(), // RLS enforced
  prefix: varchar('prefix', { length: 13 }).notNull(),
  totalCount: integer('total_count').default(100),
  usedCount: integer('used_count').default(0),
  ...tenantFields,
}, (table) => ({
  rlsPolicy: pgPolicy('isbn_blocks_tenant_isolation', { /* ... */ }),
}))
```

### Pattern 2: Multi-Format Title Management with Shared Metadata

**Problem:** A single title (e.g., "The Great Adventure") can have multiple formats (hardcover, paperback, ebook, audiobook). Each format needs its own ISBN, price, and inventory, but shares core metadata (title, description, contributors, cover art).

**Solution:** Parent-child relationship with shared metadata pattern.

**Database Schema:**
```typescript
// db/schema/titles.ts
export const titles = pgTable('titles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  title: text('title').notNull(), // Shared
  subtitle: text('subtitle'),
  description: text('description'), // Shared
  coverUrl: text('cover_url'), // Shared
  publicationDate: date('publication_date'),
  status: varchar('status'), // forthcoming, active, out-of-print
  salesMetadata: jsonb('sales_metadata'), // keywords, target audience
  ...tenantFields,
})

// db/schema/formats.ts
export const formats = pgTable('formats', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  titleId: uuid('title_id').references(() => titles.id).notNull(),
  formatType: varchar('format_type').notNull(), // hardcover, paperback, ebook
  isbn: varchar('isbn', { length: 17 }).unique(), // Unique per format
  sku: varchar('sku').notNull(), // For inventory tracking
  retailPrice: numeric('retail_price', { precision: 10, scale: 2 }),
  wholesalePrice: numeric('wholesale_price', { precision: 10, scale: 2 }),
  unitCost: numeric('unit_cost', { precision: 10, scale: 2 }), // Moving average
  dimensions: jsonb('dimensions'), // { width, height, depth, weight }
  ...tenantFields,
})
```

**Component Pattern:**
```tsx
// components/titles/TitleFormatManager.tsx
export function TitleFormatManager({ titleId }: { titleId: string }) {
  const { data: title } = useQuery(['titles', titleId])
  const { data: formats } = useQuery(['titles', titleId, 'formats'])

  return (
    <div>
      {/* Shared metadata section */}
      <TitleMetadataCard title={title} />

      {/* Per-format sections */}
      {formats.map(format => (
        <FormatCard
          key={format.id}
          format={format}
          sharedCover={title.coverUrl}
        />
      ))}

      <Button onClick={() => openAddFormatModal(titleId)}>
        Add New Format
      </Button>
    </div>
  )
}
```

**Query Pattern:**
```typescript
// Get title with all formats in one query
const titleWithFormats = await db
  .select()
  .from(titles)
  .leftJoin(formats, eq(formats.titleId, titles.id))
  .where(eq(titles.id, titleId))
```

### Pattern 3: Shopify Order Pipeline with Inventory Hold

**Problem:** When a Shopify order arrives, we need to: (1) Verify inventory is available, (2) Hold inventory so it's not double-sold, (3) Create order record, (4) Handle failure gracefully if inventory is insufficient.

**Solution:** Transactional pipeline with inventory reservation using Inngest for reliability.

**Flow:**
```
Shopify Order Created
  ↓
Webhook → /webhooks/shopify (Hono)
  ↓
Verify signature, enqueue Inngest job
  ↓
Inngest: shopify/order.created
  ↓
[Step 1] Validate order data
  ↓
[Step 2] Check inventory availability (SELECT FOR UPDATE)
  ↓
[Step 3] Reserve inventory (create pending order)
  ↓
[Step 4] Create order + line items in transaction
  ↓
[Step 5] Notify warehouse (Ably publish)
  ↓
[Step 6] Update Shopify with confirmation
```

**Implementation:**
```typescript
// inngest/functions/shopify-webhook.ts
export const processShopifyOrder = inngest.createFunction(
  { id: 'process-shopify-order', retries: 3 },
  { event: 'shopify/order.created' },
  async ({ event, step }) => {
    const { tenantId, shopifyOrderId, lineItems } = event.data

    // Step 1: Validate
    await step.run('validate-order', async () => {
      return validateShopifyOrder(event.data)
    })

    // Step 2: Check inventory (in transaction with row lock)
    const inventoryCheck = await step.run('check-inventory', async () => {
      return await withTenantContext(tenantId, async () => {
        return await db.transaction(async (tx) => {
          for (const item of lineItems) {
            const inv = await tx
              .select()
              .from(inventory)
              .where(eq(inventory.sku, item.sku))
              .for('update') // Row-level lock
              .limit(1)

            if (!inv[0] || inv[0].quantity < item.quantity) {
              throw new InsufficientInventoryError(item.sku)
            }
          }
          return { success: true }
        })
      })
    })

    // Step 3: Create order (atomic)
    const order = await step.run('create-order', async () => {
      return await withTenantContext(tenantId, async () => {
        return await db.transaction(async (tx) => {
          const order = await tx.insert(orders).values({
            tenantId,
            externalOrderId: shopifyOrderId,
            source: 'shopify',
            status: 'pending_fulfillment',
          }).returning()

          await tx.insert(orderLineItems).values(
            lineItems.map(item => ({
              orderId: order[0].id,
              sku: item.sku,
              quantity: item.quantity,
              unitPrice: item.price,
            }))
          )

          return order[0]
        })
      })
    })

    // Step 4: Notify warehouse
    await step.run('notify-warehouse', async () => {
      const channel = ably.channels.get(`tenant_${tenantId}_orders`)
      await channel.publish('new_order', { orderId: order.id })
    })

    // Step 5: Confirm to Shopify
    await step.run('confirm-to-shopify', async () => {
      await shopifyAPI.updateOrder(shopifyOrderId, {
        note: `Imported to Salina ERP: ${order.id}`,
      })
    })

    return { orderId: order.id }
  }
)
```

**Error Handling:**
- If inventory check fails → Send Inngest event to notify sales team, update Shopify with "out of stock" tag
- If order creation fails → Inngest automatically retries (3 times with exponential backoff)
- If Shopify confirmation fails → Log error to Sentry but don't fail the job (order still created)

### Pattern 4: Real-Time Inventory Updates with Optimistic UI

**Problem:** When an order is fulfilled, inventory must update immediately in the database, propagate to Shopify, and reflect in real-time across all connected browser sessions (dashboard, inventory page, order page).

**Solution:** Optimistic UI with Ably pub/sub for multi-tab consistency.

**Flow:**
```
User clicks "Fulfill Order"
  ↓
Client: Optimistic update (TanStack Query)
  ↓
Server Action: fulfillOrder()
  ↓
[Transaction] Deduct inventory + Mark order shipped
  ↓
Publish to Ably: tenant_{id}_inventory
  ↓
All connected clients receive message
  ↓
Invalidate TanStack Query cache
  ↓
Refetch inventory + order data
```

**Implementation:**
```typescript
// src/actions/fulfillment.ts (Server Action)
export async function fulfillOrder(orderId: string) {
  const { userId, orgId } = auth()

  return await withTenantContext(orgId, async () => {
    const result = await db.transaction(async (tx) => {
      // Mark order as shipped
      const order = await tx
        .update(orders)
        .set({ status: 'shipped', shippedAt: new Date() })
        .where(eq(orders.id, orderId))
        .returning()

      // Get line items
      const items = await tx
        .select()
        .from(orderLineItems)
        .where(eq(orderLineItems.orderId, orderId))

      // Deduct inventory
      for (const item of items) {
        await tx
          .update(inventory)
          .set({ quantity: sql`quantity - ${item.quantity}` })
          .where(eq(inventory.sku, item.sku))

        // Record transaction
        await tx.insert(inventoryTransactions).values({
          tenantId: orgId,
          sku: item.sku,
          type: 'shipment',
          quantity: -item.quantity,
          orderId,
        })
      }

      return order[0]
    })

    // Publish real-time update to all connected clients
    const channel = ably.channels.get(`tenant_${orgId}_inventory`)
    await channel.publish('update', {
      type: 'order_fulfilled',
      orderId,
      skus: items.map(i => i.sku),
    })

    // Background job: Sync to Shopify
    await inngest.send({
      name: 'shopify/inventory.sync',
      data: { tenantId: orgId, skus: items.map(i => i.sku) },
    })

    return { success: true, data: result }
  })
}
```

**Client Pattern:**
```tsx
// components/orders/OrderFulfillmentPanel.tsx
export function OrderFulfillmentPanel({ order }: { order: Order }) {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = ably.channels.get(`tenant_${tenantId}_inventory`)

    channel.subscribe('update', (message) => {
      // Invalidate affected queries
      queryClient.invalidateQueries(['tenant', tenantId, 'inventory'])
      queryClient.invalidateQueries(['tenant', tenantId, 'orders'])
      queryClient.invalidateQueries(['tenant', tenantId, 'dashboard'])
    })

    return () => channel.unsubscribe()
  }, [tenantId])

  // Optimistic mutation
  const fulfillMutation = useMutation({
    mutationFn: fulfillOrder,
    onMutate: async (orderId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries(['orders', orderId])

      // Snapshot current value
      const previous = queryClient.getQueryData(['orders', orderId])

      // Optimistically update
      queryClient.setQueryData(['orders', orderId], (old: Order) => ({
        ...old,
        status: 'shipped',
      }))

      return { previous }
    },
    onError: (err, vars, context) => {
      // Rollback on error
      queryClient.setQueryData(['orders', vars], context.previous)
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries(['tenant', tenantId, 'orders'])
    },
  })

  return (
    <Button onClick={() => fulfillMutation.mutate(order.id)}>
      Fulfill Order
    </Button>
  )
}
```

**Why This Works:**
- Optimistic update gives instant feedback (< 50ms perceived latency)
- Server Action completes in transaction (~100-200ms)
- Ably broadcast reaches all clients (~50-100ms after server)
- If mutation fails, UI rolls back automatically
- Multiple tabs stay in sync via Ably pub/sub

## Implementation Patterns

These patterns ensure consistent implementation across all AI agents:

### Server Action Pattern

**All mutations MUST use Server Actions, NOT API routes.**

```typescript
// src/actions/titles.ts
'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { db, withTenantContext } from '@/db'
import { titles } from '@/db/schema'
import { titleSchema } from '@/validators/title'
import { AppError } from '@/lib/errors'
import { logger } from '@/lib/logger'

export async function createTitle(formData: FormData) {
  // 1. Authentication
  const { userId, orgId } = auth()
  if (!userId || !orgId) {
    throw new AppError('Unauthorized', 'UNAUTHORIZED', 401)
  }

  try {
    // 2. Validation
    const validated = titleSchema.parse({
      title: formData.get('title'),
      subtitle: formData.get('subtitle'),
      // ... other fields
    })

    // 3. Business logic (with tenant context)
    const result = await withTenantContext(orgId, async () => {
      return await db.insert(titles).values({
        tenantId: orgId,
        ...validated,
      }).returning()
    })

    // 4. Logging
    logger.info('Title created', {
      titleId: result[0].id,
      tenantId: orgId,
      userId,
    })

    // 5. Cache invalidation
    revalidatePath('/titles')

    // 6. Return success
    return { success: true, data: result[0] }
  } catch (error) {
    logger.error('Failed to create title', {
      error,
      tenantId: orgId,
      userId,
    })

    if (error instanceof AppError) {
      return { success: false, error: error.code, message: error.message }
    }

    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to create title',
    }
  }
}
```

**Return Type Pattern:**
```typescript
// Success
{ success: true, data: T }

// Error
{ success: false, error: string, message: string }
```

### Database Query Pattern

**ALWAYS use `withTenantContext()` wrapper for queries in tenant-scoped tables.**

```typescript
// ✅ CORRECT
import { withTenantContext } from '@/db/tenant-context'

const titles = await withTenantContext(tenantId, async () => {
  return await db.select().from(titles).limit(100)
})

// ❌ WRONG - No tenant context (RLS will fail)
const titles = await db.select().from(titles).limit(100)
```

**Exception:** Reference tables without RLS (e.g., `bisac_codes`, `isbns`) don't need context:
```typescript
// ✅ CORRECT - isbns table has no RLS
const isbn = await db.select().from(isbns).where(eq(isbns.isbn, isbnValue))
```

### Component Organization Pattern

**Server Components (default)** - Use for data fetching:
```tsx
// app/(dashboard)/titles/page.tsx
import { db, withTenantContext } from '@/db'
import { TitlesList } from '@/components/titles/TitlesList'

export default async function TitlesPage() {
  const { orgId } = auth()

  const titles = await withTenantContext(orgId, async () => {
    return await db.select().from(titles).limit(100)
  })

  return <TitlesList titles={titles} />
}
```

**Client Components** - Use only when needed (interactivity, hooks, state):
```tsx
// components/titles/TitlesList.tsx
'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'

export function TitlesList({ titles }: { titles: Title[] }) {
  const [search, setSearch] = useState('')

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {/* ... */}
    </div>
  )
}
```

### Form Validation Pattern

**Share Zod schemas between client and server.**

```typescript
// src/validators/title.ts
import { z } from 'zod'

export const titleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  subtitle: z.string().max(500).optional(),
  isbn: z.string().regex(/^978-\d-\d{6}-\d{2}-\d$/, 'Invalid ISBN-13'),
  publicationDate: z.coerce.date().optional(),
  retailPrice: z.coerce.number().positive().multipleOf(0.01),
})

export type TitleFormData = z.infer<typeof titleSchema>
```

**Client (React Hook Form):**
```tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { titleSchema } from '@/validators/title'

export function TitleForm() {
  const form = useForm({
    resolver: zodResolver(titleSchema),
    defaultValues: {
      title: '',
      subtitle: '',
      isbn: '',
    },
  })

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>
}
```

**Server (Server Action):**
```typescript
'use server'

import { titleSchema } from '@/validators/title'

export async function createTitle(formData: FormData) {
  const validated = titleSchema.parse(Object.fromEntries(formData))
  // ... rest of logic
}
```

### TanStack Query Pattern

**ALWAYS scope query keys by tenant.**

```typescript
// hooks/use-titles.ts
import { useQuery } from '@tanstack/react-query'
import { useTenant } from '@/hooks/use-tenant'

export function useTitles(filters?: TitleFilters) {
  const { tenantId } = useTenant()

  return useQuery({
    queryKey: ['tenant', tenantId, 'titles', filters],
    queryFn: async () => {
      const response = await fetch(`/api/titles?${new URLSearchParams(filters)}`)
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

**Mutation Pattern:**
```typescript
export function useCreateTitle() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()

  return useMutation({
    mutationFn: createTitle,
    onSuccess: (data) => {
      // Invalidate lists
      queryClient.invalidateQueries(['tenant', tenantId, 'titles'])

      // Update cache directly for new item
      queryClient.setQueryData(['tenant', tenantId, 'titles', data.id], data)
    },
  })
}
```

### Error Handling Pattern

**Use AppError classes for structured errors.**

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public meta?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, meta?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, meta)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND', 404, { resource, id })
    this.name = 'NotFoundError'
  }
}

export class InsufficientInventoryError extends AppError {
  constructor(sku: string, available: number, requested: number) {
    super(
      `Insufficient inventory for ${sku}. Available: ${available}, Requested: ${requested}`,
      'INSUFFICIENT_INVENTORY',
      400,
      { sku, available, requested }
    )
    this.name = 'InsufficientInventoryError'
  }
}
```

**Usage:**
```typescript
// Server Action
if (!title) {
  throw new NotFoundError('Title', titleId)
}

if (inventory.quantity < orderQuantity) {
  throw new InsufficientInventoryError(sku, inventory.quantity, orderQuantity)
}
```

**Global Error Boundary:**
```tsx
// app/error.tsx
'use client'

export default function ErrorBoundary({ error }: { error: Error }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div>
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
    </div>
  )
}
```

### Logging Pattern

**Use structured logging with Pino. NEVER log sensitive data.**

```typescript
// lib/logger.ts
import pino from 'pino'

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: {
    paths: [
      'password',
      'token',
      'apiKey',
      'creditCard',
      'ssn',
      '*.password',
      '*.token',
    ],
    remove: true,
  },
})
```

**Usage:**
```typescript
// ✅ CORRECT - Structured logging
logger.info('Order created', {
  orderId: order.id,
  tenantId: order.tenantId,
  userId,
  itemCount: order.items.length,
})

// ❌ WRONG - String logging (not queryable)
logger.info(`Order ${order.id} created by ${userId}`)

// ❌ WRONG - Sensitive data
logger.info('User login', {
  email: user.email,
  password: user.password, // NEVER log passwords
})
```

**Context Pattern:**
```typescript
// Add tenant/user context to all logs in a request
const childLogger = logger.child({
  tenantId: orgId,
  userId,
  requestId: req.headers.get('x-request-id'),
})

childLogger.info('Processing order')
```

## Consistency Rules

### Naming Conventions

**Files and Folders:**
- `kebab-case` for files and folders: `title-wizard.tsx`, `isbn-blocks.ts`
- React components: `PascalCase.tsx` - `TitleWizard.tsx`, `ISBNBlockVisualizer.tsx`
- Server Actions: `kebab-case.ts` - `titles.ts`, `isbn-blocks.ts`
- Database schemas: `kebab-case.ts` - `titles.ts`, `isbn-blocks.ts`

**Variables and Functions:**
- `camelCase` for variables and functions: `titleId`, `createTitle`, `calculateCheckDigit`
- Boolean variables: `is/has/can` prefix - `isActive`, `hasISBN`, `canEdit`
- Arrays: Plural nouns - `titles`, `formats`, `lineItems`

**React Hooks:**
- Custom hooks: `use` prefix - `useTitles`, `useTenant`, `usePermissions`
- Event handlers: `handle` prefix - `handleSubmit`, `handleDelete`, `handleISBNSelect`

**Database Tables:**
- Plural nouns: `titles`, `formats`, `orders`, `order_line_items`
- Join tables: `entity1_entity2` - `title_contributors`, `customer_pricing`
- Junction with metadata: Singular noun - `title_contributor` (has role, percentage)

**Database Columns:**
- `snake_case`: `tenant_id`, `created_at`, `retail_price`
- Foreign keys: `{table}_id` - `title_id`, `customer_id`, `order_id`
- Booleans: `is_` prefix - `is_active`, `is_published`
- Timestamps: `{action}_at` - `created_at`, `updated_at`, `shipped_at`, `deleted_at`

**Types and Interfaces:**
- `PascalCase` for types - `Title`, `Order`, `ISBNBlock`
- Input types: `{Entity}Input` - `TitleInput`, `OrderInput`
- Select types (from Drizzle): `{Entity}` - `Title = InferSelectModel<typeof titles>`
- Props: `{Component}Props` - `TitleWizardProps`, `ISBNPickerProps`

**Constants:**
- `SCREAMING_SNAKE_CASE` - `MAX_ISBN_BLOCKS`, `DEFAULT_PAGE_SIZE`
- Enums (if used): `PascalCase` with `SCREAMING_SNAKE_CASE` values

**API Routes (Hono):**
- RESTful conventions: `/api/webhooks/shopify`, `/api/webhooks/easypost`
- Kebab-case segments: `/api/isbn-blocks`, `/api/order-line-items`

### Code Organization

**Group by Feature, Not Type:**
```
✅ CORRECT
src/
  components/
    titles/
      TitleWizard.tsx
      TitleCard.tsx
      TitleFormatManager.tsx
    isbn/
      ISBNBlockVisualizer.tsx
      ISBNPicker.tsx

❌ WRONG
src/
  components/
    wizards/
      TitleWizard.tsx
    cards/
      TitleCard.tsx
    visualizers/
      ISBNBlockVisualizer.tsx
```

**Shared/Common vs. Feature-Specific:**
```
src/
  components/
    ui/              # shadcn/ui components (Button, Dialog, etc.)
    shared/          # Shared business components (DataTable, FileUpload)
    titles/          # Title-specific components
    orders/          # Order-specific components
```

**Server Actions Organization:**
```
src/actions/
  titles.ts        # createTitle, updateTitle, deleteTitle
  isbn-blocks.ts   # createISBNBlock, reserveISBN
  orders.ts        # createOrder, updateOrder, fulfillOrder
  inventory.ts     # adjustInventory, receiveInventory
```

**Database Schema Organization:**
```
db/schema/
  base.ts          # tenantFields mixin, common types
  tenants.ts       # Tenants table
  users.ts         # Users table (Clerk sync)
  titles.ts        # Titles table
  formats.ts       # Formats table
  isbn-blocks.ts   # ISBN blocks (with RLS)
  isbns.ts         # ISBNs (without RLS)
  index.ts         # Export all schemas
```

### Import Organization

**Order:**
1. External packages (React, Next.js, third-party)
2. Internal aliases (@/components, @/lib, @/db)
3. Relative imports (./components, ../utils)
4. Types (import type)

```typescript
// 1. External
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

// 2. Internal aliases
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'
import { db } from '@/db'

// 3. Relative
import { TitleCard } from './TitleCard'

// 4. Types
import type { Title } from '@/db/schema'
```

### Error Handling

**Client-Side (React):**
- Use Error Boundaries for catastrophic failures
- Show toast notifications for user-facing errors
- Log to Sentry for tracking

```tsx
// Client component
const mutation = useMutation({
  mutationFn: createTitle,
  onError: (error) => {
    toast.error(error.message)
    Sentry.captureException(error)
  },
})
```

**Server-Side (Server Actions):**
- Catch all errors and return structured response
- Log to Pino with context
- Never expose internal errors to client

```typescript
export async function createTitle(data: TitleInput) {
  try {
    // ... logic
    return { success: true, data: result }
  } catch (error) {
    logger.error('Failed to create title', { error, data })

    if (error instanceof AppError) {
      return { success: false, error: error.code, message: error.message }
    }

    // Generic error for unexpected failures
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    }
  }
}
```

**Inngest Jobs:**
- Use built-in retries (3 attempts with exponential backoff)
- Send failure events for manual intervention
- Never silently fail

```typescript
export const processOrder = inngest.createFunction(
  { id: 'process-order', retries: 3 },
  { event: 'order.created' },
  async ({ event, step }) => {
    try {
      // ... steps
    } catch (error) {
      // After 3 retries, send failure event
      await step.run('notify-failure', async () => {
        await inngest.send({
          name: 'order.processing.failed',
          data: { orderId: event.data.orderId, error: error.message },
        })
      })

      throw error // Re-throw to mark job as failed
    }
  }
)
```

### Logging Strategy

**Log Levels:**
- `debug`: Development-only, verbose details
- `info`: Normal operations (order created, user logged in)
- `warn`: Unexpected but handled (low inventory, rate limit approached)
- `error`: Errors requiring attention (failed mutations, integration errors)

**Always Include Context:**
```typescript
logger.info('Order fulfilled', {
  orderId: order.id,
  tenantId: order.tenantId,
  userId,
  itemCount: order.items.length,
  totalValue: order.total,
})
```

**Never Log:**
- Passwords or API keys
- Credit card numbers
- Personal identification numbers (SSN, passport)
- Full request/response bodies (may contain secrets)

**Query Logging (Development Only):**
```typescript
// drizzle.config.ts
export default {
  logger: process.env.NODE_ENV === 'development',
}
```

## Data Architecture

### Core Entity Relationships

```
tenants (1) ──→ (*) users
tenants (1) ──→ (*) isbn_blocks
tenants (1) ──→ (*) titles
tenants (1) ──→ (*) customers
tenants (1) ──→ (*) orders

titles (1) ──→ (*) formats
titles (*) ←──→ (*) contributors (via title_contributors)
formats (1) ──→ (*) inventory
formats (1) ──→ (*) order_line_items

isbn_blocks (1) ──→ (*) isbns (global table, no RLS)
isbns (*) ──→ (0..1) formats

orders (1) ──→ (*) order_line_items
orders (1) ──→ (0..1) shipment
orders (1) ──→ (*) returns
```

### Tenant Isolation Pattern

**All tenant-scoped tables inherit `tenantFields`:**
```typescript
// db/schema/base.ts
export const tenantFields = {
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}
```

**RLS Policy Template:**
```typescript
export const titles = pgTable('titles', {
  id: uuid('id').primaryKey().defaultRandom(),
  ...tenantFields,
  // ... other fields
}, (table) => ({
  rlsPolicy: pgPolicy('titles_tenant_isolation', {
    for: 'all',
    to: 'authenticated',
    using: sql`tenant_id = current_setting('app.current_tenant_id')::uuid`,
  }),
}))
```

### Key Tables

**Titles & Formats:**
```typescript
// Parent: Title (shared metadata)
export const titles = pgTable('titles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  description: text('description'),
  coverUrl: text('cover_url'),
  publicationDate: date('publication_date'),
  status: varchar('status', { length: 50 }), // forthcoming, active, out-of-print
  salesMetadata: jsonb('sales_metadata').$type<{
    keywords: string[]
    targetAudience: string
    marketingCopy: string
  }>(),
  ...tenantFields,
})

// Child: Format (per-format specifics)
export const formats = pgTable('formats', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  titleId: uuid('title_id').references(() => titles.id).notNull(),
  formatType: varchar('format_type', { length: 50 }).notNull(), // hardcover, paperback, ebook
  isbn: varchar('isbn', { length: 17 }).unique(),
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  retailPrice: numeric('retail_price', { precision: 10, scale: 2 }),
  wholesalePrice: numeric('wholesale_price', { precision: 10, scale: 2 }),
  printCost: numeric('print_cost', { precision: 10, scale: 2 }),
  movingAverageCost: numeric('moving_average_cost', { precision: 10, scale: 2 }),
  dimensions: jsonb('dimensions').$type<{
    width: number
    height: number
    depth: number
    weight: number
    unit: 'in' | 'cm'
  }>(),
  ...tenantFields,
})
```

**ISBN Management:**
```typescript
// Tenant-scoped blocks (with RLS)
export const isbnBlocks = pgTable('isbn_blocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  prefix: varchar('prefix', { length: 13 }).notNull(), // "978-1-234567"
  totalCount: integer('total_count').default(100),
  usedCount: integer('used_count').default(0),
  purchasedAt: timestamp('purchased_at').defaultNow(),
  ...tenantFields,
}, (table) => ({
  rlsPolicy: pgPolicy('isbn_blocks_tenant_isolation', { /* ... */ }),
}))

// Global ISBNs (NO RLS - for uniqueness check)
export const isbns = pgTable('isbns', {
  isbn: varchar('isbn', { length: 17 }).primaryKey(),
  prefix: varchar('prefix', { length: 13 }).notNull(),
  sequence: varchar('sequence', { length: 2 }).notNull(), // "00" to "99"
  checkDigit: varchar('check_digit', { length: 1 }).notNull(),
  blockId: uuid('block_id').references(() => isbnBlocks.id),
  assignedToTenantId: uuid('assigned_to_tenant_id'), // Ownership tracking
  assignedToFormatId: uuid('assigned_to_format_id').references(() => formats.id),
  status: varchar('status', { length: 20 }).notNull(), // available, reserved, assigned
  createdAt: timestamp('created_at').defaultNow(),
})
```

**Orders & Inventory:**
```typescript
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  customerId: uuid('customer_id').references(() => customers.id),
  orderNumber: varchar('order_number', { length: 50 }).notNull(),
  externalOrderId: varchar('external_order_id', { length: 100 }), // Shopify order ID
  source: varchar('source', { length: 50 }), // manual, shopify, website
  status: varchar('status', { length: 50 }).notNull(), // pending, pending_fulfillment, shipped, delivered, cancelled
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }),
  tax: numeric('tax', { precision: 10, scale: 2 }),
  shipping: numeric('shipping', { precision: 10, scale: 2 }),
  total: numeric('total', { precision: 10, scale: 2 }),
  shippedAt: timestamp('shipped_at'),
  ...tenantFields,
})

export const inventory = pgTable('inventory', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  formatId: uuid('format_id').references(() => formats.id).notNull(),
  sku: varchar('sku', { length: 100 }).notNull(),
  locationId: uuid('location_id').references(() => locations.id),
  quantity: integer('quantity').notNull().default(0),
  reorderThreshold: integer('reorder_threshold').default(10),
  ...tenantFields,
}, (table) => ({
  uniqueSku: unique().on(table.tenantId, table.sku, table.locationId),
}))
```

## API Contracts

### Server Action Contract

**Input:** FormData or typed object
**Output:** `{ success: true, data: T } | { success: false, error: string, message: string }`

**Example:**
```typescript
// Client call
const result = await createTitle(formData)

if (result.success) {
  console.log('Created:', result.data)
} else {
  console.error(result.error, result.message)
}

// Server implementation
export async function createTitle(formData: FormData) {
  try {
    // ... logic
    return { success: true, data: title }
  } catch (error) {
    return { success: false, error: 'CREATE_FAILED', message: error.message }
  }
}
```

### Hono API Routes (Webhooks)

**Shopify Webhook:**
```typescript
POST /api/webhooks/shopify
Headers:
  X-Shopify-Hmac-Sha256: <signature>
  X-Shopify-Shop-Domain: <shop>.myshopify.com
  X-Shopify-Topic: orders/create

Body (JSON):
{
  "id": 12345678,
  "line_items": [
    { "sku": "SKU-001", "quantity": 2, "price": "24.99" }
  ],
  // ... full Shopify order payload
}

Response:
200 OK { "received": true }
400 Bad Request { "error": "Invalid signature" }
```

**EasyPost Webhook:**
```typescript
POST /api/webhooks/easypost
Headers:
  X-EasyPost-Signature: <signature>

Body (JSON):
{
  "description": "tracker.updated",
  "result": {
    "id": "trk_123",
    "status": "delivered",
    "tracking_code": "1Z999AA10123456784"
  }
}

Response:
200 OK { "received": true }
```

## Security Architecture

### Authentication Flow

1. User visits app → Clerk middleware checks session
2. If authenticated → Extract `userId` and `orgId` from Clerk
3. Set tenant context → `app.current_tenant_id = orgId`
4. RLS policies enforce data isolation automatically

### Multi-Tenant Security

**Database Level:**
- RLS policies on all tenant-scoped tables
- Session variable `app.current_tenant_id` set by `withTenantContext()`
- Global uniqueness tables (`isbns`, `bisac_codes`) have NO RLS

**Application Level:**
- Clerk Organizations map 1:1 with tenants
- All Server Actions verify `auth().orgId` matches requested tenant
- No cross-tenant queries possible (RLS blocks at DB level)

### Authorization (RBAC)

**8 Roles with Field-Level Permissions:**

| Role | Can View | Can Edit | Cannot See |
|------|----------|----------|------------|
| Publisher/Owner | Everything | Everything | N/A |
| Managing Editor | Titles, Contributors, Production | Titles, Contributors | Costs, Financial Reports |
| Production Staff | Titles, Files, Production Tasks | Files, Production Tasks | Customer Data, Financials |
| Sales & Marketing | Customers, Orders, Titles | Customers, Orders | Unit Costs, Margins |
| Warehouse/Operations | Inventory, Orders, Shipments | Inventory, Fulfillment | Prices, Customer Details |
| Accounting | All Financial Data, Reports | Accounting Exports | Production Details |
| Author | Own Titles, Own Royalties | Own Profile | Other Titles, Other Authors |
| Illustrator | Own Titles, Own Royalties | Own Profile | Other Titles, Other Illustrators |

**Implementation:**
```typescript
// lib/permissions.ts
export function canEditTitle(role: string): boolean {
  return ['publisher_owner', 'managing_editor', 'production_staff'].includes(role)
}

export function canSeeCosts(role: string): boolean {
  return ['publisher_owner', 'accounting'].includes(role)
}

// Server Action
export async function updateTitle(titleId: string, data: TitleInput) {
  const { userId, orgId } = auth()
  const user = await getUser(userId)

  if (!canEditTitle(user.role)) {
    throw new AppError('Forbidden', 'FORBIDDEN', 403)
  }

  // ... rest of logic
}
```

### Data Encryption

**At Rest:**
- Database encrypted at rest (managed by hosting provider)
- Integration credentials stored in `integration_configs` table with `pgcrypto` encryption
- S3 bucket encryption enabled (AES-256)

**In Transit:**
- All traffic over HTTPS (TLS 1.3)
- Database connections use SSL
- API keys never sent to client (Server Actions only)

**Secrets Management:**
- Environment variables for sensitive config (never committed to git)
- Clerk webhook secrets verified on every webhook
- Shopify/EasyPost API keys stored encrypted in database

### OWASP Top 10 Mitigations

| Vulnerability | Mitigation |
|---------------|------------|
| Injection | Drizzle ORM parameterized queries, Zod validation |
| Broken Auth | Clerk handles all auth, session management |
| Sensitive Data Exposure | RLS policies, field-level permissions, Pino redaction |
| XML External Entities | N/A (no XML processing) |
| Broken Access Control | RLS + application-level RBAC |
| Security Misconfiguration | Strict TypeScript, ESLint security rules, CSP headers |
| XSS | React escapes by default, no `dangerouslySetInnerHTML` |
| Insecure Deserialization | Zod validation on all inputs |
| Using Components with Known Vulnerabilities | Dependabot alerts, monthly updates |
| Insufficient Logging & Monitoring | Pino structured logs, Sentry error tracking |

## Performance Considerations

### Database Optimization

**Indexes:**
```sql
-- Tenant + common query patterns
CREATE INDEX CONCURRENTLY idx_titles_tenant_status
  ON titles(tenant_id, status);

CREATE INDEX CONCURRENTLY idx_orders_tenant_status_created
  ON orders(tenant_id, status, created_at DESC);

-- Full-text search
CREATE INDEX CONCURRENTLY idx_titles_search
  ON titles USING gin(to_tsvector('english', title || ' ' || COALESCE(subtitle, '')));
```

**Query Optimization:**
- Use `select()` with specific columns, not `select().from()`
- Eager load relations with `leftJoin()` instead of N+1 queries
- Paginate all lists (default 100 items per page)
- Use `LIMIT` and `OFFSET` for pagination

**Connection Pooling:**
- pgBouncer in transaction mode (100 connections)
- Next.js edge functions reuse connections
- Close connections after transactions

### Caching Strategy

**Three Layers:**

1. **Client Cache (TanStack Query):**
   - 5-minute stale time for static data (titles, customers)
   - 1-minute stale time for dynamic data (inventory, dashboard)
   - Optimistic updates for mutations

2. **Server Cache (Next.js):**
   - `revalidatePath()` after mutations
   - `cache()` for expensive Server Component fetches
   - Edge caching for static assets

3. **Shared Cache (Redis):**
   - Dashboard KPIs (1-minute TTL)
   - User permissions (5-minute TTL)
   - Rate limit counters (sliding window)

### Real-Time Performance

**Ably Optimization:**
- Channel per tenant (`tenant_{id}_inventory`)
- Publish only deltas, not full datasets
- Client subscribes to relevant channels only
- Unsubscribe on component unmount

**Inventory Query (<500ms target):**
```typescript
// Fast inventory query with indexes
const inventory = await db
  .select({
    sku: inventory.sku,
    quantity: inventory.quantity,
    title: titles.title,
  })
  .from(inventory)
  .leftJoin(formats, eq(inventory.formatId, formats.id))
  .leftJoin(titles, eq(formats.titleId, titles.id))
  .where(and(
    eq(inventory.tenantId, tenantId),
    gt(inventory.quantity, 0)
  ))
  .orderBy(desc(inventory.quantity))
  .limit(100)
```

### Frontend Performance

**Code Splitting:**
- Route-based splitting (automatic with App Router)
- Dynamic imports for heavy components: `const Chart = dynamic(() => import('./Chart'))`
- Lazy load modals and wizards

**Image Optimization:**
- Next.js Image component for automatic optimization
- CloudFront CDN for cover images
- WebP format with JPEG fallback

**Bundle Size:**
- Tree-shaking enabled
- Minimize client components (prefer Server Components)
- Code split large dependencies (recharts, pdf generation)

## Deployment Architecture

### Docker Setup

**Dockerfile:**
```dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

**docker-compose.yml (Local Dev):**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: salina_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/salina_dev
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
```

### Deployment Targets

**Recommended: Railway / Fly.io / Render**
- Supports long-running processes (QuickBooks exports)
- No serverless timeout limits
- Built-in PostgreSQL and Redis
- Automatic deployments from GitHub
- Environment variable management
- Health checks and auto-restart

**Not Recommended: Vercel**
- 10-second serverless timeout (too short for QB exports)
- Cold starts add latency
- More expensive for high-traffic apps

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Integrations
SHOPIFY_CLIENT_ID=...
SHOPIFY_CLIENT_SECRET=...
EASYPOST_API_KEY=...
ABLY_API_KEY=...
INNGEST_SIGNING_KEY=...

# Storage
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=salina-erp-assets
AWS_CLOUDFRONT_DOMAIN=...

# Monitoring
SENTRY_DSN=...
NEXT_PUBLIC_SENTRY_DSN=...
```

## Development Environment

### Prerequisites

- **Node.js 20+** - LTS version for stability
- **PostgreSQL 16+** - Local instance or Docker
- **Redis 7+** - For rate limiting and caching
- **pnpm** (recommended) or npm - Package management
- **Git** - Version control

### Setup Commands

```bash
# 1. Clone repository
git clone <repo-url>
cd salina-erp

# 2. Install dependencies
pnpm install

# 3. Start local database (Docker)
docker-compose up -d postgres redis

# 4. Copy environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 5. Initialize database
pnpm db:generate    # Generate Drizzle migrations
pnpm db:migrate     # Run migrations
pnpm db:seed        # Seed reference data (BISAC codes, etc.)

# 6. Initialize shadcn/ui
npx shadcn@latest init

# 7. Start development server
pnpm dev

# Open http://localhost:3000
```

### Development Scripts

```json
{
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",

    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx scripts/seed.ts",

    "test": "vitest",
    "test:e2e": "playwright test",
    "test:coverage": "vitest --coverage"
  }
}
```

### VS Code Extensions

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Tailwind CSS IntelliSense** - Class name autocomplete
- **PostgreSQL** - SQL syntax highlighting
- **Drizzle ORM** - Schema autocomplete

## Architecture Decision Records (ADRs)

### ADR-001: Row-Level Security for Multi-Tenancy

**Status:** Accepted

**Context:** Need database-level tenant isolation with minimal application code complexity.

**Decision:** Use PostgreSQL Row-Level Security (RLS) policies instead of schema-per-tenant or database-per-tenant.

**Consequences:**
- ✅ Single schema simplifies migrations
- ✅ Database enforces isolation (not just app logic)
- ✅ Drizzle ORM has native RLS support
- ⚠️ Must ensure `app.current_tenant_id` is set for all queries
- ⚠️ Requires test coverage for RLS policy enforcement

### ADR-002: Hybrid API Architecture (Server Actions + Hono)

**Status:** Accepted

**Context:** Need efficient internal mutations and robust external webhook handling.

**Decision:** Use Next.js Server Actions for internal app mutations, Hono for external webhooks and public API.

**Consequences:**
- ✅ Server Actions reduce boilerplate for internal CRUD
- ✅ Hono provides better middleware for webhooks (rate limiting, signature verification)
- ✅ Clear separation of concerns
- ⚠️ Two different patterns to learn
- ⚠️ Cannot use Server Actions for external webhooks (need HTTP endpoints)

### ADR-003: Global ISBNs Table Without RLS

**Status:** Accepted

**Context:** ISBNs must be globally unique across all tenants, but RLS policies block cross-tenant queries.

**Decision:** Create separate `isbns` table without RLS for uniqueness enforcement, while `isbn_blocks` table (with RLS) tracks ownership.

**Consequences:**
- ✅ Uniqueness constraint works across all tenants
- ✅ Prevents ISBN collisions
- ⚠️ Two tables to manage (isbns + isbn_blocks)
- ⚠️ Developers must understand which table to query

### ADR-004: Ably for Real-Time Updates

**Status:** Accepted

**Context:** Need real-time inventory and order status updates across multiple browser tabs.

**Decision:** Use Ably (WebSockets) instead of polling or Server-Sent Events.

**Consequences:**
- ✅ True real-time updates with <100ms latency
- ✅ Usage-based pricing fits variable publisher traffic
- ✅ Built-in tenant isolation via channels
- ⚠️ Additional service dependency
- ⚠️ More complex than simple polling

### ADR-005: Docker Deployment (Not Vercel)

**Status:** Accepted

**Context:** QuickBooks exports can take 30-60 seconds, exceeding Vercel's 10-second timeout.

**Decision:** Deploy to Docker-based platforms (Railway, Fly.io, Render) instead of Vercel.

**Consequences:**
- ✅ No timeout limits for long-running operations
- ✅ More control over infrastructure
- ✅ Lower cost for high-traffic apps
- ⚠️ Requires Docker knowledge
- ⚠️ Manual SSL certificate management (vs. automatic on Vercel)

---

## Version Verification

All technology versions in the Decision Summary table were verified on **November 18, 2025** via WebSearch:

- **@clerk/nextjs:** 6.35.1 (verified via npm)
- **drizzle-orm:** 0.44.7 (verified via npm)
- **drizzle-kit:** 0.31.6 (verified via npm)
- **ably:** 2.14.0 (verified via npm)
- **inngest:** 3.45.1 (verified via npm)
- **@sentry/nextjs:** 10.25.0 (verified via npm)
- **vitest:** 4.0.8 (verified via npm)
- **@playwright/test:** 1.56.1 (verified via npm)
- **@upstash/redis:** 1.35.6 (verified via npm)
- **shadcn/ui:** CLI v2.x (components are copy-pasted into codebase, not versioned as dependencies)

**Note:** These are current stable versions as of the verification date. Future implementations should verify versions are still current or use compatible newer versions.

---

_Generated by BMAD Decision Architecture Workflow v1.0_
_Date: 2025-11-17_
_Updated: 2025-11-18 (version verification)_
_For: BMad_
