/**
 * Row-Level Security (RLS) Integration Tests
 *
 * Tests for Story 1.3: Implement RLS Infrastructure
 *
 * These tests verify:
 * - withTenantContext() wrapper sets session variable correctly
 * - RLS policies enforce tenant data isolation
 * - Cross-tenant access is blocked at database level
 * - Session variables are properly scoped and cleaned up
 *
 * Prerequisites:
 * - Docker services must be running (docker-compose up -d)
 * - DATABASE_URL must be set in .env.local
 * - tenants table with RLS policy must be migrated
 * - 'authenticated' role must exist in PostgreSQL
 *
 * @see Story 1.3 AC4: RLS Enforcement Verification
 * @see docs/architecture.md:1501-1527 for RLS pattern
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, sql } from 'drizzle-orm'
import { tenants } from '../../db/schema/tenants'
import {
  withTenantContext,
  getTenantContext,
  clearTenantContext,
} from '../../db/tenant-context'

// Test-specific database connection with explicit configuration
// Avoid system defaults by specifying all connection parameters
const testClient = postgres({
  host: 'localhost',
  port: 5432,
  database: 'salina_dev',
  username: 'postgres',
  password: 'postgres',
  max: 10, // Fewer connections for testing
  idle_timeout: 20,
  connect_timeout: 10,
})

const db = drizzle(testClient, { logger: false })

// Test fixtures: Two test tenants for isolation verification
// Using fixed UUIDs for predictable testing
const testTenant1Id = '11111111-1111-1111-1111-111111111111'
const testTenant2Id = '22222222-2222-2222-2222-222222222222'

describe('RLS Integration Tests', () => {
  beforeAll(async () => {
    // Reset role to postgres (superuser) to bypass RLS for setup check
    await testClient`RESET ROLE`

    // Test tenants should exist from manual setup
    // Verify they exist (bypass RLS for this check)
    const tenants_check = await testClient`
      SELECT COUNT(*) as count FROM tenants
      WHERE id IN (${testTenant1Id}, ${testTenant2Id})
    `

    if (Number(tenants_check[0].count) !== 2) {
      throw new Error(`Test tenants not found. Expected 2, got ${tenants_check[0].count}. Please ensure test tenants are created.`)
    }

    // Set role to authenticated for all subsequent test queries
    // This ensures RLS policies apply to all test database operations
    await testClient`SET ROLE authenticated`
  })

  afterAll(async () => {
    // Test tenants are persistent - do not delete them
    // They will be reused across test runs for efficiency

    // Close test connection
    await testClient.end()
  })

  beforeEach(async () => {
    // Ensure clean state before each test
    await clearTenantContext()
  })

  describe('AC1: withTenantContext() Wrapper Function', () => {
    it('should execute callback successfully', async () => {
      // Test that withTenantContext executes the callback
      const result = await withTenantContext(testTenant1Id, async (tx) => {
        return 'success'
      })
      expect(result).toBe('success')
    })

    it('should enable RLS filtering within context', async () => {
      // Test that queries within context are filtered by RLS
      // This indirectly verifies the session variable is set
      const result = await withTenantContext(testTenant1Id, async (tx) => {
        return await tx
          .select()
          .from(tenants)
          .where(eq(tenants.id, testTenant1Id))
      })

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(testTenant1Id)
    })

    it('should handle errors and propagate them', async () => {
      // Test error handling: errors should be propagated with tenant context
      await expect(
        withTenantContext(testTenant1Id, async (tx) => {
          throw new Error('Test error')
        })
      ).rejects.toThrow('[Tenant:')
      // Error message should include tenant ID for debugging
    })

    it('should validate tenantId is a valid UUID', async () => {
      // Test input validation: invalid UUID should throw error
      await expect(
        withTenantContext('invalid-uuid', async () => {
          // This should never execute
        })
      ).rejects.toThrow('Invalid tenantId format')
    })

    it('should require non-empty tenantId', async () => {
      // Test input validation: empty string should throw error
      await expect(
        withTenantContext('', async () => {
          // This should never execute
        })
      ).rejects.toThrow('tenantId must be a non-empty string')
    })

    it('should preserve callback return value', async () => {
      // Test that withTenantContext returns callback result
      const result = await withTenantContext(testTenant1Id, async (tx) => {
        return { success: true, data: 'test' }
      })

      expect(result).toEqual({ success: true, data: 'test' })
    })
  })

  describe('AC4: RLS Enforcement Verification', () => {
    it('Test 1: Query with correct tenant_id returns data', async () => {
      // Positive test: Tenant should see their own data
      const result = await withTenantContext(testTenant1Id, async (tx) => {
        return await tx
          .select()
          .from(tenants)
          .where(eq(tenants.id, testTenant1Id))
      })

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(testTenant1Id)
      expect(result[0].name).toBe('Test Publisher 1')
    })

    it('Test 2: Query with different tenant_id returns empty results', async () => {
      // Negative test: Tenant 1 context should NOT see Tenant 2 data
      const result = await withTenantContext(testTenant1Id, async (tx) => {
        return await tx
          .select()
          .from(tenants)
          .where(eq(tenants.id, testTenant2Id)) // Trying to query Tenant 2 data
      })

      // RLS should block this query, returning empty results
      expect(result).toHaveLength(0)
    })

    it('Test 3: Query without tenant context returns empty results', async () => {
      // Test that queries without withTenantContext are blocked by RLS
      // When app.current_tenant_id is not set, RLS policy cannot match
      const result = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, testTenant1Id))

      // RLS should block access when tenant context is not set
      expect(result).toHaveLength(0)
    })

    it('Test 4: withTenantContext wrapper correctly isolates data', async () => {
      // Test complete isolation: Two separate contexts should each see only their data
      const tenant1Result = await withTenantContext(testTenant1Id, async (tx) => {
        return await tx.select().from(tenants)
      })

      const tenant2Result = await withTenantContext(testTenant2Id, async (tx) => {
        return await tx.select().from(tenants)
      })

      // Each tenant should see exactly 1 record (their own)
      expect(tenant1Result).toHaveLength(1)
      expect(tenant1Result[0].id).toBe(testTenant1Id)

      expect(tenant2Result).toHaveLength(1)
      expect(tenant2Result[0].id).toBe(testTenant2Id)
    })

    it('Test 5: Sequential contexts do not leak data', async () => {
      // Test that sequential withTenantContext calls don't leak context
      // First query for Tenant 1
      const result1 = await withTenantContext(testTenant1Id, async (tx) => {
        return await tx.select().from(tenants)
      })

      expect(result1).toHaveLength(1)
      expect(result1[0].id).toBe(testTenant1Id)

      // Second query for Tenant 2 (should have clean context)
      const result2 = await withTenantContext(testTenant2Id, async (tx) => {
        return await tx.select().from(tenants)
      })

      expect(result2).toHaveLength(1)
      expect(result2[0].id).toBe(testTenant2Id)

      // Verify no context leakage - outside withTenantContext should return empty
      const result3 = await db.select().from(tenants)
      expect(result3).toHaveLength(0)
    })

    it('Test 6: Multiple queries within same context share tenant_id', async () => {
      // Test that all queries within same withTenantContext share session variable
      await withTenantContext(testTenant1Id, async (tx) => {
        // First query
        const result1 = await tx.select().from(tenants)
        expect(result1).toHaveLength(1)

        // Second query (should still have same context)
        const result2 = await tx
          .select()
          .from(tenants)
          .where(eq(tenants.id, testTenant1Id))
        expect(result2).toHaveLength(1)

        // Both queries should return same tenant
        expect(result1[0].id).toBe(result2[0].id)
      })
    })

    it('Test 7: RLS blocks UPDATE operations on other tenants', async () => {
      // Test that RLS prevents updating another tenant's data
      await withTenantContext(testTenant1Id, async (tx) => {
        // Attempt to update Tenant 2's name from Tenant 1 context
        const updateResult = await tx
          .update(tenants)
          .set({ name: 'Hacked Name' })
          .where(eq(tenants.id, testTenant2Id))
          .returning()

        // RLS should block this update, returning empty array
        expect(updateResult).toHaveLength(0)
      })

      // Verify Tenant 2's name was not changed
      const tenant2 = await withTenantContext(testTenant2Id, async (tx) => {
        return await tx
          .select()
          .from(tenants)
          .where(eq(tenants.id, testTenant2Id))
      })

      expect(tenant2[0].name).toBe('Test Publisher 2') // Original name preserved
    })

    it('Test 8: RLS blocks DELETE operations on other tenants', async () => {
      // Test that RLS prevents deleting another tenant's data
      await withTenantContext(testTenant1Id, async (tx) => {
        // Attempt to delete Tenant 2 from Tenant 1 context
        const deleteResult = await tx
          .delete(tenants)
          .where(eq(tenants.id, testTenant2Id))
          .returning()

        // RLS should block this delete, returning empty array
        expect(deleteResult).toHaveLength(0)
      })

      // Verify Tenant 2 still exists
      const tenant2Exists = await withTenantContext(testTenant2Id, async (tx) => {
        return await tx
          .select()
          .from(tenants)
          .where(eq(tenants.id, testTenant2Id))
      })

      expect(tenant2Exists).toHaveLength(1) // Tenant 2 still exists
    })
  })

  describe('AC2: RLS Policy Template Verification', () => {
    it('should have RLS enabled on tenants table', async () => {
      // Verify RLS is enabled at database level
      const result = await db.execute<{ relrowsecurity: boolean }>(
        sql`SELECT relrowsecurity FROM pg_class WHERE relname = 'tenants'`
      )

      expect(result).toHaveLength(1)
      expect(result[0].relrowsecurity).toBe(true)
    })

    it('should have tenants_tenant_isolation policy defined', async () => {
      // Verify RLS policy exists with correct configuration
      const result = await db.execute<{
        policyname: string
        cmd: string
        roles: string[]
      }>(
        sql`SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'tenants' AND policyname = 'tenants_tenant_isolation'`
      )

      expect(result).toHaveLength(1)
      expect(result[0].policyname).toBe('tenants_tenant_isolation')
      expect(result[0].cmd).toBe('ALL') // Policy applies to all operations
      expect(result[0].roles).toContain('authenticated') // Policy applies to authenticated role
    })

    it('should have policy using current_setting for tenant_id', async () => {
      // Verify policy USING clause references app.current_tenant_id
      const result = await db.execute<{ polqual: string }>(
        sql`SELECT pg_get_expr(polqual, polrelid) as polqual FROM pg_policy WHERE polname = 'tenants_tenant_isolation'`
      )

      expect(result).toHaveLength(1)
      const policyExpression = result[0].polqual

      // Policy should reference current_setting('app.current_tenant_id')
      expect(policyExpression).toContain('current_setting')
      expect(policyExpression).toContain('app.current_tenant_id')
      expect(policyExpression).toContain('tenant_id')
    })
  })

  describe('Utility Functions', () => {
    it('clearTenantContext should not throw errors', async () => {
      // Test that clearTenantContext is safe to call anytime
      await expect(clearTenantContext()).resolves.not.toThrow()
    })
  })
})
