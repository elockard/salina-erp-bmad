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
export * from './tenant-features' // Story 1.5: Tenant Provisioning
export * from './users' // Story 2.1: User Invitation System

// Future schema exports will be added here as stories progress:
// export * from './isbn-blocks' (Epic 3)
// export * from './titles' (Epic 4)
// export * from './orders' (Epic 8)
