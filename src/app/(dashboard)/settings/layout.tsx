/**
 * Settings Layout
 *
 * Provides tabbed navigation for settings sections:
 * - Company: Branding, locale, usage metrics
 * - Users: User management (greyed out - Story 2.1)
 * - Integrations: Shopify, QuickBooks (greyed out - Epic 9)
 * - Billing: Subscription management (greyed out - post-MVP)
 *
 * @see Story 1.5: Build Tenant Provisioning Workflow (Task 3)
 */

import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization settings and preferences
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8" aria-label="Settings tabs">
          <Link
            href="/settings/company"
            className="whitespace-nowrap border-b-2 border-transparent px-1 py-4 text-sm font-medium text-foreground hover:border-gray-300 hover:text-foreground"
          >
            Company
          </Link>

          {/* Placeholder tabs - disabled for now */}
          <span className="whitespace-nowrap border-b-2 border-transparent px-1 py-4 text-sm font-medium text-muted-foreground opacity-50">
            Users
          </span>
          <span className="whitespace-nowrap border-b-2 border-transparent px-1 py-4 text-sm font-medium text-muted-foreground opacity-50">
            Integrations
          </span>
          <span className="whitespace-nowrap border-b-2 border-transparent px-1 py-4 text-sm font-medium text-muted-foreground opacity-50">
            Billing
          </span>
        </nav>
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  )
}
