/**
 * Inngest API Route
 *
 * Serves Inngest functions and handles event delivery.
 * This endpoint is called by Inngest to execute background jobs.
 *
 * **Endpoints:**
 * - POST /api/inngest: Execute function invocation
 * - GET /api/inngest: Inngest dashboard introspection
 * - PUT /api/inngest: Function registration
 *
 * @see Story 2.1: Build User Invitation System (email notifications)
 * @see https://www.inngest.com/docs/sdk/serve for Inngest serve API
 */

import { serve } from 'inngest/next'
import { inngest } from '@/inngest/client'
import { sendInvitationEmail } from '@/inngest/functions/email-notifications'

/**
 * Inngest Handler
 *
 * Registers all Inngest functions and handles event execution.
 *
 * **Functions:**
 * - sendInvitationEmail: Email notification for user invitations
 *
 * **Configuration:**
 * - Client: inngest (from inngest/client.ts)
 * - Functions: Array of all Inngest function definitions
 * - Signing key: INNGEST_SIGNING_KEY (production only)
 *
 * **Local Development:**
 * Run Inngest Dev Server: `npx inngest-cli@latest dev`
 * Functions will be automatically registered and visible in dashboard.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    sendInvitationEmail,
    // Future functions will be added here:
    // sendPasswordResetEmail,
    // sendOrderConfirmationEmail,
    // processInventoryUpdate,
    // etc.
  ],
})
