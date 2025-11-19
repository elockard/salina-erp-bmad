# Epic Technical Specification: Foundation & Multi-Tenant Setup

Date: 2025-11-18
Author: BMad
Epic ID: 1
Status: Draft

---

## Overview

Epic 1 establishes the foundational infrastructure for the Salina Bookshelf ERP platform. This epic creates the greenfield Next.js application with PostgreSQL database, implements Row-Level Security (RLS) for multi-tenant data isolation, integrates Clerk authentication for user and organization management, builds the tenant provisioning workflow, and sets up production deployment infrastructure.

This epic enables publishers to sign up for Salina ERP, have their isolated tenant automatically provisioned, and begin inviting team members. It delivers the complete multi-tenant SaaS foundation required by all subsequent features (titles, orders, inventory, etc.).

## Objectives and Scope

### In Scope

**Story 1.1: Initialize Next.js Project**
- Create Next.js 15 project with TypeScript 5, Tailwind CSS 4, App Router
- Initialize shadcn/ui component library with Publishing Ink theme
- Establish project structure (app/, components/, lib/, db/, etc.)

**Story 1.2: Set Up PostgreSQL Database**
- Configure PostgreSQL 16 with Drizzle ORM 0.44.7
- Create base schema patterns (tenantFields mixin)
- Set up connection pooling (pgBouncer, 100 connections)
- Local development environment (docker-compose for Postgres + Redis)

**Story 1.3: Implement RLS Infrastructure**
- Build `withTenantContext()` wrapper for automatic tenant isolation
- Define RLS policy template using Drizzle's `pgPolicy()`
- Create tenants table with RLS policy enforcement
- Write integration tests for RLS verification

**Story 1.4: Integrate Clerk Authentication**
- Install and configure Clerk 6.35.1
- Map Clerk Organizations 1:1 to Salina tenants
- Define 8 custom roles (Publisher/Owner, Managing Editor, Production Staff, Sales & Marketing, Warehouse/Operations, Accounting, Author, Illustrator)
- Set up auth middleware to extract orgId and set tenant context

**Story 1.5: Build Tenant Provisioning**
- Webhook handler for Clerk organization creation → tenant record creation
- Tenant settings page for branding, locale, timezone, currency configuration
- Feature flags table for tiered subscription plans (Starter, Professional, Enterprise)
- Data export functionality (complete tenant data dump as JSON/CSV)
- Usage metrics dashboard (titles, users, orders)

**Story 1.6: Set Up Deployment**
- Multi-stage Dockerfile for production builds
- docker-compose.yml for local development (Postgres, Redis, app)
- Environment variable configuration (.env.example)
- Deploy to Railway/Fly.io/Render (NOT Vercel - timeout limits for long-running jobs)
- Automated daily backups with 30-day point-in-time recovery

### Out of Scope

- User invitation workflows (Epic 2: User & Access Management)
- Role-based permission enforcement in UI (Epic 2)
- Audit trail system (Epic 2)
- Any feature-specific functionality (titles, orders, inventory - covered in Epics 3-10)
- Production monitoring and alerting (added incrementally in later epics)
- Performance optimization beyond basic connection pooling (Epic 10: Dashboards will add caching)

## System Architecture Alignment

Epic 1 implements the core architectural decisions defined in `docs/architecture.md`:

**Technology Stack (Architecture:52-79)**
- ✅ Next.js 15 with App Router, React Server Components, Server Actions
- ✅ TypeScript 5 with strict mode for type safety
- ✅ Tailwind CSS 4 + shadcn/ui (Radix UI primitives, WCAG AA accessible)
- ✅ PostgreSQL 16 for database with Row-Level Security support
- ✅ Drizzle ORM 0.44.7 + Drizzle Kit 0.31.6 for type-safe queries and migrations
- ✅ Clerk 6.35.1 for authentication with Organizations → Tenants mapping

**Multi-Tenant Architecture (Architecture:196-197, 1501-1527)**
- ✅ Row-Level Security (RLS) enforced at database layer
- ✅ `withTenantContext()` wrapper sets `app.current_tenant_id` session variable
- ✅ All tenant-scoped tables include `pgPolicy()` for RLS enforcement
- ✅ Clerk Organizations map 1:1 to Salina tenants

**Project Structure (Architecture:80-170)**
- ✅ Follows prescribed directory structure:
  - `src/app/` - Next.js App Router with (auth) and (dashboard) route groups
  - `src/components/` - UI components with shadcn/ui in components/ui/
  - `src/lib/` - Utilities (utils.ts, logger.ts, errors.ts, permissions.ts)
  - `db/` - Database client, tenant-context.ts, schema/, migrations/
  - `hono/` - API routes for webhooks
  - `tests/` - Unit, integration, E2E tests

**Deployment Architecture (Architecture:1896-1982)**
- ✅ Docker multi-stage build for optimized production images
- ✅ Railway/Fly.io/Render deployment (NOT Vercel due to timeout limits)
- ✅ PostgreSQL with pgBouncer connection pooling (100 connections)
- ✅ Automated backups with 30-day point-in-time recovery

**Constraints and Guardrails**
- All future tenant-scoped tables MUST use `withTenantContext()` wrapper
- All database schemas MUST include RLS policies via `pgPolicy()`
- All Server Actions MUST validate tenant context via Clerk auth()
- Publishing Ink theme colors MUST be used consistently (Architecture:263-272)

## Detailed Design

### Services and Modules

| Module | Responsibility | Key Files | Dependencies |
|--------|---------------|-----------|--------------|
| **Database Client** | PostgreSQL connection with Drizzle ORM | `db/index.ts` | drizzle-orm, pg driver |
| **Tenant Context** | RLS enforcement via session variables | `db/tenant-context.ts` | Database Client |
| **Base Schema** | Reusable schema patterns (tenantFields) | `db/schema/base.ts` | Drizzle ORM |
| **Tenants Schema** | Tenant records with RLS policies | `db/schema/tenants.ts` | Base Schema, Tenant Context |
| **Clerk Middleware** | Auth + tenant context extraction | `src/middleware.ts` | @clerk/nextjs, Tenant Context |
| **Clerk Webhook** | Organization sync → tenant creation | `app/api/webhooks/clerk/route.ts` | Hono, Tenants Schema |
| **Tenant Actions** | Server Actions for tenant management | `src/actions/tenants.ts` | Drizzle, Clerk, Tenants Schema |
| **Settings Pages** | Company settings UI | `app/(dashboard)/settings/company/page.tsx` | Tenant Actions, shadcn/ui |
| **Auth Pages** | Sign-in/sign-up flows | `app/(auth)/sign-in/[[...sign-in]]/page.tsx` | Clerk components |
| **Theme Config** | Publishing Ink colors + shadcn/ui | `tailwind.config.ts`, `components.json` | Tailwind CSS, shadcn CLI |
| **Deployment** | Docker build + environment config | `Dockerfile`, `docker-compose.yml`, `.env.example` | - |

### Data Models and Contracts

**tenantFields Mixin (db/schema/base.ts)**

Reusable schema fields for all tenant-scoped tables:

```typescript
export const tenantFields = {
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}
```

**tenants Table (db/schema/tenants.ts)**

Primary table for publisher organizations:

```typescript
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkOrgId: text('clerk_org_id').notNull().unique(), // Maps to Clerk Organization ID
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),

  // Branding (FR3)
  logoUrl: text('logo_url'),
  primaryColor: text('primary_color').default('#1e3a8a'), // Deep Ink Blue
  secondaryColor: text('secondary_color').default('#d97706'), // Warm Amber

  // Localization (FR4)
  timezone: text('timezone').default('America/New_York'),
  locale: text('locale').default('en-US'),
  currency: text('currency').default('USD'),
  measurementSystem: text('measurement_system').default('imperial'), // or 'metric'

  // Subscription (FR5)
  subscriptionTier: text('subscription_tier').default('starter'), // starter, professional, enterprise
  subscriptionStatus: text('subscription_status').default('active'), // active, trial, suspended, canceled
  trialEndsAt: timestamp('trial_ends_at'),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  rlsPolicy: pgPolicy('tenants_isolation', {
    for: 'all',
    to: 'authenticated',
    using: sql`id = current_setting('app.current_tenant_id')::uuid`,
  }),
}))
```

**tenant_features Table (db/schema/tenant-features.ts)**

Feature flags for tiered subscription plans (FR5):

```typescript
export const tenantFeatures = pgTable('tenant_features', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  featureName: text('feature_name').notNull(), // e.g., 'contracts_royalties', 'production_scheduling'
  enabled: boolean('enabled').default(false),
  ...tenantFields,
}, (table) => ({
  rlsPolicy: pgPolicy('tenant_features_isolation', {
    for: 'all',
    to: 'authenticated',
    using: sql`tenant_id = current_setting('app.current_tenant_id')::uuid`,
  }),
}))
```

**Type Definitions**

```typescript
// Inferred types from schema
export type Tenant = InferSelectModel<typeof tenants>
export type NewTenant = InferInsertModel<typeof tenants>
export type TenantFeature = InferSelectModel<typeof tenantFeatures>

// Subscription tiers
export type SubscriptionTier = 'starter' | 'professional' | 'enterprise'
export type SubscriptionStatus = 'active' | 'trial' | 'suspended' | 'canceled'
```

### APIs and Interfaces

**Server Actions (src/actions/tenants.ts)**

```typescript
// Get current tenant details
export async function getTenant(): Promise<ActionResult<Tenant>>

// Update tenant branding settings (FR3)
export async function updateTenantBranding(
  data: { logoUrl?: string; primaryColor?: string; secondaryColor?: string }
): Promise<ActionResult<Tenant>>

// Update tenant localization settings (FR4)
export async function updateTenantLocalization(
  data: { timezone?: string; locale?: string; currency?: string; measurementSystem?: string }
): Promise<ActionResult<Tenant>>

// Get tenant usage metrics (FR7)
export async function getTenantUsageMetrics(): Promise<ActionResult<{
  titleCount: number
  userCount: number
  orderCount: number
  subscriptionTier: SubscriptionTier
}>>

// Export complete tenant data (FR8)
export async function exportTenantData(
  format: 'json' | 'csv'
): Promise<ActionResult<{ downloadUrl: string }>>

// Toggle feature flag for tenant (FR5)
export async function toggleTenantFeature(
  featureName: string,
  enabled: boolean
): Promise<ActionResult<TenantFeature>>
```

**Clerk Webhook API (app/api/webhooks/clerk/route.ts)**

```typescript
// POST /api/webhooks/clerk
// Handles Clerk organization.created event → auto-provision tenant (FR1, FR2)
export async function POST(request: Request) {
  const payload = await request.json()
  const signature = request.headers.get('svix-signature')

  // Verify webhook signature
  // If event === 'organization.created':
  //   - Extract organization ID, name
  //   - Create tenant record in database
  //   - Set default branding and localization
  //   - Initialize feature flags based on subscription tier
  //   - Return 200 OK
}
```

**Middleware (src/middleware.ts)**

```typescript
export default clerkMiddleware((auth, req) => {
  const { userId, orgId } = auth()

  // Extract Clerk Organization ID
  if (orgId) {
    // Look up tenant record by clerkOrgId
    const tenant = await getTenantByClerkOrgId(orgId)

    // Set tenant context for RLS
    await setTenantContext(tenant.id)
  }

  return NextResponse.next()
})
```

**Type Definitions for Action Results**

```typescript
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: AppError }

export class AppError extends Error {
  code: string
  statusCode: number
  context?: Record<string, unknown>
}
```

### Workflows and Sequencing

**Tenant Provisioning Flow (FR1, FR2)**

```
User Signs Up → Creates Clerk Organization → Clerk Webhook Fires
    ↓
POST /api/webhooks/clerk
    ↓
Create tenant record in database
    ↓
Set default branding (Publishing Ink theme)
    ↓
Set default localization (en-US, America/New_York, USD, imperial)
    ↓
Initialize feature flags based on subscription tier
    ↓
Return 200 OK to Clerk
    ↓
User redirected to dashboard (tenant context established)
```

**Request Flow with RLS (Every Request)**

```
Client Request → Next.js Server → Clerk Middleware
    ↓
Extract userId and orgId from Clerk session
    ↓
Look up tenant by clerkOrgId
    ↓
Call withTenantContext(tenantId, async () => { ... })
    ↓
Set PostgreSQL session variable: app.current_tenant_id = tenantId
    ↓
Execute query (RLS automatically filters by tenant_id)
    ↓
Return results to client
```

**Story Execution Sequence (MUST BE SEQUENTIAL)**

Epic 1 stories MUST be executed in strict order due to dependencies:

```
Story 1.1: Initialize Next.js Project
    ↓ (provides: project structure, TypeScript, Tailwind)
Story 1.2: Set Up PostgreSQL Database
    ↓ (provides: database connection, Drizzle ORM, base schema)
Story 1.3: Implement RLS Infrastructure
    ↓ (provides: withTenantContext(), tenants table with RLS)
Story 1.4: Integrate Clerk Authentication
    ↓ (provides: auth middleware, orgId → tenantId mapping)
Story 1.5: Build Tenant Provisioning
    ↓ (provides: Clerk webhook, tenant settings page)
Story 1.6: Set Up Deployment Infrastructure
    ↓ (provides: Docker, deployment to Railway/Fly.io/Render)
```

**Critical Path:** All 6 stories must complete before any feature development (Epics 2-14) can begin.

## Non-Functional Requirements

### Performance

**Database Connection Pooling**
- pgBouncer in transaction mode with 100 max connections (Architecture:236)
- Prevents connection exhaustion under multi-tenant load
- Target: <100ms for tenant lookup queries

**Initial Page Load**
- Target: <2 seconds for authenticated page load (PRD success criteria)
- Next.js 15 Server Components for optimized initial rendering
- Streaming with Suspense for progressive page loading

**Story 1.1-1.6 Specific**
- No performance-critical operations in foundation epic
- Focus on correct implementation of RLS and auth patterns
- Performance optimization will be addressed in Epic 10 (Dashboards) with TanStack Query caching

### Security

**Multi-Tenant Data Isolation (CRITICAL)**
- Row-Level Security (RLS) enforced at PostgreSQL layer (Architecture:1501-1527)
- Every tenant-scoped table MUST include RLS policy via `pgPolicy()`
- `withTenantContext()` wrapper sets `app.current_tenant_id` session variable
- **Test Requirement:** Integration tests MUST verify RLS blocks cross-tenant access

**Authentication & Authorization**
- Clerk 6.35.1 for OAuth-based authentication
- Clerk Organizations map 1:1 to Salina tenants
- 8 custom roles defined in Clerk metadata (PRD:89)
- Middleware extracts orgId and establishes tenant context on every request

**Webhook Security**
- Clerk webhook signatures verified using Svix library
- Reject requests with invalid signatures (prevent spoofing)
- HTTPS-only in production

**Secrets Management**
- All API keys and secrets in environment variables (never committed to git)
- PostgreSQL connection strings use connection pooling tokens
- Clerk secret keys rotated per Clerk best practices

**Input Validation**
- Zod schemas for all Server Action inputs (implemented in Story 1.5 for tenant settings)
- TypeScript strict mode prevents type-related vulnerabilities

### Reliability/Availability

**Database Backups (FR9)**
- Automated daily backups of PostgreSQL database
- Point-in-time recovery enabled (30-day retention)
- Backup verification: monthly restore tests to staging environment

**Error Handling**
- `AppError` class with structured error codes (lib/errors.ts)
- Global error boundary in `app/error.tsx` catches React errors
- Server Action errors return discriminated union: `{ success: false, error: AppError }`

**Graceful Degradation**
- If Clerk is unavailable, show maintenance page (do NOT expose sensitive data)
- If database connection fails, retry with exponential backoff (3 retries, 1s/2s/4s)

**Deployment Strategy**
- Docker multi-stage build for consistent environments
- Railway/Fly.io/Render deployment (NOT Vercel due to timeout limits for future long-running jobs)
- Health check endpoint: `GET /api/health` returns 200 if database is reachable

### Observability

**Structured Logging (Pino)**
- All logs in JSON format with `tenantId` and `userId` in context
- **NEVER log sensitive data:** passwords, API keys, full credit card numbers, PII
- Log levels: ERROR (production alerts), WARN (potential issues), INFO (key events), DEBUG (dev only)

**Error Tracking (Sentry - Story 1.6)**
- Install Sentry 10.25.0 during deployment setup
- Capture all unhandled exceptions and Server Action errors
- Tag errors with `tenantId` for multi-tenant debugging
- Set up alert rules for critical errors (e.g., RLS policy failures)

**Logs to Capture in Epic 1**
- Tenant provisioning events (org created, tenant record created)
- Authentication events (successful login, failed login attempts)
- RLS policy violations (should never happen, critical alert)
- Webhook processing (Clerk org events received and processed)

**Metrics**
- Track tenant creation rate (monitor growth)
- Track authentication success/failure rates
- Database connection pool utilization (alert if >80%)

## Dependencies and Integrations

**NPM Dependencies (package.json)**

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.0.0",

    "@clerk/nextjs": "^6.35.1",

    "drizzle-orm": "^0.44.7",
    "postgres": "^3.4.0",

    "hono": "^4.0.0",

    "@radix-ui/react-slot": "^1.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "tailwindcss-animate": "^1.0.7",

    "zod": "^3.22.0",

    "pino": "^9.0.0",
    "pino-pretty": "^11.0.0",

    "@sentry/nextjs": "^10.25.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.31.6",

    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",

    "tailwindcss": "^4.0.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",

    "eslint": "^8.0.0",
    "eslint-config-next": "^15.0.0",
    "prettier": "^3.0.0",
    "prettier-plugin-tailwindcss": "^0.5.0",

    "vitest": "^4.0.8",
    "@vitest/ui": "^4.0.8",
    "playwright": "^1.56.1",
    "@playwright/test": "^1.56.1"
  }
}
```

**External Services**

| Service | Purpose | Version/Plan | Configuration | Epic 1 Integration |
|---------|---------|--------------|---------------|-------------------|
| **Clerk** | Authentication & Organizations | Standard plan | `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Story 1.4: Auth integration, Story 1.5: Webhook |
| **PostgreSQL** | Primary database | 16.x | `DATABASE_URL` | Story 1.2: Database setup |
| **pgBouncer** | Connection pooling | Latest | Configured with Postgres deployment | Story 1.2: Connection pooling |
| **Sentry** | Error tracking | Developer plan | `SENTRY_DSN`, `SENTRY_AUTH_TOKEN` | Story 1.6: Error monitoring |
| **Railway/Fly.io/Render** | Deployment platform | Pay-as-you-go | Platform-specific env vars | Story 1.6: Production deployment |
| **AWS S3** | File storage (future) | Standard | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Not in Epic 1 (Epic 4: Title assets) |

**Internal Dependencies**

- No internal dependencies (Epic 1 is the foundation for all other epics)
- All subsequent epics (2-14) depend on Epic 1 completion

**Build Tools**

- Node.js 20+ (LTS)
- pnpm 9+ (package manager)
- Docker 24+ (local development and deployment)
- Git (version control)

## Acceptance Criteria (Authoritative)

### AC-1: Next.js Project Initialization (Story 1.1)
**Given** the project repository exists
**When** I run `npx create-next-app@latest` with the specified options
**Then** the project is created with Next.js 15, TypeScript 5, Tailwind CSS 4, App Router, and src/ directory structure
**And** shadcn/ui is initialized with Publishing Ink theme
**And** the project structure follows the Architecture spec

### AC-2: Database Configuration (Story 1.2)
**Given** the Next.js project is initialized
**When** I install drizzle-orm, drizzle-kit, and pg driver
**Then** the database connection is configured in db/index.ts with connection pooling
**And** drizzle.config.ts is created with migration settings
**And** the base schema (tenantFields mixin) is created
**And** I can run `pnpm db:generate` and `pnpm db:migrate` successfully
**And** docker-compose.yml is created for local PostgreSQL and Redis

### AC-3: RLS Infrastructure Implementation (Story 1.3)
**Given** the database is configured with Drizzle
**When** I create the withTenantContext() wrapper function
**Then** it sets the `app.current_tenant_id` session variable before executing queries
**And** the RLS policy template is defined using Drizzle's pgPolicy()
**And** the tenants table is created with RLS policy for tenant_isolation
**And** test queries verify that RLS blocks cross-tenant access
**And** the pattern is documented for future schema definitions

### AC-4: Clerk Authentication Integration (Story 1.4)
**Given** the RLS infrastructure is in place
**When** I install @clerk/nextjs and configure environment variables
**Then** the Clerk middleware is set up in src/middleware.ts
**And** auth routes are created (`sign-in/[[...sign-in]]/page.tsx` and `sign-up`)
**And** Clerk Organizations are mapped 1:1 to Salina tenants
**And** the 8 custom roles are defined in Clerk metadata
**And** users can sign up, create an organization, and be assigned a role
**And** auth() helper provides userId and orgId in Server Actions

### AC-5: Tenant Provisioning Workflow (Story 1.5)
**Given** Clerk authentication is integrated
**When** a new user signs up and creates an organization
**Then** a tenant record is created in the tenants table with isolated schema
**And** the tenant settings page allows configuration of branding (logo, colors, email templates)
**And** the tenant can set timezone, locale, default currency, and measurement units
**And** tiered subscription plans are defined with feature flags
**And** the tenant can view usage metrics on settings page
**And** the tenant can export complete data dump (JSON/CSV) from settings page

### AC-6: Deployment Infrastructure Setup (Story 1.6)
**Given** the application is functional locally
**When** I create a Dockerfile following the multi-stage build pattern
**Then** the Docker image builds successfully and runs the application
**And** docker-compose.yml includes postgres, redis, and app services
**And** environment variables are configured in .env.example
**And** the application is deployed to Railway/Fly.io/Render
**And** automated daily backups are configured for PostgreSQL
**And** point-in-time recovery is enabled (restore to any point within 30 days)

## Traceability Mapping

| Acceptance Criteria | PRD FR | Spec Section | Database Tables | Server Actions | Components | Test Type |
|---------------------|--------|--------------|-----------------|----------------|------------|-----------|
| **AC-1** | Foundation | Detailed Design → Services | - | - | - | Unit (project structure) |
| **AC-2** | Foundation | Detailed Design → Data Models | base schema (tenantFields) | - | - | Integration (DB connection) |
| **AC-3** | FR2 | Detailed Design → Data Models | `tenants` (with RLS) | - | - | Integration (RLS enforcement) |
| **AC-4** | FR10-FR12 | Detailed Design → APIs | - | - | Auth routes | Integration (Clerk auth) |
| **AC-5** | FR1-FR8 | Detailed Design → APIs, Data Models | `tenants`, `tenant_features` | `src/actions/tenants.ts` | Settings pages | Integration + E2E |
| **AC-6** | FR9 | Deployment | - | - | - | E2E (deployment smoke test) |

**FR Coverage Summary:**
- FR1: Self-service tenant signup → AC-5 (Clerk org creation → tenant provisioning)
- FR2: Tenant provisioning → AC-3 (RLS), AC-5 (webhook handler)
- FR3: Branding customization → AC-5 (logo, colors in tenant settings)
- FR4: Timezone/locale/currency → AC-5 (tenant settings)
- FR5: Tiered subscription plans → AC-5 (feature flags table)
- FR6: NOT in Epic 1 (billing integration - future epic)
- FR7: Usage tracking → AC-5 (usage metrics dashboard)
- FR8: Data export → AC-5 (export tenant data)
- FR9: Automated backups → AC-6 (30-day point-in-time recovery)
- FR10-FR12: User authentication (partial) → AC-4 (Clerk integration, role structure)

## Risks, Assumptions, Open Questions

### Risks

**RISK-1: RLS Policy Misconfiguration**
- **Description:** Developer forgets to wrap queries in `withTenantContext()` or RLS policy has bug, leading to cross-tenant data exposure
- **Severity:** CRITICAL
- **Mitigation:**
  - Integration tests MUST verify RLS blocks cross-tenant access (tests/integration/rls.test.ts)
  - Code review checklist includes RLS pattern verification
  - Sprint 0 test infrastructure will create `tenantTest()` helper that auto-wraps tests
- **Owner:** Story 1.3 implementation

**RISK-2: Clerk Webhook Failure**
- **Description:** Clerk webhook fails or is delayed, preventing tenant provisioning
- **Severity:** HIGH
- **Mitigation:**
  - Implement retry logic with exponential backoff (3 retries)
  - Log all webhook events for debugging
  - Sentry alerts on webhook failures
  - Manual tenant creation endpoint as fallback
- **Owner:** Story 1.5 implementation

**RISK-3: Sequential Story Dependencies**
- **Description:** Epic 1 stories MUST execute sequentially (1.1 → 1.6), parallel execution will fail
- **Severity:** MEDIUM
- **Mitigation:**
  - Implementation Readiness report explicitly documents sequencing requirement
  - Sprint planning schedules Epic 1 stories sequentially
  - Each story documents explicit prerequisites
- **Owner:** Sprint planning

**RISK-4: Deployment Platform Selection**
- **Description:** Railway/Fly.io/Render selection may not meet all requirements
- **Severity:** LOW
- **Mitigation:**
  - Architecture explicitly avoids Vercel due to timeout limits
  - All three platforms (Railway/Fly.io/Render) support Docker and long-running processes
  - Start with one platform, migrate if needed (Docker provides portability)
- **Owner:** Story 1.6 implementation

### Assumptions

**ASSUMPTION-1:** Publishers will use Clerk's standard OAuth providers (Google, Microsoft) for sign-in
- **Validation:** Confirmed in PRD - Clerk handles OAuth integration

**ASSUMPTION-2:** PostgreSQL 16 with RLS is sufficient for multi-tenant isolation
- **Validation:** Confirmed in Architecture - RLS is industry-standard pattern for multi-tenancy

**ASSUMPTION-3:** 100-connection pgBouncer pool is sufficient for initial load
- **Validation:** Architecture specifies 100 connections, can be increased if needed

**ASSUMPTION-4:** Tenant data export (FR8) can be JSON/CSV only (no complex formats)
- **Validation:** PRD specifies data export for compliance, JSON/CSV meets requirement

### Open Questions

**QUESTION-1:** Which specific deployment platform should we use: Railway, Fly.io, or Render?
- **Answer Needed By:** Story 1.6 implementation
- **Decision Owner:** Tech Lead
- **Recommendation:** Start with Railway (simpler setup), Fly.io if more control needed

**QUESTION-2:** Should we implement billing integration (FR6) in Epic 1 or defer to post-MVP?
- **Answer Needed By:** Before Epic 1 starts
- **Decision Owner:** Product Owner
- **Current Status:** FR6 marked as out-of-scope for Epic 1, deferred to future epic

**QUESTION-3:** What should the trial period length be for new tenants?
- **Answer Needed By:** Story 1.5 (tenant provisioning)
- **Decision Owner:** Business stakeholder
- **Recommendation:** 14-day trial (industry standard for B2B SaaS)

## Test Strategy Summary

### Test Levels

**Unit Tests (Vitest)**
- ISBN Modulo 10 algorithm (Epic 3, not Epic 1)
- Permission helper functions (Epic 2, not Epic 1)
- Utility functions (lib/utils.ts, lib/logger.ts)
- **Epic 1 Focus:** Minimal unit tests (project structure validation only)

**Integration Tests (Vitest + Test DB)**
- **RLS Enforcement (CRITICAL for Epic 1):**
  - Test: Create two tenants, verify Tenant A cannot access Tenant B's data
  - Test: Verify `withTenantContext()` sets session variable correctly
  - Test: Verify queries without `withTenantContext()` return empty results (RLS blocks)

- **Database Connection:**
  - Test: Connection pool initializes correctly
  - Test: Migrations run successfully (`pnpm db:migrate`)
  - Test: Schema introspection returns expected tables

- **Clerk Webhook:**
  - Test: Valid webhook payload creates tenant record
  - Test: Invalid signature is rejected
  - Test: Duplicate org creation is idempotent

- **Tenant Actions:**
  - Test: `updateTenantBranding()` updates logo and colors
  - Test: `getTenantUsageMetrics()` returns correct counts
  - Test: `exportTenantData()` generates downloadable JSON/CSV

**End-to-End Tests (Playwright)**
- **AC-4: Sign-Up Flow:**
  - User visits /sign-up → creates account with Clerk → creates organization → redirected to dashboard
  - Verify tenant record exists in database
  - Verify user can access settings page

- **AC-5: Tenant Settings:**
  - User navigates to Settings > Company
  - Updates branding (logo upload, color picker)
  - Updates localization (timezone, locale, currency dropdowns)
  - Saves changes and verifies persistence

- **AC-6: Deployment Smoke Test:**
  - Application deploys successfully to Railway/Fly.io/Render
  - Health check endpoint returns 200
  - Can create account and sign in
  - Database connection is established

### Test Coverage Targets

- **Overall:** 80% code coverage (from Test Design document)
- **Epic 1 Specific:** Focus on integration tests for RLS enforcement (unit test coverage will be lower due to configuration-heavy code)

### Sprint 0 Test Infrastructure (Prerequisite)

From Implementation Readiness Report, Sprint 0 MUST complete before Epic 1:
- Test DB with RLS validation
- Vitest configuration
- `tenantTest()` helper utility for auto-wrapped RLS tests
- Playwright setup for E2E tests
- CI/CD pipeline (GitHub Actions)

### Test Data Strategy

- **Test Tenants:** Create 2+ test tenants for RLS isolation verification
- **Clerk Test Mode:** Use Clerk's test mode during development
- **Database:** Separate test database (never use production)
- **Cleanup:** Automated cleanup after test runs (truncate tables, delete test tenants)
