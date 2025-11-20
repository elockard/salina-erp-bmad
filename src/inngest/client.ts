/**
 * Inngest Client
 *
 * Singleton Inngest client instance for sending events and defining functions.
 * All background jobs and async workflows use this client.
 *
 * @see Story 2.1: Build User Invitation System (email notifications)
 * @see docs/architecture.md:346-363 for Inngest pattern
 */

import { Inngest } from 'inngest'

/**
 * Inngest Client Instance
 *
 * **Configuration:**
 * - ID: 'salina-erp' (unique app identifier)
 * - Event key: From INNGEST_EVENT_KEY env variable (production)
 * - Local development: Uses Inngest Dev Server (no key required)
 *
 * **Usage:**
 * ```typescript
 * // Send event
 * await inngest.send({
 *   name: 'user/invitation.sent',
 *   data: { email, role, tenantId }
 * })
 * ```
 *
 * **Environment Variables:**
 * - INNGEST_EVENT_KEY: Event key for production (get from Inngest dashboard)
 * - INNGEST_SIGNING_KEY: Signing key for webhook verification (production)
 */
export const inngest = new Inngest({
  id: 'salina-erp',
  eventKey: process.env.INNGEST_EVENT_KEY,
})
