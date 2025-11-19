/**
 * Dashboard Page (Placeholder)
 *
 * Main dashboard landing page after authentication.
 * This is a placeholder for Epic 10 (Dashboards & Reporting).
 *
 * Currently displays welcome message and confirms authentication works.
 *
 * @see Epic 10, Story 10.1: Build Publisher/Owner Dashboard
 */

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  // Verify authentication (middleware should handle this, but double-check)
  const { userId, orgId } = await auth()

  if (!userId || !orgId) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-900 mb-4">
          Welcome to Salina ERP
        </h1>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">
            Authentication Successful ✅
          </h2>
          <div className="space-y-2 text-sm text-slate-600">
            <p>
              <strong>User ID:</strong> {userId}
            </p>
            <p>
              <strong>Organization ID (Tenant ID):</strong> {orgId}
            </p>
            <p className="mt-4 text-amber-700">
              📋 This is a placeholder dashboard. Full dashboard with KPIs,
              charts, and reports will be implemented in Epic 10.
            </p>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Next Steps:
          </h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
            <li>Story 1.5: Tenant provisioning and settings</li>
            <li>Story 1.6: Deployment infrastructure</li>
            <li>Epic 2: User invitations and RBAC</li>
            <li>Epic 3: ISBN block management</li>
            <li>Epic 4: Title management</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
