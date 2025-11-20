/**
 * Company Settings Page
 *
 * Allows Publisher/Owner to configure:
 * - Branding (logo, colors)
 * - Locale (timezone, currency, measurement system)
 * - View usage metrics (titles, users, orders)
 * - Export tenant data
 *
 * @see Story 1.5: Build Tenant Provisioning Workflow (Task 3)
 * @see docs/architecture.md:409-463 for Server Component pattern
 */

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '../../../../../db'
import { withTenantContext, getTenantIdFromClerkOrgId } from '../../../../../db/tenant-context'
import { tenants } from '../../../../../db/schema'
import { eq } from 'drizzle-orm'
import { CompanySettingsForm } from '@/components/settings/CompanySettingsForm'

/**
 * CompanySettingsPage Server Component
 *
 * Fetches tenant data and passes it to client components for editing.
 * Server Components are used for data fetching, Client Components for interactivity.
 */
export default async function CompanySettingsPage() {
  const { userId, orgId } = await auth()

  if (!userId || !orgId) {
    redirect('/sign-in')
  }

  // Map Clerk orgId to tenant UUID
  const tenantId = await getTenantIdFromClerkOrgId(orgId)

  if (!tenantId) {
    return (
      <div className="rounded-md border border-destructive bg-destructive/10 p-4">
        <p className="text-sm font-medium text-destructive">
          Tenant not found for organization. Please contact support.
        </p>
      </div>
    )
  }

  // Fetch tenant record using RLS
  const tenant = await withTenantContext(tenantId, async (tx) => {
    const [result] = await tx
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1)

    return result
  })

  if (!tenant) {
    return (
      <div className="rounded-md border border-destructive bg-destructive/10 p-4">
        <p className="text-sm font-medium text-destructive">
          Tenant not found. Please contact support.
        </p>
      </div>
    )
  }

  // Parse settings JSON
  const settings = JSON.parse(tenant.settings || '{}')

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold">Company Settings</h2>
        <p className="text-muted-foreground">
          Manage your organization's branding, locale, and preferences
        </p>
      </div>

      {/* Usage Metrics Section - Placeholder for Task 6 */}
      <section className="rounded-lg border border-border p-6">
        <h3 className="mb-4 text-lg font-semibold">Usage Metrics</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Titles</p>
            <p className="text-2xl font-bold">0 / 50</p>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Users</p>
            <p className="text-2xl font-bold">1 / 5</p>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Orders (this month)</p>
            <p className="text-2xl font-bold">0 / 100</p>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Tier</p>
            <p className="text-2xl font-bold">Starter</p>
          </div>
        </div>
      </section>

      {/* Branding and Locale Forms */}
      <CompanySettingsForm
        branding={settings.branding || {}}
        locale={settings.locale || {}}
      />

      {/* Data Export Section - Placeholder for Task 7 */}
      <section className="rounded-lg border border-border p-6">
        <h3 className="mb-4 text-lg font-semibold">Data Export</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Download a complete backup of your tenant data.
        </p>
        <button
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          disabled
        >
          Export Data (Coming Soon)
        </button>
      </section>
    </div>
  )
}
