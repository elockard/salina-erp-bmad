/**
 * Clerk Middleware with Tenant Context Integration
 *
 * This middleware handles authentication via Clerk and establishes the tenant context
 * for Row-Level Security (RLS) enforcement. It runs on every request to protected routes.
 *
 * **Critical Integration:** Extracts Clerk Organization ID (orgId) and uses it as the
 * tenant ID for RLS enforcement via withTenantContext().
 *
 * @see Story 1.4: Integrate Clerk Authentication (AC1)
 * @see docs/architecture.md:293-298 for Clerk-RLS integration pattern
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

/**
 * Route Matchers
 *
 * Define which routes require authentication and which are public.
 * Clerk middleware will redirect unauthenticated users to /sign-in.
 */

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/clerk(.*)', // Webhook must be publicly accessible
  '/', // Landing page (will redirect to dashboard if authenticated)
])

/**
 * Clerk Middleware Configuration
 *
 * Integrates Clerk authentication with tenant context for RLS enforcement.
 *
 * **Flow:**
 * 1. Clerk middleware extracts userId and orgId from session
 * 2. If orgId exists, we set it as tenant context for RLS
 * 3. Protected routes redirect to /sign-in if unauthenticated
 * 4. All authenticated requests have tenant context established
 *
 * **Architecture Decision:**
 * - Clerk Organization ID = Salina Tenant ID (1:1 mapping)
 * - orgId is used directly as tenantId for RLS enforcement
 * - No database lookup needed in middleware (performance optimization)
 *
 * **Security:**
 * - Clerk handles session validation and tampering detection
 * - orgId cannot be spoofed by client (server-side session verification)
 * - RLS policies enforce tenant isolation at database layer
 */
export default clerkMiddleware(async (auth, req) => {
  // Extract authentication state from Clerk
  const { userId, orgId } = await auth()

  // Public routes: Allow access without authentication
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  // Protected routes: Require both userId and orgId
  if (!userId || !orgId) {
    // Redirect to sign-in if not authenticated
    // Clerk will automatically redirect back after sign-in
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  /**
   * Tenant Context Propagation
   *
   * We pass the orgId to downstream Server Actions and API routes via headers.
   * This allows Server Actions to call withTenantContext(orgId, ...) without
   * needing to call auth() again.
   *
   * **Note:** We don't call withTenantContext() here in middleware because:
   * 1. Middleware doesn't execute database queries
   * 2. Server Actions/API routes handle their own database connections
   * 3. Session variables are connection-scoped, not request-scoped
   *
   * Instead, Server Actions will extract orgId via auth() and use it with
   * withTenantContext() when executing database operations.
   */

  // Clone response to add custom headers
  const response = NextResponse.next()

  // Add tenant ID to headers for debugging and logging
  // (Server Actions will still use auth().orgId directly)
  response.headers.set('x-tenant-id', orgId)
  response.headers.set('x-user-id', userId)

  return response
})

/**
 * Middleware Configuration
 *
 * Matcher pattern defines which routes this middleware runs on.
 * We use the recommended Clerk pattern that covers:
 * - All app routes (except static files and _next internals)
 * - All API routes (for webhook and future API authentication)
 * - All TRPC routes (if we add tRPC later)
 *
 * **Performance Note:**
 * Middleware runs on Edge Runtime for low latency.
 * Keep this file minimal - no heavy computations or database queries.
 */
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
