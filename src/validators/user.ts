/**
 * User Validation Schemas
 *
 * Zod schemas for user-related forms and actions.
 * Shared between client (React Hook Form) and server (Server Actions).
 *
 * @see Story 2.1: Build User Invitation System
 * @see docs/prd.md:230-292 for 8-role definitions
 */

import { z } from 'zod'

/**
 * 8 User Roles
 *
 * Predefined roles that determine user permissions within the application.
 * Role enforcement implemented in Story 2.2 (lib/permissions.ts).
 *
 * Role Definitions (from PRD:230-292):
 * - publisher_owner: Full system access
 * - managing_editor: Titles, contributors, production (no financials)
 * - production_staff: Title files, production tasks only
 * - sales_marketing: Customers, orders, reports (cannot see costs)
 * - warehouse_operations: Inventory, fulfillment, shipping
 * - accounting: Financials, exports, reports
 * - author: View own titles and royalties only
 * - illustrator: View own titles and royalties only
 */
export const USER_ROLES = [
  'publisher_owner',
  'managing_editor',
  'production_staff',
  'sales_marketing',
  'warehouse_operations',
  'accounting',
  'author',
  'illustrator',
] as const

/**
 * UserRole Type
 *
 * TypeScript type for user roles (inferred from USER_ROLES array).
 */
export type UserRole = (typeof USER_ROLES)[number]

/**
 * Human-Readable Role Labels
 *
 * Maps role keys to user-friendly display names for UI.
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  publisher_owner: 'Publisher/Owner',
  managing_editor: 'Managing Editor',
  production_staff: 'Production Staff',
  sales_marketing: 'Sales & Marketing',
  warehouse_operations: 'Warehouse/Operations',
  accounting: 'Accounting',
  author: 'Author',
  illustrator: 'Illustrator',
}

/**
 * Role Descriptions
 *
 * Short descriptions of each role's capabilities (for UI tooltips/help text).
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  publisher_owner: 'Full access to all features and settings',
  managing_editor:
    'Manage titles, contributors, and production (no financial access)',
  production_staff: 'Access production tasks and title files',
  sales_marketing:
    'Manage customers and orders (cannot view costs or financial data)',
  warehouse_operations: 'Manage inventory, fulfillment, and shipping',
  accounting: 'Access financial data, exports, and reports',
  author: 'View own titles and royalty information',
  illustrator: 'View own titles and royalty information',
}

/**
 * User Invitation Schema
 *
 * Validates user invitation form data. Used by:
 * - InviteUserDialog component (client-side validation)
 * - inviteUser() Server Action (server-side validation)
 *
 * @example
 * ```typescript
 * // In Server Action
 * const result = userInviteSchema.safeParse({ email, role })
 * if (!result.success) {
 *   return { success: false, error: 'VALIDATION_ERROR', message: result.error.message }
 * }
 * ```
 */
export const userInviteSchema = z.object({
  /**
   * Email address of user to invite
   *
   * Must be valid email format. Clerk will send invitation to this address.
   */
  email: z
    .string({
      message: 'Email is required',
    })
    .email({
      message: 'Please enter a valid email address',
    })
    .min(1, {
      message: 'Email cannot be empty',
    })
    .max(255, {
      message: 'Email must be less than 255 characters',
    })
    .toLowerCase()
    .trim(),

  /**
   * Role to assign to the invited user
   *
   * Must be one of the 8 predefined roles.
   */
  role: z.enum(USER_ROLES, {
    message: 'Please select a valid role',
  }),
})

/**
 * UserInvite Type
 *
 * TypeScript type inferred from userInviteSchema.
 *
 * @example
 * ```typescript
 * const invitation: UserInvite = {
 *   email: 'jane@example.com',
 *   role: 'managing_editor',
 * }
 * ```
 */
export type UserInvite = z.infer<typeof userInviteSchema>

/**
 * User Status Values
 *
 * Possible status values for user accounts.
 */
export const USER_STATUSES = ['pending', 'active', 'inactive'] as const

/**
 * UserStatus Type
 *
 * TypeScript type for user status.
 */
export type UserStatus = (typeof USER_STATUSES)[number]

/**
 * Status Labels
 *
 * Maps status keys to user-friendly display names for UI.
 */
export const STATUS_LABELS: Record<UserStatus, string> = {
  pending: 'Pending',
  active: 'Active',
  inactive: 'Inactive',
}

/**
 * Status Color Variants
 *
 * Maps status to color variants for badge styling.
 * Compatible with shadcn/ui Badge component variants.
 */
export const STATUS_COLORS: Record<
  UserStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  pending: 'secondary',
  active: 'default',
  inactive: 'outline',
}
