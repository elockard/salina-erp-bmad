/**
 * Role-Based Access Control (RBAC) Utilities
 *
 * Provides permission checking functions for the 8 Salina ERP user roles.
 * Roles are stored in Clerk user metadata and used for field-level permissions.
 *
 * **8 Roles:**
 * 1. publisher_owner - Full system access
 * 2. managing_editor - Titles, contributors, production
 * 3. production_staff - Files, production tasks
 * 4. sales_marketing - Customers, orders (no costs)
 * 5. warehouse_operations - Inventory, fulfillment
 * 6. accounting - Financials, exports
 * 7. author - View own titles/royalties
 * 8. illustrator - View own titles/royalties
 *
 * @see Story 1.4: Integrate Clerk Authentication (AC4, AC5)
 * @see Story 2.2: Implement RBAC permission checks
 * @see docs/architecture.md:283-291 for role definitions
 * @see docs/architecture.md:1729-1765 for permission matrix
 */

import { auth, clerkClient } from '@clerk/nextjs/server'

/**
 * Role Type Definitions
 *
 * TypeScript enum for type-safe role checking.
 */
export type UserRole =
  | 'publisher_owner'
  | 'managing_editor'
  | 'production_staff'
  | 'sales_marketing'
  | 'warehouse_operations'
  | 'accounting'
  | 'author'
  | 'illustrator'

/**
 * getUserRoles()
 *
 * Retrieves the roles assigned to a user from Clerk metadata.
 * Roles are stored as an array in user.publicMetadata.roles.
 *
 * @param userId - Clerk user ID (optional, defaults to current user from auth())
 * @returns Promise<UserRole[]> - Array of roles assigned to user
 *
 * @example
 * ```typescript
 * const roles = await getUserRoles()
 * if (roles.includes('publisher_owner')) {
 *   // User has full access
 * }
 * ```
 *
 * @example Server Action
 * ```typescript
 * export async function deleteTitle(titleId: string) {
 *   const { userId } = auth()
 *   const roles = await getUserRoles(userId)
 *
 *   if (!canEditTitle(roles)) {
 *     throw new AppError('Forbidden', 'FORBIDDEN', 403)
 *   }
 *   // ... delete title
 * }
 * ```
 */
export async function getUserRoles(userId?: string): Promise<UserRole[]> {
  // If userId not provided, get from current auth context
  if (!userId) {
    const authResult = await auth()
    userId = authResult.userId ?? undefined
  }

  if (!userId) {
    return []
  }

  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)

    // Extract roles from publicMetadata
    const metadata = user.publicMetadata as { roles?: UserRole[] }
    return metadata.roles ?? []
  } catch (error) {
    console.error('Failed to fetch user roles:', error)
    return []
  }
}

/**
 * hasRole()
 *
 * Check if user has a specific role.
 *
 * @param role - Role to check for
 * @param userId - Optional user ID (defaults to current user)
 * @returns Promise<boolean>
 */
export async function hasRole(
  role: UserRole,
  userId?: string
): Promise<boolean> {
  const roles = await getUserRoles(userId)
  return roles.includes(role)
}

/**
 * hasAnyRole()
 *
 * Check if user has at least one of the specified roles.
 *
 * @param allowedRoles - Array of roles to check
 * @param userId - Optional user ID (defaults to current user)
 * @returns Promise<boolean>
 */
export async function hasAnyRole(
  allowedRoles: UserRole[],
  userId?: string
): Promise<boolean> {
  const roles = await getUserRoles(userId)
  return roles.some((role) => allowedRoles.includes(role))
}

// ============================================================================
// Permission Check Functions
// ============================================================================

/**
 * canEditTitle()
 *
 * Check if user can create/edit/delete titles.
 * Allowed roles: publisher_owner, managing_editor, production_staff
 *
 * @see Architecture:1746-1753 for permission matrix
 */
export function canEditTitle(roles: UserRole[]): boolean {
  return roles.some((role) =>
    ['publisher_owner', 'managing_editor', 'production_staff'].includes(role)
  )
}

/**
 * canSeeCosts()
 *
 * Check if user can view unit costs, print costs, and margins.
 * Allowed roles: publisher_owner, accounting
 *
 * Field-level permission: Hides cost fields from sales_marketing, warehouse, etc.
 */
export function canSeeCosts(roles: UserRole[]): boolean {
  return roles.some((role) => ['publisher_owner', 'accounting'].includes(role))
}

/**
 * canEditCustomers()
 *
 * Check if user can create/edit customer records.
 * Allowed roles: publisher_owner, sales_marketing
 */
export function canEditCustomers(roles: UserRole[]): boolean {
  return roles.some((role) =>
    ['publisher_owner', 'sales_marketing'].includes(role)
  )
}

/**
 * canFulfillOrders()
 *
 * Check if user can process order fulfillment (pick, pack, ship).
 * Allowed roles: publisher_owner, warehouse_operations
 */
export function canFulfillOrders(roles: UserRole[]): boolean {
  return roles.some((role) =>
    ['publisher_owner', 'warehouse_operations'].includes(role)
  )
}

/**
 * canManageInventory()
 *
 * Check if user can adjust inventory, receive stock, etc.
 * Allowed roles: publisher_owner, warehouse_operations
 */
export function canManageInventory(roles: UserRole[]): boolean {
  return roles.some((role) =>
    ['publisher_owner', 'warehouse_operations'].includes(role)
  )
}

/**
 * canInviteUsers()
 *
 * Check if user can invite new users and assign roles.
 * Allowed roles: publisher_owner only
 *
 * **Security:** Only Publisher/Owner can assign roles to prevent privilege escalation.
 */
export function canInviteUsers(roles: UserRole[]): boolean {
  return roles.includes('publisher_owner')
}

/**
 * canAccessFinancials()
 *
 * Check if user can access financial reports, exports, royalty statements.
 * Allowed roles: publisher_owner, accounting
 */
export function canAccessFinancials(roles: UserRole[]): boolean {
  return roles.some((role) => ['publisher_owner', 'accounting'].includes(role))
}

/**
 * canManageProduction()
 *
 * Check if user can manage production schedules, tasks, and workflows.
 * Allowed roles: publisher_owner, managing_editor, production_staff
 *
 * (Epic 12: Production & Scheduling - Post-MVP)
 */
export function canManageProduction(roles: UserRole[]): boolean {
  return roles.some((role) =>
    ['publisher_owner', 'managing_editor', 'production_staff'].includes(role)
  )
}

/**
 * canManageContributors()
 *
 * Check if user can create/edit contributor records and assign to titles.
 * Allowed roles: publisher_owner, managing_editor
 */
export function canManageContributors(roles: UserRole[]): boolean {
  return roles.some((role) =>
    ['publisher_owner', 'managing_editor'].includes(role)
  )
}

/**
 * canViewAllTitles()
 *
 * Check if user can view all titles in the catalog.
 * Authors and illustrators can only see their own titles.
 *
 * Returns false for author/illustrator roles (they need filtered queries).
 */
export function canViewAllTitles(roles: UserRole[]): boolean {
  // Authors and illustrators can ONLY see their own titles
  const isContributor = roles.some((role) =>
    ['author', 'illustrator'].includes(role)
  )

  // If user ONLY has contributor roles, they cannot view all titles
  if (isContributor && !roles.includes('publisher_owner')) {
    return false
  }

  return true
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * getHighestPrivilegeRole()
 *
 * Returns the highest-privilege role from a user's role array.
 * Useful for UI display ("Logged in as Publisher/Owner").
 *
 * Priority order (highest to lowest):
 * 1. publisher_owner
 * 2. managing_editor
 * 3. accounting
 * 4. sales_marketing
 * 5. production_staff
 * 6. warehouse_operations
 * 7. author
 * 8. illustrator
 */
export function getHighestPrivilegeRole(roles: UserRole[]): UserRole | null {
  const priority: UserRole[] = [
    'publisher_owner',
    'managing_editor',
    'accounting',
    'sales_marketing',
    'production_staff',
    'warehouse_operations',
    'author',
    'illustrator',
  ]

  for (const role of priority) {
    if (roles.includes(role)) {
      return role
    }
  }

  return null
}

/**
 * getRoleDisplayName()
 *
 * Get human-readable display name for a role.
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    publisher_owner: 'Publisher / Owner',
    managing_editor: 'Managing Editor',
    production_staff: 'Production Staff',
    sales_marketing: 'Sales & Marketing',
    warehouse_operations: 'Warehouse Operations',
    accounting: 'Accounting',
    author: 'Author',
    illustrator: 'Illustrator',
  }

  return displayNames[role]
}
