/**
 * Sign-In Page
 *
 * Clerk-powered sign-in page with Publishing Ink theme customization.
 * Uses Clerk's <SignIn /> component with custom appearance configuration.
 *
 * **Route Pattern:** [[...sign-in]]
 * - Catch-all route allows Clerk to handle multi-step flows (e.g., /sign-in/factor-one)
 * - Double brackets make it optional (supports both /sign-in and /sign-in/*)
 *
 * **Redirect Flow:**
 * - After sign-in → /dashboard (or return URL if specified)
 * - If user needs to create organization → Clerk prompts during sign-up
 *
 * @see Story 1.4: Integrate Clerk Authentication (AC2)
 * @see docs/architecture.md:277-298 for Clerk configuration
 */

import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center">
      <SignIn
        appearance={{
          elements: {
            // Publishing Ink theme colors
            formButtonPrimary: 'bg-blue-900 hover:bg-blue-800 text-white',
            formFieldInput: 'border-slate-300 focus:border-blue-900 focus:ring-blue-900',
            footerActionLink: 'text-blue-900 hover:text-blue-700',
            card: 'shadow-none', // Remove default shadow (parent div has it)
          },
        }}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        // Redirect to dashboard after successful sign-in
        forceRedirectUrl="/dashboard"
      />
    </div>
  )
}
