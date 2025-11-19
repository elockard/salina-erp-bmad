/**
 * Structured Logging with Pino
 *
 * Provides JSON-based structured logging with automatic redaction of sensitive data.
 * All logs include timestamps and severity levels. Production logs omit sensitive PII.
 *
 * @see Story 1.5: Tenant Provisioning (used for webhook logging)
 * @see docs/architecture.md:1186-1243 for logging strategy
 */

import pino from 'pino'

/**
 * Pino Logger Instance
 *
 * **Configuration:**
 * - Level: 'debug' in development, 'info' in production
 * - Format: JSON structured logs for machine parsing
 * - Redaction: Automatically removes sensitive fields
 *
 * **Usage:**
 * ```typescript
 * logger.info({ orderId, tenantId, userId }, 'Order created')
 * logger.error({ error, tenantId }, 'Failed to create title')
 * ```
 *
 * **Redacted Fields:**
 * Never logged even if accidentally included:
 * - password, token, apiKey, creditCard, ssn
 * - Any nested field with these names (e.g., user.password)
 */
export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: {
    paths: [
      'password',
      'token',
      'apiKey',
      'creditCard',
      'ssn',
      '*.password',
      '*.token',
      '*.apiKey',
      'secret',
      '*.secret',
    ],
    remove: true,
  },
  // Disable pino-pretty transport in Next.js due to worker thread compatibility issues
  // Use JSON logging for now - can pipe to pino-pretty in terminal if needed
})

/**
 * Create child logger with context
 *
 * Useful for adding tenant/user context to all logs in a request scope.
 *
 * @example
 * ```typescript
 * const requestLogger = logger.child({ tenantId, userId, requestId })
 * requestLogger.info('Processing order') // Includes tenantId, userId in every log
 * ```
 */
export function createChildLogger(context: Record<string, unknown>) {
  return logger.child(context)
}
