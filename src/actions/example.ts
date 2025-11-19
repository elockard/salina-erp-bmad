/**
 * Example Server Actions - Auth Pattern Demonstration
 *
 * This file demonstrates the standard authentication pattern for Server Actions
 * in Salina ERP. All Server Actions MUST follow this pattern to ensure proper
 * tenant isolation and security.
 *
 * **Pattern:**
 * 1. Extract userId and orgId from auth()
 * 2. Validate both exist (throw error if not)
 * 3. Use orgId as tenantId for database operations
 * 4. Wrap all queries in withTenantContext(tenantId, ...)
 *
 * @see Story 1.4: Integrate Clerk Authentication (AC7)
 * @see docs/architecture.md:870-938 for Server Action pattern
 */

'use server'

import { auth } from '@clerk/nextjs/server'
import { withTenantContext } from '../../db/tenant-context'

/**
 * AppError - Structured Error Class
 *
 * Standard error format for Server Actions.
 * Will be moved to lib/errors.ts in future stories.
 */
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * ActionResult Type
 *
 * Discriminated union for Server Action return values.
 * Allows client to check success and handle errors gracefully.
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; message: string }

/**
 * exampleAuthenticatedAction()
 *
 * Example Server Action demonstrating authentication pattern.
 * This shows how ALL Server Actions should handle auth and tenant context.
 *
 * @returns ActionResult with user and tenant info
 *
 * @example Client Usage
 * ```tsx
 * 'use client'
 *
 * export function ExampleComponent() {
 *   async function handleClick() {
 *     const result = await exampleAuthenticatedAction()
 *
 *     if (result.success) {
 *       console.log('User ID:', result.data.userId)
 *       console.log('Tenant ID:', result.data.tenantId)
 *     } else {
 *       console.error(result.error, result.message)
 *     }
 *   }
 *
 *   return <button onClick={handleClick}>Test Auth</button>
 * }
 * ```
 */
export async function exampleAuthenticatedAction(): Promise<
  ActionResult<{
    userId: string
    tenantId: string
    message: string
  }>
> {
  try {
    // Step 1: Extract authentication state from Clerk
    const { userId, orgId } = await auth()

    // Step 2: Validate authentication
    // CRITICAL: Always check BOTH userId and orgId
    if (!userId || !orgId) {
      throw new AppError('Unauthorized', 'UNAUTHORIZED', 401)
    }

    // Step 3: Use orgId as tenantId
    // Clerk Organization ID = Salina Tenant ID (1:1 mapping)
    const tenantId = orgId

    // Step 4: Execute database operations with tenant context
    // This example doesn't query the database, but shows the pattern
    const result = await withTenantContext(tenantId, async (tx) => {
      // All database queries here automatically have RLS enforced
      // Example: const titles = await tx.select().from(titles)

      return {
        userId,
        tenantId,
        message: 'Authentication successful! orgId mapped to tenantId.',
      }
    })

    // Step 5: Return success result
    return { success: true, data: result }
  } catch (error) {
    // Step 6: Handle errors
    if (error instanceof AppError) {
      return {
        success: false,
        error: error.code,
        message: error.message,
      }
    }

    // Unexpected errors
    console.error('Unexpected error in exampleAuthenticatedAction:', error)
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    }
  }
}

/**
 * exampleDatabaseQueryAction()
 *
 * Example Server Action with actual database query.
 * Demonstrates withTenantContext() usage with real queries.
 *
 * @returns ActionResult with current tenant info from database
 */
export async function exampleDatabaseQueryAction(): Promise<
  ActionResult<{
    tenantId: string
    message: string
  }>
> {
  try {
    const { userId, orgId } = await auth()

    if (!userId || !orgId) {
      throw new AppError('Unauthorized', 'UNAUTHORIZED', 401)
    }

    const tenantId = orgId

    // Execute query with tenant context
    const result = await withTenantContext(tenantId, async (tx) => {
      // Example: Query tenant info (will be implemented in Story 1.5)
      // const tenant = await tx.select().from(tenants).where(eq(tenants.id, tenantId))

      return {
        tenantId,
        message: `Tenant context established for ${tenantId}`,
      }
    })

    return { success: true, data: result }
  } catch (error) {
    if (error instanceof AppError) {
      return {
        success: false,
        error: error.code,
        message: error.message,
      }
    }

    console.error('Unexpected error in exampleDatabaseQueryAction:', error)
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    }
  }
}

/**
 * Authentication Pattern Summary
 *
 * ALL Server Actions in Salina ERP MUST follow this pattern:
 *
 * ```typescript
 * 'use server'
 *
 * import { auth } from '@clerk/nextjs/server'
 * import { withTenantContext } from '@/db/tenant-context'
 *
 * export async function myAction() {
 *   // 1. Extract auth
 *   const { userId, orgId } = auth()
 *
 *   // 2. Validate
 *   if (!userId || !orgId) {
 *     throw new AppError('Unauthorized', 'UNAUTHORIZED', 401)
 *   }
 *
 *   // 3. Set tenantId
 *   const tenantId = orgId
 *
 *   // 4. Execute with context
 *   return await withTenantContext(tenantId, async (tx) => {
 *     // ... database operations
 *   })
 * }
 * ```
 *
 * **Why this pattern:**
 * - Ensures every database query has tenant context (RLS enforcement)
 * - Prevents cross-tenant data access
 * - Consistent error handling
 * - Type-safe with discriminated unions
 */
