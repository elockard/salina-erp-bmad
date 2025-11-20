/**
 * Settings > Users Page
 *
 * Displays list of users in the current tenant organization and allows
 * Publisher/Owner users to invite new team members.
 *
 * **Features:**
 * - User list with role, status, and last login
 * - Invite user dialog (Publisher/Owner only)
 * - Tenant-isolated via RLS (only shows users in current org)
 *
 * @see Story 2.1: Build User Invitation System (AC#1, AC#6)
 * @see Story 2.3: Build User Management Interface (future: deactivate/reactivate)
 */

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { users } from '@/db/schema'
import { withTenantContext, getTenantIdFromClerkOrgId } from '@/db/tenant-context'
import { eq, desc } from 'drizzle-orm'
import { InviteUserDialog } from '@/components/users/InviteUserDialog'
import { ROLE_LABELS, STATUS_LABELS, STATUS_COLORS } from '@/validators/user'
import { getUserRoles, canInviteUsers } from '@/lib/permissions'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDistanceToNow } from 'date-fns'

/**
 * Settings Users Page (Server Component)
 *
 * Fetches users from database using RLS-protected query and renders user list.
 * Only accessible to authenticated users with valid organization membership.
 */
export default async function SettingsUsersPage() {
  // Authentication check: Ensure user is logged in and has org context
  const { userId, orgId } = await auth()

  if (!userId || !orgId) {
    redirect('/sign-in')
  }

  // Map Clerk orgId to tenant UUID
  const tenantId = await getTenantIdFromClerkOrgId(orgId)

  if (!tenantId) {
    // Development/debugging helper error
    throw new Error(
      `Tenant not found for organization (Clerk orgId: ${orgId}). ` +
      `This usually means the organization was created before the webhook handler was set up. ` +
      `To fix: 1) Create a new organization in Clerk, or 2) Manually insert a tenant record with clerk_org_id='${orgId}' ` +
      `into the tenants table.`
    )
  }

  // Check if current user has permission to invite users
  const userRoles = await getUserRoles(userId)
  const hasInvitePermission = canInviteUsers(userRoles)

  // Fetch users for current tenant using RLS-protected query
  // withTenantContext ensures only users from current tenant are returned
  const tenantUsers = await withTenantContext(tenantId, async (tx) => {
    return await tx
      .select()
      .from(users)
      .where(eq(users.tenantId, tenantId))
      .orderBy(desc(users.createdAt))
  })

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground mt-2">
            Manage team members and their roles
          </p>
        </div>

        {/* Invite User button - only visible for Publisher/Owner */}
        {hasInvitePermission && <InviteUserDialog />}
      </div>

      {/* Users Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenantUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No users found. Invite your first team member to get started.
                </TableCell>
              </TableRow>
            ) : (
              tenantUsers.map((user) => (
                <TableRow key={user.id}>
                  {/* Name */}
                  <TableCell className="font-medium">
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.firstName || user.lastName || '—'}
                  </TableCell>

                  {/* Email */}
                  <TableCell>{user.email}</TableCell>

                  {/* Role */}
                  <TableCell>
                    {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ||
                      user.role}
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell>
                    <Badge
                      variant={
                        STATUS_COLORS[
                          user.status as keyof typeof STATUS_COLORS
                        ]
                      }
                    >
                      {STATUS_LABELS[
                        user.status as keyof typeof STATUS_LABELS
                      ] || user.status}
                    </Badge>
                  </TableCell>

                  {/* Last Login */}
                  <TableCell>
                    {user.lastLogin
                      ? formatDistanceToNow(new Date(user.lastLogin), {
                          addSuffix: true,
                        })
                      : '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
