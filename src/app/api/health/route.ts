/**
 * Health Check Endpoint
 *
 * Returns application health status for monitoring and deployment verification.
 * Used by deployment platforms (Railway/Fly.io/Render) to verify the app is running.
 *
 * **Checks:**
 * - Database connection (can execute queries)
 * - Basic service availability
 *
 * **Returns:**
 * - 200 OK if all checks pass
 * - 503 Service Unavailable if any check fails
 *
 * @see Story 1.6: Set Up Deployment Infrastructure, Task 4
 */

import { db } from '@/db'
import { sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic' // Disable caching for health checks

export async function GET() {
  try {
    // Check database connection
    await db.execute(sql`SELECT 1`)

    // All checks passed
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'ok',
        },
      },
      { status: 200 }
    )
  } catch (error) {
    // Health check failed
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'error',
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}
