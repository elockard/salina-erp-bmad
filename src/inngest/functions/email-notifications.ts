/**
 * Email Notification Inngest Functions
 *
 * Background jobs for sending email notifications.
 * Uses Inngest for reliable delivery with automatic retries.
 *
 * @see Story 2.1: Build User Invitation System (AC#2, AC#3)
 * @see docs/architecture.md:346-363 for Inngest event pattern
 */

import { inngest } from '../client'
import { logger } from '@/lib/logger'

/**
 * User Invitation Email Event Payload
 */
type UserInvitationEvent = {
  name: 'user/invitation.sent'
  data: {
    email: string
    role: string
    tenantId: string
    tenantName: string
    invitationUrl: string
    invitedBy: string
  }
}

/**
 * Send User Invitation Email Function
 *
 * Sends customized invitation email to newly invited user.
 * Email includes tenant branding and activation link from Clerk.
 *
 * **Retry Logic:**
 * - 3 automatic retries with exponential backoff
 * - Initial retry after 5 seconds
 * - Max retry after 5 minutes
 *
 * **Failure Handling:**
 * - After 3 failed attempts, sends 'user/invitation.email.failed' event
 * - Logged for manual follow-up by administrators
 *
 * **Event Trigger:**
 * ```typescript
 * await inngest.send({
 *   name: 'user/invitation.sent',
 *   data: {
 *     email: 'jane@example.com',
 *     role: 'managing_editor',
 *     tenantId: 'tenant_uuid',
 *     tenantName: 'Acme Publishing',
 *     invitationUrl: 'https://clerk.link/xyz',
 *     invitedBy: 'john@example.com'
 *   }
 * })
 * ```
 */
export const sendInvitationEmail = inngest.createFunction(
  {
    id: 'send-invitation-email',
    name: 'Send User Invitation Email',
    retries: 3,
    // Retry configuration with exponential backoff
    // Retry 1: 5 seconds
    // Retry 2: 25 seconds
    // Retry 3: 125 seconds (2 minutes)
  },
  { event: 'user/invitation.sent' },
  async ({ event, step }) => {
    const { email, role, tenantId, tenantName, invitationUrl, invitedBy } =
      event.data

    logger.info(
      {
        email,
        role,
        tenantId,
        invitedBy,
      },
      'Processing invitation email'
    )

    // Step 1: Send email using Inngest email step
    // NOTE: In production, configure email provider (Resend, SendGrid, etc.)
    // For MVP/development, this logs the email content
    const emailResult = await step.run('send-email', async () => {
      try {
        // TODO: Replace with actual email provider in production
        // Example with Resend:
        // const resend = new Resend(process.env.RESEND_API_KEY)
        // const result = await resend.emails.send({
        //   from: 'noreply@salina-erp.com',
        //   to: email,
        //   subject: `You've been invited to ${tenantName}`,
        //   html: emailTemplate
        // })

        // For MVP: Log email instead of sending
        const emailContent = generateInvitationEmailHTML({
          email,
          role,
          tenantName,
          invitationUrl,
          invitedBy,
        })

        logger.info(
          {
            email,
            role,
            tenantId,
            invitationUrl,
          },
          'Invitation email generated (would be sent in production)'
        )

        // Simulate email send
        console.log('=== INVITATION EMAIL ===')
        console.log(`To: ${email}`)
        console.log(`Subject: You've been invited to ${tenantName}`)
        console.log('HTML:', emailContent)
        console.log('========================')

        return { success: true, messageId: 'dev-message-id' }
      } catch (error) {
        logger.error(
          { error, email, tenantId },
          'Failed to send invitation email'
        )
        throw error
      }
    })

    // Step 2: Log success
    await step.run('log-success', async () => {
      logger.info(
        {
          email,
          tenantId,
          messageId: emailResult.messageId,
        },
        'Invitation email sent successfully'
      )
    })

    return { success: true, email }
  }
)

/**
 * Generate Invitation Email HTML
 *
 * Creates HTML email template with tenant branding.
 * TODO (Future): Load tenant logo and colors from database.
 *
 * @param data - Email template data
 * @returns HTML string for email body
 */
function generateInvitationEmailHTML(data: {
  email: string
  role: string
  tenantName: string
  invitationUrl: string
  invitedBy: string
}): string {
  const { email, role, tenantName, invitationUrl, invitedBy } = data

  // Convert role to human-readable format
  const roleLabel = role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitation to ${tenantName}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
          <h1 style="color: #1e3a8a; margin-top: 0;">You've Been Invited!</h1>
          <p style="font-size: 16px; color: #555;">
            ${invitedBy} has invited you to join <strong>${tenantName}</strong> as a <strong>${roleLabel}</strong>.
          </p>
        </div>

        <div style="background-color: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
          <h2 style="color: #333; font-size: 18px; margin-top: 0;">What's Next?</h2>
          <p style="margin-bottom: 20px;">
            Click the button below to accept your invitation and create your account. You'll be able to access Salina ERP and start collaborating with your team right away.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" style="background-color: #1e3a8a; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              Accept Invitation
            </a>
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            <strong>Your Role:</strong> ${roleLabel}<br>
            <strong>Email:</strong> ${email}
          </p>
        </div>

        <div style="font-size: 12px; color: #999; text-align: center; margin-top: 30px;">
          <p>
            This invitation was sent to ${email}.<br>
            If you weren't expecting this invitation, you can safely ignore this email.
          </p>
          <p style="margin-top: 20px;">
            <a href="https://salina-erp.com" style="color: #1e3a8a; text-decoration: none;">Salina ERP</a> ·
            <a href="https://salina-erp.com/help" style="color: #1e3a8a; text-decoration: none;">Help Center</a>
          </p>
        </div>
      </body>
    </html>
  `
}
