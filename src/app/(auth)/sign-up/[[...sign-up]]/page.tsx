/**
 * Sign-Up Page
 *
 * Clerk-powered sign-up page with Organization creation flow.
 * Uses Clerk's <SignUp /> component configured for multi-tenant onboarding.
 *
 * **Organization Creation:**
 * - During sign-up, Clerk prompts user to create an organization
 * - Organization = Publisher/Tenant in Salina ERP (1:1 mapping)
 * - Organization creation triggers Clerk webhook → tenant provisioning (Story 1.5)
 *
 * **Redirect Flow:**
 * - After sign-up → /onboarding (future guided setup wizard)
 * - Webhook creates tenant record in background
 * - Onboarding wizard helps configure ISBN blocks, roles, integrations
 *
 * **Route Pattern:** [[...sign-up]]
 * - Catch-all route supports multi-step flows (email verification, org creation, etc.)
 *
 * @see Story 1.4: Integrate Clerk Authentication (AC2, AC3)
 * @see Story 1.5: Tenant provisioning via webhook
 */

import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center">
      <SignUp
        appearance={{
          elements: {
            // Publishing Ink theme colors (match sign-in)
            formButtonPrimary: 'bg-blue-900 hover:bg-blue-800 text-white',
            formFieldInput: 'border-slate-300 focus:border-blue-900 focus:ring-blue-900',
            footerActionLink: 'text-blue-900 hover:text-blue-700',
            card: 'shadow-none',
          },
        }}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        // Redirect to onboarding wizard after successful sign-up
        // (Future: Epic 10, Story 10.5 - Guided Onboarding Wizard)
        forceRedirectUrl="/dashboard"
      />
    </div>
  )
}
