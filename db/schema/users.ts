/**
 * Users Schema - User Management with Multi-Tenant Isolation
 *
 * This table stores user records synced from Clerk with Row-Level Security (RLS)
 * enforcement. Each user belongs to a tenant organization and has an assigned role
 * that determines their permissions within the application.
 *
 * @see Story 2.1: Build User Invitation System
 * @see docs/architecture.md:1501-1527 for RLS pattern architecture
 * @see docs/prd.md:230-292 for 8-role definitions and permissions
 */

import { pgTable, uuid, text, timestamp, pgPolicy } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { tenantFields } from './base'

/**
 * users Table
 *
 * Stores user records synced from Clerk authentication. Each user is associated
 * with a tenant organization and assigned one of 8 predefined roles.
 *
 * **RLS Pattern (REQUIRED for tenant isolation):**
 *
 * This table follows the canonical RLS implementation pattern established in
 * tenants.ts. The RLS policy ensures users can only see other users within
 * their own tenant organization.
 *
 * **Schema Fields:**
 * - id: Primary key (matches Clerk user ID)
 * - clerkUserId: Clerk's unique user identifier (redundant with id for clarity)
 * - email: User's email address (from Clerk)
 * - firstName: User's first name (from Clerk, nullable)
 * - lastName: User's last name (from Clerk, nullable)
 * - role: One of 8 predefined roles (publisher_owner, managing_editor, etc.)
 * - status: User status (pending, active, inactive)
 * - lastLogin: Timestamp of most recent login
 * - tenantId: Links user to tenant organization (for RLS)
 * - createdAt: Timestamp when user was created
 * - updatedAt: Last modification timestamp
 *
 * **User Lifecycle:**
 * 1. User invited → Record created with status='pending'
 * 2. User accepts invite → Clerk webhook fires
 * 3. Webhook handler updates status='active', sets lastLogin
 *
 * **8 User Roles:**
 * - publisher_owner: Full system access
 * - managing_editor: Titles, contributors, production (no financials)
 * - production_staff: Titles, files, production tasks
 * - sales_marketing: Customers, orders, reports (no costs)
 * - warehouse_operations: Inventory, fulfillment, shipping
 * - accounting: Financials, exports, reports
 * - author: View own titles and royalties
 * - illustrator: View own titles and royalties
 *
 * **Usage Example:**
 * ```typescript
 * // Fetch users for current tenant
 * const users = await withTenantContext(tenantId, async (tx) => {
 *   return await tx.select().from(users).where(eq(users.status, 'active'))
 * })
 * ```
 *
 * **Important Notes:**
 * - All queries MUST use withTenantContext() wrapper for RLS enforcement
 * - User creation happens via Clerk webhook (don't create directly)
 * - Role changes require permission checks (Story 2.2)
 * - Status changes logged for audit trail (Story 2.4)
 */
export const users = pgTable(
  'users',
  {
    /**
     * Unique identifier for the user (matches Clerk user ID)
     *
     * This is the Clerk-provided user ID, stored as our primary key for
     * easy lookups and foreign key relationships.
     */
    id: uuid('id').primaryKey().defaultRandom(),

    /**
     * Clerk User ID (explicit field for clarity)
     *
     * While id also stores the Clerk user ID, this field makes the
     * relationship explicit in the schema.
     */
    clerkUserId: text('clerk_user_id').notNull().unique(),

    /**
     * User's email address (from Clerk)
     *
     * Primary contact method for the user. Used for:
     * - Account identification
     * - Invitation delivery
     * - Notifications
     *
     * Note: Email is unique per tenant (enforced by unique index)
     */
    email: text('email').notNull(),

    /**
     * User's first name (from Clerk)
     *
     * Optional: User may not have provided during sign-up
     */
    firstName: text('first_name'),

    /**
     * User's last name (from Clerk)
     *
     * Optional: User may not have provided during sign-up
     */
    lastName: text('last_name'),

    /**
     * User's role within the tenant organization
     *
     * One of 8 predefined roles that determine permissions:
     * - 'publisher_owner': Full access to all features
     * - 'managing_editor': Titles, contributors, production
     * - 'production_staff': Title files, production tasks
     * - 'sales_marketing': Customers, orders (no costs)
     * - 'warehouse_operations': Inventory, fulfillment
     * - 'accounting': Financials, exports, reports
     * - 'author': View own titles and royalties
     * - 'illustrator': View own titles and royalties
     *
     * Role is assigned during invitation and can be changed by owners.
     * Permission enforcement implemented in Story 2.2.
     */
    role: text('role').notNull(),

    /**
     * User account status
     *
     * Values:
     * - 'pending': Invitation sent, not yet accepted
     * - 'active': User has completed sign-up and can log in
     * - 'inactive': User deactivated by owner (Story 2.3)
     *
     * Status lifecycle:
     * 1. pending → User invited via inviteUser() action
     * 2. active → User accepts invitation (Clerk webhook)
     * 3. inactive → Owner deactivates user (future story)
     */
    status: text('status').notNull().default('pending'),

    /**
     * Timestamp of user's most recent login
     *
     * Updated by Clerk webhook on each successful authentication.
     * Used for:
     * - Activity tracking
     * - Inactive user detection
     * - Audit trails
     *
     * Initially null for pending users (set on first login).
     */
    lastLogin: timestamp('last_login'),

    /**
     * tenantFields mixin (REQUIRED for all tenant-scoped tables)
     *
     * Provides:
     * - tenantId: UUID reference to tenant organization
     * - createdAt: Timestamp when user was created
     * - updatedAt: Timestamp when user was last modified
     *
     * Critical for RLS policy enforcement.
     */
    ...tenantFields,
  },
  (table) => ({
    /**
     * Row-Level Security (RLS) Policy: users_tenant_isolation
     *
     * **CRITICAL: Enforces multi-tenant data isolation at database level.**
     *
     * RLS Policy Configuration:
     * - Name: `users_tenant_isolation` (convention: {table}_tenant_isolation)
     * - For: 'all' (applies to SELECT, INSERT, UPDATE, DELETE)
     * - To: 'authenticated' (only authenticated database users)
     * - Using: Filters by `tenant_id = current_setting('app.current_tenant_id')::uuid`
     *
     * **How it works:**
     * 1. Application calls `withTenantContext(tenantId, callback)`
     * 2. withTenantContext sets PostgreSQL session variable via set_config()
     * 3. All queries within callback automatically filtered by RLS policy
     * 4. PostgreSQL enforces: only rows where `tenant_id = app.current_tenant_id`
     * 5. Transaction completes, session variable auto-resets (no leakage)
     *
     * **Security guarantee:**
     * Even if application code has a bug, PostgreSQL RLS prevents cross-tenant
     * access. Users cannot see or modify users from other tenants.
     *
     * **Testing requirement:**
     * Integration tests MUST verify RLS blocks cross-tenant queries
     * (see tests/integration/users.test.ts)
     *
     * @see db/tenant-context.ts for withTenantContext() implementation
     * @see db/schema/tenants.ts for RLS pattern documentation
     * @see docs/architecture.md:1513-1526 for security model details
     */
    rlsPolicy: pgPolicy('users_tenant_isolation', {
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
 * User - Complete user record (SELECT)
 *
 * @example
 * ```typescript
 * const user: User = await tx.select().from(users).where(eq(users.id, userId))
 * ```
 */
export type User = typeof users.$inferSelect

/**
 * NewUser - Data for creating a new user (INSERT)
 *
 * @example
 * ```typescript
 * const newUser: NewUser = {
 *   clerkUserId: 'user_abc123',
 *   email: 'jane@example.com',
 *   firstName: 'Jane',
 *   lastName: 'Doe',
 *   role: 'managing_editor',
 *   status: 'pending',
 *   tenantId: tenantId,
 * }
 * await tx.insert(users).values(newUser)
 * ```
 */
export type NewUser = typeof users.$inferInsert

/**
 * RLS Pattern Documentation Summary
 * ==================================
 *
 * This table demonstrates the complete RLS pattern for user management.
 *
 * **When users table is accessed:**
 * - User invitation: inviteUser() creates pending record (Task 3)
 * - User activation: Clerk webhook updates to active (Task 5)
 * - User list: Settings page displays users (Task 6)
 * - User deactivation: Owner can deactivate users (Story 2.3)
 * - Permission checks: Role determines what user can do (Story 2.2)
 *
 * **Checklist for accessing users table:**
 * - [ ] Always use withTenantContext() wrapper
 * - [ ] Never create users directly (use Clerk webhook)
 * - [ ] Log all user modifications with Pino
 * - [ ] Validate role against 8 predefined values
 * - [ ] Check permissions before role changes
 * - [ ] Test RLS enforcement in integration tests
 *
 * @see Story 2.1: Build User Invitation System (creates this table)
 * @see Story 2.2: Implement Role-Based Permission System (uses role field)
 * @see Story 2.3: Build User Management Interface (displays/manages users)
 * @see Story 2.4: Implement Audit Trail System (logs user changes)
 */
