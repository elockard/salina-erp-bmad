/**
 * Sentry Server Configuration
 *
 * Captures server-side errors and sends them to Sentry for monitoring.
 * Only enabled in production when SENTRY_DSN is set.
 *
 * @see Story 1.6: Set Up Deployment Infrastructure, Task 5
 */

import * as Sentry from '@sentry/nextjs'

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
  })
}
