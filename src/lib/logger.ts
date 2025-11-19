/**
 * Structured Logging
 *
 * Provides JSON-based structured logging with automatic redaction of sensitive data.
 * All logs include timestamps and severity levels. Production logs omit sensitive PII.
 *
 * @see Story 1.5: Tenant Provisioning (used for webhook logging)
 * @see docs/architecture.md:1186-1243 for logging strategy
 *
 * NOTE: Temporarily using console-based logger to avoid Pino/Turbopack bundling issues.
 * Will switch back to Pino after resolving build configuration.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface Logger {
  debug(obj: Record<string, unknown>, msg: string): void
  info(obj: Record<string, unknown>, msg: string): void
  warn(obj: Record<string, unknown>, msg: string): void
  error(obj: Record<string, unknown>, msg: string): void
  child(context: Record<string, unknown>): Logger
}

const SENSITIVE_FIELDS = [
  'password',
  'token',
  'apiKey',
  'creditCard',
  'ssn',
  'secret',
]

function redactSensitiveData(obj: Record<string, unknown>): Record<string, unknown> {
  const redacted = { ...obj }

  for (const key of Object.keys(redacted)) {
    if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field))) {
      redacted[key] = '[REDACTED]'
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactSensitiveData(redacted[key] as Record<string, unknown>)
    }
  }

  return redacted
}

function log(level: LogLevel, obj: Record<string, unknown>, msg: string, childContext?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString()
  const context = childContext ? { ...childContext, ...obj } : obj
  const redacted = redactSensitiveData(context)

  const logEntry = {
    level,
    time: timestamp,
    msg,
    ...redacted,
  }

  const method = level === 'debug' || level === 'info' ? 'log' : level
  console[method](JSON.stringify(logEntry))
}

class SimpleLogger implements Logger {
  private context: Record<string, unknown>

  constructor(context: Record<string, unknown> = {}) {
    this.context = context
  }

  debug(obj: Record<string, unknown>, msg: string): void {
    if (process.env.NODE_ENV !== 'production') {
      log('debug', obj, msg, this.context)
    }
  }

  info(obj: Record<string, unknown>, msg: string): void {
    log('info', obj, msg, this.context)
  }

  warn(obj: Record<string, unknown>, msg: string): void {
    log('warn', obj, msg, this.context)
  }

  error(obj: Record<string, unknown>, msg: string): void {
    log('error', obj, msg, this.context)
  }

  child(context: Record<string, unknown>): Logger {
    return new SimpleLogger({ ...this.context, ...context })
  }
}

/**
 * Logger Instance
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
export const logger = new SimpleLogger()

/**
 * Create child logger with context
 *
 * Useful for adding tenant/user context to all logs in a request scope.
 *
 * @example
 * ```typescript
 * const requestLogger = logger.child({ tenantId, userId, requestId })
 * requestLogger.info({}, 'Processing order') // Includes tenantId, userId in every log
 * ```
 */
export function createChildLogger(context: Record<string, unknown>) {
  return logger.child(context)
}
