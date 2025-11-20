/**
 * Development Seed Script: Create Test Tenant
 *
 * This script creates a tenant record in the database for development/testing.
 * Use this when you have a Clerk organization but no corresponding tenant record.
 *
 * Usage:
 *   tsx scripts/seed-dev-tenant.ts <clerk-org-id>
 *
 * Example:
 *   tsx scripts/seed-dev-tenant.ts org_2o5yucCtMDzF4V1cNgv9DA5o9Sm
 *
 * **When to use:**
 * - Setting up local development environment
 * - Clerk organization created before webhook handler was configured
 * - Testing without triggering webhooks
 *
 * **Note:** In production, tenants are automatically created via Clerk webhooks.
 */

// Load environment variables
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { db } from '../db'
import { tenants } from '../db/schema'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'

async function seedDevTenant(clerkOrgId: string) {
  console.log(`\n🌱 Seeding dev tenant for Clerk orgId: ${clerkOrgId}\n`)

  try {
    // Check if tenant already exists
    const existing = await db
      .select()
      .from(tenants)
      .where(eq(tenants.clerkOrgId, clerkOrgId))
      .limit(1)

    if (existing.length > 0) {
      console.log('✅ Tenant already exists:')
      console.log(JSON.stringify(existing[0], null, 2))
      console.log('\nNo action needed.')
      process.exit(0)
    }

    // Generate new tenant ID
    const tenantId = randomUUID()

    // Create tenant record
    const result = await db
      .insert(tenants)
      .values({
        id: tenantId,
        tenantId: tenantId, // Self-referential
        name: 'Dev Test Publisher', // Default name for dev
        clerkOrgId: clerkOrgId,
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
      .returning()

    console.log('✅ Tenant created successfully:')
    console.log(JSON.stringify(result[0], null, 2))
    console.log('\n✨ You can now sign in and access /settings/users')
  } catch (error) {
    console.error('❌ Failed to create tenant:', error)
    process.exit(1)
  }
}

// Parse command line arguments
const clerkOrgId = process.argv[2]

if (!clerkOrgId) {
  console.error('❌ Error: Missing Clerk organization ID\n')
  console.log('Usage: tsx scripts/seed-dev-tenant.ts <clerk-org-id>\n')
  console.log('Example:')
  console.log('  tsx scripts/seed-dev-tenant.ts org_2o5yucCtMDzF4V1cNgv9DA5o9Sm\n')
  console.log('To find your Clerk org ID:')
  console.log('  1. Sign in to your application')
  console.log('  2. Check the error message on /settings/users page')
  console.log('  3. Copy the orgId from the error')
  process.exit(1)
}

if (!clerkOrgId.startsWith('org_')) {
  console.error('❌ Error: Invalid Clerk organization ID format\n')
  console.log('Clerk organization IDs must start with "org_"\n')
  console.log('Example: org_2o5yucCtMDzF4V1cNgv9DA5o9Sm')
  process.exit(1)
}

// Run seed
seedDevTenant(clerkOrgId)
  .then(() => {
    console.log('\n✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
