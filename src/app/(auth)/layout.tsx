/**
 * Auth Layout Group
 *
 * Layout for authentication pages (sign-in, sign-up).
 * Provides centered card layout with Publishing Ink branding.
 *
 * @see Story 1.4: Integrate Clerk Authentication (AC2)
 */

import { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-amber-50 p-4">
      <div className="w-full max-w-md">
        {/* Publishing Ink Logo/Branding */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">
            Salina ERP
          </h1>
          <p className="text-slate-600 text-sm">
            Modern publishing management for independent publishers
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-8">
          {children}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-500">
          <p>
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}
