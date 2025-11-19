/**
 * Tenant Features Schema - Subscription Tier Feature Flags
 *
 * This table stores feature flags for each tenant based on their subscription tier.
 * It controls access to features and enforces usage limits (titles_limit, users_limit, etc.).
 *
 * @see Story 1.5: Build Tenant Provisioning Workflow (Task 2)
 * @see docs/architecture.md:76 for feature flags decision
 * @see docs/sprint-artifacts/1-5-build-tenant-provisioning-workflow.md:246-261
 */

import { pgTable, uuid, text, boolean, pgPolicy, unique } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { tenantFields } from './base'
import { tenants } from './tenants'

/**
 * tenantFeatures Table
 *
 * Stores feature flags and usage limits for each tenant based on subscription tier.
 *
 * **Subscription Tiers:**
 * - Starter: 50 titles, 5 users, 100 orders/month
 * - Professional: 500 titles, 25 users, 5,000 orders/month
 * - Enterprise: Unlimited
 *
 * **Feature Keys:**
 * - titles_limit: Maximum number of titles allowed
 * - users_limit: Maximum number of users allowed
 * - orders_per_month: Maximum orders per month
 *
 * **Row-Level Security:**
 * RLS policy ensures tenants can only see their own feature flags.
 *
 * **Usage Example:**
 * ```typescript
 * // Check if tenant can create more titles
 * const features = await withTenantContext(tenantId, async () => {
 *   return await db
 *     .select()
 *     .from(tenantFeatures)
 *     .where(eq(tenantFeatures.featureKey, 'titles_limit'))
 * })
 *
 * const limit = JSON.parse(features[0].metadata).limit
 * if (currentTitleCount >= limit) {
 *   throw new Error('Title limit reached')
 * }
 * ```
 */
export const tenantFeatures = pgTable(
  'tenant_features',
  {
    /**
     * Unique identifier for this feature flag record
     */
    id: uuid('id').primaryKey().defaultRandom(),

    /**
     * Foreign key to tenants table
     */
    tenantIdRef: uuid('tenant_id_ref')
      .notNull()
      .references(() => tenants.id),

    /**
     * Feature key (e.g., "titles_limit", "users_limit", "orders_per_month")
     */
    featureKey: text('feature_key').notNull(),

    /**
     * Whether this feature is enabled
     */
    enabled: boolean('enabled').notNull().default(true),

    /**
     * Metadata for this feature (JSONB)
     *
     * Stores feature-specific configuration like limits.
     *
     * Example:
     * ```json
     * {
     *   "limit": 50
     * }
     * ```
     */
    metadata: text('metadata'),

    /**
     * tenantFields mixin (REQUIRED for all tenant-scoped tables)
     *
     * Provides:
     * - tenantId: UUID reference to tenant
     * - createdAt: Timestamp when feature was created
     * - updatedAt: Timestamp when feature was last modified
     */
    ...tenantFields,
  },
  (table) => ({
    /**
     * Row-Level Security Policy: tenant_features_tenant_isolation
     *
     * Ensures tenants can only see their own feature flags.
     */
    rlsPolicy: pgPolicy('tenant_features_tenant_isolation', {
      for: 'all',
      to: 'authenticated',
      using: sql`
        CASE
          WHEN current_setting('app.current_tenant_id', true) = '' THEN false
          ELSE tenant_id = current_setting('app.current_tenant_id', true)::uuid
        END
      `,
    }),

    /**
     * Unique constraint: Each tenant can only have one record per feature key
     */
    uniqueFeature: unique().on(table.tenantId, table.featureKey),
  })
)

/**
 * Type Exports
 */

export type TenantFeature = typeof tenantFeatures.$inferSelect
export type NewTenantFeature = typeof tenantFeatures.$inferInsert
