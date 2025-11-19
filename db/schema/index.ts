/**
 * Database Schema Index
 *
 * Central export point for all database schemas.
 * Import schemas from here for use in queries and Server Actions.
 *
 * Usage:
 * ```typescript
 * import { tenantFields } from '@/db/schema'
 * ```
 */

export * from './base'
export * from './tenants' // Story 1.3: RLS Infrastructure

// Future schema exports will be added here as stories progress:
// export * from './users' (Story 1.4)
// export * from './isbn-blocks' (Epic 3)
// export * from './titles' (Epic 4)
// export * from './orders' (Epic 8)
