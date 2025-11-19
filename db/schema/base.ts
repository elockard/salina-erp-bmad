/**
 * Base Schema Patterns for Salina ERP
 *
 * This file defines reusable schema patterns used across all database tables.
 * The tenantFields mixin ensures consistency in multi-tenant data isolation.
 */

import { timestamp, uuid } from 'drizzle-orm/pg-core'

/**
 * tenantFields Mixin
 *
 * Provides standard fields for all tenant-scoped tables:
 * - tenantId: Links record to a specific tenant for Row-Level Security (RLS)
 * - createdAt: Timestamp when record was created
 * - updatedAt: Timestamp when record was last modified
 *
 * Usage Pattern (from Architecture:1504-1510):
 * ```typescript
 * export const myTable = pgTable('my_table', {
 *   id: uuid('id').primaryKey().defaultRandom(),
 *   ...tenantFields,
 *   // ... other table-specific fields
 * }, (table) => ({
 *   rlsPolicy: pgPolicy('my_table_tenant_isolation', {
 *     for: 'all',
 *     to: 'authenticated',
 *     using: sql`tenant_id = current_setting('app.current_tenant_id')::uuid`,
 *   }),
 * }))
 * ```
 *
 * This pattern is critical for:
 * 1. Row-Level Security (RLS) enforcement in PostgreSQL
 * 2. Consistent audit trails across all tables
 * 3. Simplified schema definitions for future stories
 *
 * @see Story 1.3: Implement RLS Infrastructure (will use this mixin for tenants table)
 * @see docs/architecture.md:1504-1510 for detailed architecture decision
 */
export const tenantFields = {
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}

/**
 * TypeScript Type Helpers
 *
 * These types can be used to extract field types from the tenantFields mixin
 * for use in application code.
 */
export type TenantFields = typeof tenantFields
