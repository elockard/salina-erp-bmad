/**
 * Tenants Schema - Multi-Tenant Isolation Foundation
 *
 * This table stores tenant (publisher organization) records with Row-Level Security
 * (RLS) enforcement. Each tenant represents a separate publisher organization using
 * Salina ERP, and RLS ensures complete data isolation between tenants.
 *
 * @see Story 1.3: Implement RLS Infrastructure (AC2, AC3)
 * @see docs/architecture.md:1501-1527 for RLS pattern architecture
 * @see docs/sprint-artifacts/tech-spec-epic-1.md:137-173 for schema specification
 */

import { pgTable, uuid, text, timestamp, pgPolicy } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { tenantFields } from './base'

/**
 * tenants Table
 *
 * Stores publisher organizations that use Salina ERP. Each tenant is isolated
 * from all others via Row-Level Security policies.
 *
 * **RLS Pattern (REQUIRED for all tenant-scoped tables):**
 *
 * This table demonstrates the canonical RLS implementation pattern that MUST be
 * replicated for all future tenant-scoped tables (titles, customers, orders, etc.).
 *
 * Pattern Components:
 * 1. Include `tenantFields` mixin for tenantId, createdAt, updatedAt
 * 2. Define `pgPolicy()` in table callback with tenant_isolation naming
 * 3. Policy uses `current_setting('app.current_tenant_id')::uuid` for filtering
 * 4. All queries MUST use `withTenantContext()` wrapper to set session variable
 *
 * @example RLS Policy Template (Copy this pattern for new tables)
 * ```typescript
 * export const myTable = pgTable('my_table', {
 *   id: uuid('id').primaryKey().defaultRandom(),
 *   ...tenantFields,
 *   // ... other fields
 * }, (table) => ({
 *   rlsPolicy: pgPolicy('my_table_tenant_isolation', {
 *     for: 'all',
 *     to: 'authenticated',
 *     using: sql`tenant_id = current_setting('app.current_tenant_id')::uuid`,
 *   }),
 * }))
 * ```
 *
 * **Schema Fields:**
 * - id: Primary key (UUID)
 * - name: Organization display name (e.g., "Acme Publishing")
 * - clerkOrgId: Maps 1:1 with Clerk Organization ID (unique)
 * - status: Subscription status (active, trial, suspended)
 * - settings: JSONB for extensible configuration (onboarding state, feature flags)
 * - tenantId: Self-referential (tenant's own ID) for RLS consistency
 * - createdAt: Timestamp when tenant was provisioned
 * - updatedAt: Last modification timestamp
 *
 * **Usage Example:**
 * ```typescript
 * // Fetch tenant within RLS context
 * const tenant = await withTenantContext(tenantId, async () => {
 *   return await db.select().from(tenants).where(eq(tenants.id, tenantId))
 * })
 * ```
 *
 * **Important Notes:**
 * - `tenantId` is self-referential (tenant's own ID) for RLS consistency
 * - Global tables (isbns, bisac_codes) do NOT include tenantFields or RLS policies
 * - All tenant-scoped tables MUST follow this exact pattern
 */
export const tenants = pgTable(
  'tenants',
  {
    /**
     * Unique identifier for the tenant (UUID primary key)
     */
    id: uuid('id').primaryKey().defaultRandom(),

    /**
     * Display name for the organization (e.g., "Acme Publishing")
     */
    name: text('name').notNull(),

    /**
     * Clerk Organization ID (1:1 mapping)
     *
     * This field maps Salina tenants to Clerk Organizations. When a user creates
     * a Clerk organization, a webhook provisions a tenant record with this ID.
     *
     * **Uniqueness:** Must be unique to prevent duplicate tenant creation
     * **Nullable:** Initially null during manual tenant creation, set by Clerk webhook
     */
    clerkOrgId: text('clerk_org_id').unique(),

    /**
     * Subscription status for the tenant
     *
     * Values:
     * - 'active': Paid subscription, full access
     * - 'trial': Trial period, full access but time-limited
     * - 'suspended': Payment failed or manually suspended, read-only access
     *
     * Used for:
     * - Tiered subscription feature gating (Story 1.5)
     * - Billing enforcement (post-MVP)
     * - Usage analytics dashboards (Epic 10)
     */
    status: text('status').notNull().default('active'),

    /**
     * Extensible settings (JSONB)
     *
     * Stores tenant-specific configuration that doesn't warrant dedicated columns:
     * - Onboarding progress (wizard completion state)
     * - Feature flag overrides (beta features)
     * - Custom branding (logo URLs, color schemes) - Story 1.5
     * - Locale preferences (timezone, currency, measurement system) - Story 1.5
     *
     * Example:
     * ```json
     * {
     *   "onboarding": {
     *     "completedSteps": ["welcome", "team-invite"],
     *     "currentStep": "first-title"
     *   },
     *   "branding": {
     *     "logoUrl": "https://cdn.example.com/logo.png",
     *     "primaryColor": "#1e3a8a"
     *   },
     *   "locale": {
     *     "timezone": "America/New_York",
     *     "currency": "USD",
     *     "measurementSystem": "imperial"
     *   }
     * }
     * ```
     */
    settings: text('settings').default('{}'),

    /**
     * tenantFields mixin (REQUIRED for all tenant-scoped tables)
     *
     * Provides:
     * - tenantId: UUID reference to this tenant (self-referential)
     * - createdAt: Timestamp when tenant was created
     * - updatedAt: Timestamp when tenant was last modified
     *
     * **Note:** For tenants table, tenantId equals id (self-referential)
     * This maintains consistency with all other tenant-scoped tables.
     */
    ...tenantFields,
  },
  (table) => ({
    /**
     * Row-Level Security (RLS) Policy: tenants_tenant_isolation
     *
     * **CRITICAL: This pattern MUST be replicated for all tenant-scoped tables.**
     *
     * RLS Policy Configuration:
     * - Name: `tenants_tenant_isolation` (convention: {table}_tenant_isolation)
     * - For: 'all' (applies to SELECT, INSERT, UPDATE, DELETE)
     * - To: 'authenticated' (only authenticated database users)
     * - Using: Filters by `tenant_id = current_setting('app.current_tenant_id')::uuid`
     *
     * **How it works:**
     * 1. Application calls `withTenantContext(tenantId, callback)`
     * 2. withTenantContext sets PostgreSQL session variable: `SET LOCAL app.current_tenant_id`
     * 3. All queries within callback are automatically filtered by this RLS policy
     * 4. PostgreSQL enforces: only rows where `tenant_id = app.current_tenant_id` are visible
     * 5. Transaction completes, session variable auto-resets (no context leakage)
     *
     * **Security guarantee:**
     * Even if application code has a bug, PostgreSQL RLS prevents cross-tenant access.
     *
     * **Testing requirement:**
     * Integration tests MUST verify RLS blocks cross-tenant queries (see tests/integration/rls.test.ts)
     *
     * @see db/tenant-context.ts for withTenantContext() implementation
     * @see docs/architecture.md:1513-1526 for security model details
     */
    rlsPolicy: pgPolicy('tenants_tenant_isolation', {
      for: 'all',
      to: 'authenticated',
      using: sql`
        CASE
          WHEN current_setting('app.current_tenant_id', true) = '' THEN false
          ELSE tenant_id = current_setting('app.current_tenant_id', true)::uuid
        END
      `,
    }),
  })
)

/**
 * Type Exports (Drizzle ORM inference)
 */

/**
 * Tenant - Complete tenant record (SELECT)
 *
 * @example
 * ```typescript
 * const tenant: Tenant = await db.select().from(tenants).where(eq(tenants.id, id))
 * ```
 */
export type Tenant = typeof tenants.$inferSelect

/**
 * NewTenant - Data for creating a new tenant (INSERT)
 *
 * @example
 * ```typescript
 * const newTenant: NewTenant = {
 *   name: 'Acme Publishing',
 *   clerkOrgId: 'org_abc123',
 *   tenantId: uuid(), // Self-referential
 * }
 * await db.insert(tenants).values(newTenant)
 * ```
 */
export type NewTenant = typeof tenants.$inferInsert

/**
 * RLS Pattern Documentation Summary
 * ==================================
 *
 * This table demonstrates the complete RLS pattern that MUST be replicated
 * for all tenant-scoped tables in Salina ERP.
 *
 * **When to use RLS (tenant-scoped tables):**
 * - titles, formats (Epic 4)
 * - customers, customer_pricing (Epic 6)
 * - inventory, inventory_transactions (Epic 7)
 * - orders, order_line_items, shipments (Epic 8)
 * - contributors, title_contributors (Epic 5)
 * - contracts, royalty_statements (Epic 11)
 * - production_projects, production_tasks (Epic 12)
 *
 * **When NOT to use RLS (global tables):**
 * - isbns (global uniqueness, assigned_to_tenant_id tracks ownership)
 * - bisac_codes (reference data, shared across all tenants)
 * - system_config (application-level settings)
 *
 * **Checklist for adding a new tenant-scoped table:**
 * - [ ] Include `...tenantFields` in schema definition
 * - [ ] Add `pgPolicy('{table}_tenant_isolation', ...)` in table callback
 * - [ ] Use `withTenantContext()` wrapper for all queries
 * - [ ] Write integration tests verifying RLS blocks cross-tenant access
 * - [ ] Document usage examples in schema file
 *
 * @see Story 1.3: Implement RLS Infrastructure
 * @see Story 1.4: Integrate Clerk Authentication (uses clerkOrgId)
 * @see Story 1.5: Build Tenant Provisioning (provisions tenants via Clerk webhook)
 */
