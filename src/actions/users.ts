'use server'

/**
 * User Server Actions
 *
 * Server-side actions for user management operations.
 * All actions follow the Server Action pattern:
 * 1. Authentication check
 * 2. Zod validation
 * 3. Business logic with withTenantContext()
 * 4. Structured logging with Pino
 * 5. Cache invalidation with revalidatePath()
 * 6. Return structured response
 *
 * @see Story 2.1: Build User Invitation System
 * @see docs/architecture.md:870-948 for Server Action pattern
 */

import { auth, clerkClient } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { users, tenants } from '@/db/schema'
import { withTenantContext, getTenantIdFromClerkOrgId } from '@/db/tenant-context'
import { userInviteSchema, type UserInvite } from '@/validators/user'
import { logger } from '@/lib/logger'
import { inngest } from '@/inngest/client'
import { getUserRoles, canInviteUsers } from '@/lib/permissions'
import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'

/**
 * Server Action Response Type
 *
 * All Server Actions return this structured response format for
 * consistent error handling in client components.
 */
type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; message: string }

/**
 * inviteUser Server Action
 *
 * Sends invitation to new user via Clerk Organizations API and creates
 * pending user record in database.
 *
 * **Security:**
 * - Requires authentication (Publisher/Owner role check in Story 2.2)
 * - Validates input with Zod schema
 * - Uses RLS for tenant isolation
 * - Logs all invitation attempts
 *
 * **Flow:**
 * 1. Validate authentication (must be logged in with org context)
 * 2. Validate invitation data (email, role)
 * 3. Send Clerk invitation with role metadata
 * 4. Create pending user record in database
 * 5. Log invitation event
 * 6. Return success/error response
 *
 * @param data - User invitation data (email, role)
 * @returns ActionResponse with success status and user data or error
 *
 * @example
 * ```typescript
 * const result = await inviteUser({ email: 'jane@example.com', role: 'managing_editor' })
 * if (result.success) {
 *   console.log('User invited:', result.data)
 * } else {
 *   console.error('Failed:', result.message)
 * }
 * ```
 */
export async function inviteUser(
  data: UserInvite
): Promise<ActionResponse<{ userId: string; email: string; role: string }>> {
  try {
    // Step 1: Authentication check
    const { userId, orgId } = await auth()

    if (!userId || !orgId) {
      logger.warn({ userId, orgId }, 'Unauthorized invitation attempt')
      return {
        success: false,
        error: 'UNAUTHORIZED',
        message: 'You must be logged in to invite users',
      }
    }

    // Step 1.5: Map Clerk orgId to tenant UUID
    const tenantId = await getTenantIdFromClerkOrgId(orgId)

    if (!tenantId) {
      logger.error({ userId, orgId }, 'Tenant not found for organization')
      return {
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Organization not found',
      }
    }

    // Step 2: Validate input with Zod schema
    const validationResult = userInviteSchema.safeParse(data)

    if (!validationResult.success) {
      logger.warn(
        { userId, tenantId, errors: validationResult.error.issues },
        'Invalid invitation data'
      )
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: validationResult.error.issues[0]?.message || 'Invalid input',
      }
    }

    const { email, role } = validationResult.data

    // Step 2.5: Check permission - only Publisher/Owner can invite users
    const userRoles = await getUserRoles(userId)

    if (!canInviteUsers(userRoles)) {
      logger.warn(
        { userId, tenantId, userRoles },
        'Permission denied: User attempted to invite without permission'
      )
      return {
        success: false,
        error: 'FORBIDDEN',
        message: 'You do not have permission to invite users',
      }
    }

    // Step 3: Send Clerk invitation with role metadata
    logger.info(
      { userId, tenantId, email, role },
      'Sending invitation via Clerk Organizations API'
    )

    const clerk = await clerkClient()
    const invitation = await clerk.organizations.createOrganizationInvitation({
      organizationId: orgId,
      emailAddress: email,
      role: role, // Store role in Clerk metadata
    })

    logger.info(
      { userId, tenantId, email, role, invitationId: invitation.id },
      'Clerk invitation created successfully'
    )

    // Step 4: Create pending user record in database
    const newUserId = randomUUID()

    await withTenantContext(tenantId, async (tx) => {
      await tx.insert(users).values({
        id: newUserId,
        clerkUserId: '', // Will be updated by webhook when user accepts
        email: email,
        role: role,
        status: 'pending',
        tenantId: tenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    })

    logger.info(
      { userId, tenantId, email, role, newUserId },
      'Pending user record created in database'
    )

    // Step 5: Get tenant name for email template
    const tenant = await withTenantContext(tenantId, async (tx) => {
      const result = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1)
      return result[0]
    })

    const tenantName = tenant?.name || 'Your Organization'

    // Step 6: Send Inngest event for email notification
    await inngest.send({
      name: 'user/invitation.sent',
      data: {
        email,
        role,
        tenantId: tenantId,
        tenantName,
        invitationUrl: invitation.publicMetadata?.invitationUrl as string || '',
        invitedBy: userId,
      },
    })

    logger.info(
      { userId, tenantId, email, role },
      'Inngest event sent for email notification'
    )

    // Step 7: Revalidate users page to show new pending user
    revalidatePath('/settings/users')

    // Step 8: Return success response
    return {
      success: true,
      data: {
        userId: newUserId,
        email,
        role,
      },
    }
  } catch (error) {
    // Log error with context
    logger.error(
      { error, email: data.email, role: data.role },
      'Failed to invite user'
    )

    // Return user-friendly error message
    return {
      success: false,
      error: 'INVITATION_FAILED',
      message:
        'Failed to send invitation. Please try again or contact support.',
    }
  }
}
