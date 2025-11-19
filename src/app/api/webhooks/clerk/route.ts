/**
 * Clerk Webhook Handler
 *
 * Processes Clerk webhook events for user and organization synchronization.
 * This webhook ensures our local database stays in sync with Clerk.
 *
 * **Events Handled:**
 * - user.created - Sync new users to local users table (Story 2.1)
 * - organization.created - Create tenant record (Story 1.5)
 * - organizationMembership.created - Track user-tenant associations (Story 2.1)
 * - user.updated - Sync profile changes (Story 2.1)
 * - organization.updated - Sync org changes (Story 1.5)
 *
 * **Security:**
 * - Webhook signatures verified using Svix library
 * - CLERK_WEBHOOK_SECRET prevents spoofing
 * - All webhook events logged for audit trail
 *
 * @see Story 1.4: Integrate Clerk Authentication (AC8)
 * @see Story 1.5: Tenant provisioning (organization.created implementation)
 * @see docs/architecture.md:386-391 for webhook integration pattern
 */

import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { db } from '../../../../../db'
import { withTenantContext } from '../../../../../db/tenant-context'
import { tenants } from '../../../../../db/schema/tenants'
import { logger } from '@/lib/logger'
import { initializeFeatureFlags } from '@/actions/tenants'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'

/**
 * POST /api/webhooks/clerk
 *
 * Clerk webhook endpoint that receives events from Clerk.
 * Must be publicly accessible (not protected by Clerk middleware).
 *
 * **Signature Verification:**
 * Clerk uses Svix for webhook delivery. All webhooks include these headers:
 * - svix-id: Unique webhook ID
 * - svix-timestamp: Unix timestamp of delivery
 * - svix-signature: HMAC signature for verification
 *
 * We verify the signature using CLERK_WEBHOOK_SECRET to ensure:
 * 1. Webhook came from Clerk (not spoofed)
 * 2. Payload hasn't been tampered with
 * 3. Webhook is recent (timestamp check)
 */
export async function POST(req: NextRequest) {
  // Get webhook secret from environment
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET not configured')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  // Get headers for signature verification
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // Validate required headers exist
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('Missing Svix headers')
    return NextResponse.json(
      { error: 'Missing webhook signature headers' },
      { status: 400 }
    )
  }

  // Get the raw body for verification
  const payload = await req.text()

  // Verify webhook signature
  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: any

  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 400 }
    )
  }

  // Extract event type and data
  const { type: eventType, data } = evt

  // Log all webhook events for debugging
  console.log('Clerk webhook received:', {
    eventType,
    id: data.id,
    timestamp: new Date().toISOString(),
  })

  // Route to appropriate handler based on event type
  try {
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(data)
        break

      case 'organization.created':
        await handleOrganizationCreated(data)
        break

      case 'organizationMembership.created':
        await handleOrganizationMembershipCreated(data)
        break

      case 'user.updated':
        await handleUserUpdated(data)
        break

      case 'organization.updated':
        await handleOrganizationUpdated(data)
        break

      default:
        console.log(`Unhandled webhook event type: ${eventType}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error(`Error processing ${eventType} webhook:`, error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * handleUserCreated()
 *
 * Process user.created webhook event.
 * Syncs new Clerk users to local users table.
 *
 * **Implementation:** Story 2.1 (User Invitation System)
 * For now, just log the event.
 */
async function handleUserCreated(data: any) {
  console.log('user.created webhook:', {
    userId: data.id,
    email: data.email_addresses?.[0]?.email_address,
    firstName: data.first_name,
    lastName: data.last_name,
  })

  // TODO (Story 2.1): Create user record in local database
  // const user = await db.insert(users).values({
  //   clerkUserId: data.id,
  //   email: data.email_addresses[0].email_address,
  //   firstName: data.first_name,
  //   lastName: data.last_name,
  // })
}

/**
 * handleOrganizationCreated()
 *
 * Process organization.created webhook event.
 * Creates tenant record in local database with default configuration.
 *
 * **Critical:** This webhook triggers tenant provisioning (Story 1.5).
 * When a user creates an organization in Clerk, we automatically:
 * 1. Create tenant record in tenants table
 * 2. Set default branding (Publishing Ink theme)
 * 3. Set default localization (en-US, America/New_York, USD)
 * 4. Initialize feature flags based on subscription tier (Task 2)
 *
 * **Implementation:** Story 1.5 (Tenant Provisioning Workflow), Task 1
 */
async function handleOrganizationCreated(data: any) {
  const { id: orgId, name } = data

  logger.info({
    orgId,
    name,
    createdBy: data.created_by,
  }, 'organization.created webhook received')

  try {
    // Check if tenant already exists (idempotency check)
    const existingTenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.clerkOrgId, orgId))
      .limit(1)

    if (existingTenant.length > 0) {
      logger.warn({
        orgId,
        tenantId: existingTenant[0].id,
      }, 'Tenant already exists for organization')
      return // Idempotent - webhook may fire twice
    }

    // Generate new tenant ID
    const tenantId = randomUUID()

    // Create tenant record with default settings
    await withTenantContext(tenantId, async (tx) => {
      await tx.insert(tenants).values({
        id: tenantId,
        tenantId: tenantId, // Self-referential for RLS consistency
        name,
        clerkOrgId: orgId,
        status: 'active',
        settings: JSON.stringify({
          branding: {
            primaryColor: '#1e3a8a', // Publishing Ink navy
            secondaryColor: '#d97706', // Publishing Ink amber
          },
          locale: {
            timezone: 'America/New_York',
            currency: 'USD',
            measurementSystem: 'imperial',
            language: 'en-US',
          },
          onboarding: {
            completedSteps: [],
            currentStep: 'welcome',
          },
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    })

    logger.info({
      tenantId,
      orgId,
      name,
    }, 'Tenant provisioned successfully')

    // Initialize feature flags for Starter tier (default)
    await initializeFeatureFlags(tenantId, 'starter')
  } catch (error) {
    logger.error({
      error,
      orgId,
      name,
    }, 'Failed to provision tenant')
    throw error
  }
}

/**
 * handleOrganizationMembershipCreated()
 *
 * Process organizationMembership.created webhook event.
 * Tracks when users join organizations.
 *
 * **Implementation:** Story 2.1 (User Invitation System)
 * For now, just log the event.
 */
async function handleOrganizationMembershipCreated(data: any) {
  console.log('organizationMembership.created webhook:', {
    membershipId: data.id,
    orgId: data.organization.id,
    userId: data.public_user_data.user_id,
    role: data.role,
  })

  // TODO (Story 2.1): Create user-tenant association
  // Track which users belong to which tenants
}

/**
 * handleUserUpdated()
 *
 * Process user.updated webhook event.
 * Syncs profile changes from Clerk to local database.
 *
 * **Implementation:** Story 2.1 (User Invitation System)
 * For now, just log the event.
 */
async function handleUserUpdated(data: any) {
  console.log('user.updated webhook:', {
    userId: data.id,
    email: data.email_addresses?.[0]?.email_address,
  })

  // TODO (Story 2.1): Update user record
  // await db.update(users)
  //   .set({
  //     email: data.email_addresses[0].email_address,
  //     firstName: data.first_name,
  //     lastName: data.last_name,
  //     updatedAt: new Date(),
  //   })
  //   .where(eq(users.clerkUserId, data.id))
}

/**
 * handleOrganizationUpdated()
 *
 * Process organization.updated webhook event.
 * Syncs organization name/slug changes to tenant record.
 *
 * **Implementation:** Story 1.5 (Tenant Provisioning Workflow)
 * For now, just log the event.
 */
async function handleOrganizationUpdated(data: any) {
  console.log('organization.updated webhook:', {
    orgId: data.id,
    name: data.name,
    slug: data.slug,
  })

  // TODO (Story 1.5): Update tenant record
  // await db.update(tenants)
  //   .set({
  //     name: data.name,
  //     slug: data.slug,
  //     updatedAt: new Date(),
  //   })
  //   .where(eq(tenants.clerkOrgId, data.id))
}
