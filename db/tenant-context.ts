/**
 * Tenant Context Management for Row-Level Security (RLS)
 *
 * This module provides the withTenantContext() wrapper function that establishes
 * PostgreSQL session variables for Row-Level Security enforcement. All tenant-scoped
 * database queries MUST be wrapped with this function to ensure proper data isolation.
 *
 * @see Story 1.3: Implement RLS Infrastructure (AC1)
 * @see docs/architecture.md:1501-1527 for RLS pattern architecture
 */

import { db } from './index'
import { sql, eq } from 'drizzle-orm'
import { tenants } from './schema'

/**
 * withTenantContext<T> Wrapper Function
 *
 * Sets the PostgreSQL session variable `app.current_tenant_id` before executing
 * queries, enabling Row-Level Security (RLS) policies to filter data by tenant.
 *
 * **CRITICAL: All tenant-scoped queries MUST use this wrapper.**
 *
 * The session variable is transaction-scoped (SET LOCAL) and automatically resets
 * after the transaction completes, preventing context leakage between requests.
 *
 * @template T - The return type of the callback function
 * @param tenantId - UUID of the tenant to set as current context
 * @param callback - Async function containing database operations to execute within tenant context
 * @returns Promise<T> - Result of the callback function
 * @throws Error if tenantId is invalid or callback execution fails
 *
 * @example Basic Usage
 * ```typescript
 * // Fetch titles for a specific tenant
 * const titles = await withTenantContext(tenantId, async () => {
 *   return await db.select().from(titles).limit(100)
 * })
 * ```
 *
 * @example Server Action Pattern
 * ```typescript
 * export async function getTitles() {
 *   const { orgId } = auth() // Get org ID from Clerk
 *   if (!orgId) throw new Error('Unauthorized')
 *
 *   return await withTenantContext(orgId, async () => {
 *     return await db.select().from(titles)
 *   })
 * }
 * ```
 *
 * @example Transaction with RLS
 * ```typescript
 * const result = await withTenantContext(tenantId, async () => {
 *   // Both queries within same transaction context
 *   const title = await db.insert(titles).values(data).returning()
 *   const format = await db.insert(formats).values({ titleId: title[0].id })
 *   return { title, format }
 * })
 * ```
 *
 * **Architecture Notes:**
 * - Uses Drizzle's transaction() method to ensure session variable is scoped
 * - SET LOCAL ensures variable only exists for this transaction (auto-cleanup)
 * - PostgreSQL RLS policies reference this variable: `current_setting('app.current_tenant_id')::uuid`
 * - If callback throws, transaction rolls back and session variable is cleared
 *
 * **When NOT to use this wrapper:**
 * - Global reference tables without RLS: `isbns`, `bisac_codes`, `system_config`
 * - System-level operations that don't belong to a tenant
 */
export async function withTenantContext<T>(
  tenantId: string,
  callback: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<T>
): Promise<T> {
  // Validation: Ensure tenantId is provided
  if (!tenantId || typeof tenantId !== 'string') {
    throw new Error('withTenantContext: tenantId must be a non-empty string')
  }

  // Validation: Basic UUID format check (prevents injection attacks)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(tenantId)) {
    throw new Error(`withTenantContext: Invalid tenantId format: ${tenantId}`)
  }

  try {
    // Execute callback within a transaction with SET LOCAL for RLS
    const result = await db.transaction(async (tx) => {
      // Set role to 'authenticated' for RLS enforcement
      // RLS policies only apply to non-superuser roles
      await tx.execute(sql.raw(`SET LOCAL ROLE authenticated`))

      // Set tenant context using set_config() function
      // This sets a transaction-scoped session variable (is_local = true)
      // The variable is referenced by RLS policies in all tenant-scoped tables
      //
      // Using set_config() instead of SET LOCAL because it works with custom
      // parameters without requiring postgresql.conf changes
      await tx.execute(
        sql`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`
      )

      // Execute the callback with the tenant context established
      // Pass the transaction object so all queries use the same connection
      // All queries within this callback will have RLS policies applied
      return await callback(tx)
    })

    return result
  } catch (error) {
    // Enhanced error context for debugging tenant-specific issues
    if (error instanceof Error) {
      error.message = `[Tenant: ${tenantId}] ${error.message}`
    }
    throw error
  }
}

/**
 * getTenantContext (Utility Function)
 *
 * Retrieves the current tenant ID from the PostgreSQL session variable.
 * Useful for debugging and verifying RLS context in tests.
 *
 * @returns Promise<string | null> - Current tenant ID or null if not set
 *
 * @example
 * ```typescript
 * const currentTenantId = await getTenantContext()
 * console.log('Current tenant context:', currentTenantId)
 * ```
 *
 * **Note:** This is primarily for testing and debugging. Production code should
 * already know the tenant ID from authentication context (Clerk orgId).
 */
export async function getTenantContext(): Promise<string | null> {
  try {
    const result = await db.execute<{ current_setting: string }>(
      sql`SELECT current_setting('app.current_tenant_id', true) as current_setting`
    )

    // If setting not found, current_setting returns empty string
    // Drizzle execute returns an array directly, not a {rows: []} object
    const setting = result[0]?.current_setting
    return setting && setting !== '' ? setting : null
  } catch {
    // If app.current_tenant_id is not set, return null
    return null
  }
}

/**
 * clearTenantContext (Utility Function)
 *
 * Explicitly clears the tenant context session variable.
 * Useful for test cleanup and ensuring no context leakage.
 *
 * **Note:** In production, SET LOCAL automatically clears when transaction ends.
 * This function is primarily for testing scenarios.
 *
 * @example
 * ```typescript
 * // In test cleanup
 * afterEach(async () => {
 *   await clearTenantContext()
 * })
 * ```
 */
export async function clearTenantContext(): Promise<void> {
  try {
    await db.execute(sql`RESET app.current_tenant_id`)
  } catch {
    // Ignore errors if variable doesn't exist
  }
}

/**
 * getTenantIdFromClerkOrgId()
 *
 * Maps a Clerk Organization ID to our internal tenant UUID.
 *
 * Clerk provides organization IDs in the format `org_XXXXXXXXXXXXXXXXXXXX`,
 * but our database uses UUIDs for tenant_id. This function performs the lookup.
 *
 * @param clerkOrgId - Clerk organization ID (e.g., "org_2o5yucCtMDzF4V1cNgv9DA5o9Sm")
 * @returns Promise<string | null> - Tenant UUID or null if not found
 *
 * @example
 * ```typescript
 * const { orgId } = await auth()
 * const tenantId = await getTenantIdFromClerkOrgId(orgId)
 * if (!tenantId) throw new Error('Tenant not found')
 *
 * await withTenantContext(tenantId, async () => {
 *   // queries here
 * })
 * ```
 *
 * @see Story 2.1: Build User Invitation System (added for orgId mapping)
 */
export async function getTenantIdFromClerkOrgId(
  clerkOrgId: string
): Promise<string | null> {
  try {
    const result = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.clerkOrgId, clerkOrgId))
      .limit(1)

    return result[0]?.id || null
  } catch (error) {
    console.error('Failed to lookup tenant from Clerk org ID:', error)
    return null
  }
}
