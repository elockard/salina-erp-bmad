# System-Level Test Design - Salina Bookshelf ERP

**Date:** 2025-11-18
**Author:** BMad
**Project:** Salina Bookshelf ERP
**Phase:** Phase 3 - Solutioning (Testability Review)
**Status:** Draft

---

## Executive Summary

This system-level testability assessment reviews the Salina Bookshelf ERP architecture for test readiness before the solutioning gate check. The architecture demonstrates **strong testability** with minor concerns that should be addressed in Sprint 0.

**Overall Assessment:** ✅ **PASS with RECOMMENDATIONS**

**Key Findings:**
- Excellent architectural decisions for testability (Server Actions, Drizzle ORM, type safety)
- Comprehensive test strategy already documented (Vitest + Playwright)
- Strong multi-tenant isolation enables parallel test execution
- Minor concerns around RLS testing complexity and real-time testing infrastructure

**Recommendation:** Proceed to epic breakdown and implementation with Sprint 0 focus on test infrastructure setup.

---

## Testability Assessment

### Controllability: ✅ PASS

**Can we control system state for testing?**

**Strengths:**
- ✅ **Server Actions with TypeScript** - Deterministic, type-safe mutations make test setup predictable
- ✅ **Drizzle ORM** - Type-safe queries with programmatic control over database state
- ✅ **Row-Level Security (RLS) with context wrapper** - `withTenantContext()` allows precise tenant isolation in tests
- ✅ **Zod Validation** - Shared client/server schemas enable consistent test data factories
- ✅ **Dependency Injection Ready** - Clerk auth, Inngest jobs, Ably channels are all mockable
- ✅ **Database Transactions** - Drizzle supports test rollback patterns for isolated test runs
- ✅ **Factories Pattern Documented** - Architecture mentions test DB for RLS validation

**Test Controllability Mechanisms:**
```typescript
// Test setup example
await withTenantContext(testTenantId, async () => {
  await db.insert(titles).values(titleFactory())
  await db.insert(formats).values(formatFactory())
  // Tests run in isolated tenant context
})
```

**External Dependencies (Mockable):**
- ✅ Shopify SDK - HTTP client, easily mocked
- ✅ EasyPost API - HTTP requests, stub responses
- ✅ QuickBooks Exports - File generation, assert file content
- ✅ Ably WebSocket - Channel publish/subscribe, mock in tests
- ✅ Inngest Jobs - Event-driven, trigger directly in tests
- ✅ S3 Uploads - Presigned URLs, mock AWS SDK

**Fault Injection:**
- ✅ Can simulate inventory shortages (update `inventory.quantity` in test DB)
- ✅ Can trigger rate limit errors (mock Redis responses)
- ✅ Can inject Shopify webhook failures (Inngest retry logic testable)
- ✅ Can simulate database errors (throw in transaction)

**Rating:** 9/10 - Excellent controllability

---

### Observability: ✅ PASS

**Can we inspect system state for test validation?**

**Strengths:**
- ✅ **Pino Structured Logging** - Queryable JSON logs with tenant/user context
- ✅ **Server Action Return Types** - `{ success: true, data } | { success: false, error }` makes assertions straightforward
- ✅ **Drizzle Query Builder** - Direct database inspection in tests
- ✅ **Sentry Error Tracking** - Errors automatically captured with context
- ✅ **TanStack Query Devtools** - Client-side cache inspection during E2E tests
- ✅ **Real-Time Events (Ably)** - Channel subscriptions observable in tests
- ✅ **Deterministic ISBNs** - Modulo 10 check-digit calculation is pure function (no randomness)

**Observability Mechanisms:**
```typescript
// Test assertion example
const result = await fulfillOrder(orderId)
assert(result.success === true)

// Database state inspection
const inventory = await db.select().from(inventory).where(eq(inventory.sku, 'SKU-001'))
assert(inventory[0].quantity === 95) // Decreased by 5

// Log inspection (test mode)
const logs = logger.getLogs({ tenantId: testTenantId, level: 'error' })
assert(logs.length === 0) // No errors logged
```

**Test Result Determinism:**
- ✅ No race conditions (RLS isolates tenant data)
- ✅ Clear success/failure indicators (discriminated unions)
- ✅ Timestamps controllable (freeze time in tests)
- ✅ UUIDs deterministic (use factories with known IDs)

**NFR Validation:**
- ✅ Performance metrics - Sentry transaction traces
- ✅ Security audit logs - Clerk logs auth events
- ✅ Error rates - Pino logs + Sentry dashboards
- ✅ Real-time latency - Ably message timestamps

**Rating:** 9/10 - Excellent observability

---

### Reliability: ⚠️ CONCERNS

**Are tests isolated, parallel-safe, and reproducible?**

**Strengths:**
- ✅ **Tenant Isolation via RLS** - Tests for different tenants can run in parallel without interference
- ✅ **Stateless Server Components** - React Server Components don't hold state across requests
- ✅ **Transaction Rollback Pattern** - Drizzle supports `db.transaction()` with rollback for test cleanup
- ✅ **Deterministic Factories** - faker.js with seeds for reproducible test data
- ✅ **No Global State** - All state scoped by tenant ID

**Concerns:**
- ⚠️ **RLS Policy Complexity** - Testing RLS policies requires careful setup of `app.current_tenant_id` session variable
  - **Risk:** Test failures due to missing tenant context
  - **Mitigation:** Mandatory `withTenantContext()` wrapper, unit tests for RLS policies

- ⚠️ **Real-Time Testing (Ably)** - WebSocket connections add async complexity
  - **Risk:** Flaky tests due to timing issues
  - **Mitigation:** Mock Ably in unit/API tests, only E2E tests use real WebSocket, add wait helpers

- ⚠️ **Background Jobs (Inngest)** - Async job execution can cause test timing issues
  - **Risk:** Tests finish before jobs complete
  - **Mitigation:** Mock Inngest in tests, use `step.waitForEvent()` in E2E tests, run jobs synchronously in test mode

- ⚠️ **Global ISBNs Table (No RLS)** - Uniqueness constraint across all tenants
  - **Risk:** Test ISBNs collide across parallel test runs
  - **Mitigation:** Use unique prefixes per test run (`978-9-TEST{timestamp}`), cleanup after tests

**Isolation Patterns:**
```typescript
// Test isolation via tenant context
test('fulfillOrder decrements inventory', async () => {
  const testTenantId = uuid()

  await withTenantContext(testTenantId, async () => {
    // Setup test data (isolated to this tenant)
    const order = await createTestOrder()

    // Execute
    await fulfillOrder(order.id)

    // Assert (only this tenant's data visible)
    const inv = await db.select().from(inventory).where(eq(inventory.sku, order.sku))
    expect(inv[0].quantity).toBe(95)
  })

  // Cleanup (delete test tenant data)
  await db.delete(tenants).where(eq(tenants.id, testTenantId))
})
```

**Reproducibility:**
- ✅ Deterministic data with faker seeds
- ✅ Database migrations consistent
- ✅ No external API calls in unit/integration tests (all mocked)
- ⚠️ E2E tests may need HAR file replay for Shopify webhooks

**Rating:** 7/10 - Good reliability with documented mitigations needed

---

## Architecturally Significant Requirements (ASRs)

These quality requirements drive architectural decisions and require special test infrastructure:

### ASR-1: Multi-Tenant Data Isolation (CRITICAL)

**Requirement:** "Multi-tenant architecture with complete data isolation" (FR2)

**Architectural Impact:**
- Drives RLS policy design
- Requires `tenant_id` on all tables
- Mandates `withTenantContext()` wrapper

**Test Strategy:**
- **P0 Risk:** Cross-tenant data leak (Score: 9 - Probability 3 × Impact 3)
- **Test Approach:**
  - Unit tests: RLS policy enforcement per table
  - Integration tests: Verify `withTenantContext()` blocks cross-tenant queries
  - E2E tests: Multi-tenant simulation (2+ tenants operating simultaneously)
- **Tools:** Vitest (unit), Playwright (E2E with multiple user sessions)
- **Acceptance:** 100% of RLS policies tested, 0 cross-tenant data leaks

**Scoring:**
- **Probability:** 2 (Possible - developer might forget `withTenantContext()`)
- **Impact:** 3 (Critical - data exposure, compliance violation)
- **Score:** 6 (High Priority)

---

### ASR-2: ISBN Global Uniqueness (HIGH)

**Requirement:** "System validates ISBN uniqueness across all tenants globally" (FR21)

**Architectural Impact:**
- Separate `isbns` table WITHOUT RLS
- Global uniqueness constraint
- Cross-tenant collision detection

**Test Strategy:**
- **P0 Risk:** Duplicate ISBN assigned to different publishers (Score: 6)
- **Test Approach:**
  - Unit tests: `generateISBNBlock()` creates unique ISBNs
  - Integration tests: Attempt to create duplicate ISBN across tenants (should fail)
  - E2E tests: Concurrent ISBN assignment from multiple tenants
- **Tools:** Vitest (unit), concurrent test runners
- **Acceptance:** 0 duplicate ISBNs ever created

**Scoring:**
- **Probability:** 2 (Possible - race condition during concurrent creation)
- **Impact:** 3 (Critical - publishing industry catastrophe, legal issues)
- **Score:** 6 (High Priority)

---

### ASR-3: Real-Time Inventory Updates (MEDIUM)

**Requirement:** "Inventory query <500ms, real-time updates across browser sessions" (UX Performance Target)

**Architectural Impact:**
- Ably WebSocket integration
- TanStack Query cache invalidation
- Optimistic UI updates

**Test Strategy:**
- **P1 Risk:** Stale inventory causing overselling (Score: 6)
- **Test Approach:**
  - Unit tests: Cache invalidation logic
  - Integration tests: Ably message publish triggers query refetch
  - E2E tests: Multi-tab inventory sync (Playwright with multiple contexts)
  - Performance tests: Inventory query latency <500ms under load
- **Tools:** Vitest, Playwright (multi-context), k6 (load testing)
- **Acceptance:** <500ms query latency, 100% cache invalidation on inventory change

**Scoring:**
- **Probability:** 2 (Possible - timing issue in real-time sync)
- **Impact:** 3 (Critical - overselling leads to customer dissatisfaction)
- **Score:** 6 (High Priority)

---

### ASR-4: Shopify Order Pipeline Reliability (HIGH)

**Requirement:** "System imports Shopify orders automatically with inventory verification" (FR68, FR87)

**Architectural Impact:**
- Inngest job with 3 retries
- Transaction-based inventory hold
- Webhook signature verification

**Test Strategy:**
- **P0 Risk:** Order import fails silently, inventory desync (Score: 6)
- **Test Approach:**
  - Unit tests: Webhook signature validation
  - Integration tests: Inngest job execution with retries, inventory transaction rollback
  - E2E tests: End-to-end Shopify webhook simulation (ngrok + test shop)
  - Chaos tests: Network failures, database timeouts during import
- **Tools:** Vitest, Inngest Dev Server, Shopify test shop
- **Acceptance:** 100% webhook verification, 3 retries on failure, inventory always consistent

**Scoring:**
- **Probability:** 2 (Possible - external API failures, network issues)
- **Impact:** 3 (Critical - revenue loss, customer orders lost)
- **Score:** 6 (High Priority)

---

### ASR-5: RBAC Field-Level Permissions (MEDIUM)

**Requirement:** "8 user roles with field-level permissions (e.g., Sales sees price but not cost)" (FR13, FR17)

**Architectural Impact:**
- Clerk custom roles
- Application-layer permission checks (`canSeeCosts()`)
- Conditional rendering in UI

**Test Strategy:**
- **P1 Risk:** Unauthorized access to sensitive data (Score: 6)
- **Test Approach:**
  - Unit tests: Permission helper functions (`canEditTitle()`, `canSeeCosts()`)
  - Integration tests: Server Actions enforce permissions (403 Forbidden)
  - E2E tests: Role-based UI rendering (Playwright with different user roles)
- **Tools:** Vitest, Playwright (multi-user sessions)
- **Acceptance:** 100% permission checks enforced, 0 unauthorized data exposure

**Scoring:**
- **Probability:** 2 (Possible - developer forgets permission check)
- **Impact:** 3 (Critical - security violation, data exposure)
- **Score:** 6 (High Priority)

---

### ASR-6: Performance Under Multi-Tenant Load (MEDIUM)

**Requirement:** "Support multiple publishers with 50-500 titles efficiently" (Success Criteria)

**Architectural Impact:**
- Database indexes (tenant_id + status)
- Connection pooling (pgBouncer, 100 connections)
- Multi-layer caching (TanStack Query, Redis)

**Test Strategy:**
- **P1 Risk:** Performance degradation at scale (Score: 4)
- **Test Approach:**
  - Load tests: 50 concurrent tenants, 500 titles each (k6)
  - Stress tests: 100 simultaneous orders (k6)
  - Soak tests: 24-hour sustained load (k6)
  - Database query profiling (slow query log)
- **Tools:** k6, pgBadger (query analysis)
- **Acceptance:** <500ms inventory queries, <1.5s dashboard load, <2s page load

**Scoring:**
- **Probability:** 2 (Possible - inefficient queries under load)
- **Impact:** 2 (Degraded - slow UX, but system functional)
- **Score:** 4 (Medium Priority)

---

## Test Levels Strategy

Based on architecture (Next.js web app + API + database), recommended test distribution:

### Test Pyramid (70/20/10)

```
         /\
        /E2E\ 10% - Critical user journeys (Playwright)
       /------\
      /  API   \ 20% - Server Actions, integrations (Vitest)
     /----------\
    /    Unit    \ 70% - Business logic, utils (Vitest)
   /--------------\
```

**Rationale:**
- **70% Unit** - Business logic (ISBN generation, royalty calcs, RLS policies, permissions)
- **20% API/Integration** - Server Actions, database queries, webhook processing
- **10% E2E** - Critical paths only (title wizard, order fulfillment, Shopify pipeline)

**Why this distribution:**
- React Server Components + Server Actions reduce need for UI component tests
- Type safety (TypeScript + Drizzle + Zod) catches integration issues at compile time
- Multi-tenant isolation via RLS requires unit-level policy testing
- E2E tests expensive and brittle - reserve for revenue-critical journeys

---

## NFR Testing Approach

### Security (SEC Category)

**Requirements:**
- FR98: Integration credentials encrypted at rest
- FR99: OAuth flows for third-party authorization
- Architecture: RLS policies enforce tenant isolation

**Testing Approach:**
- **Auth/Authz Tests:**
  - Clerk integration tests (sign-in, sign-up, session validation)
  - RLS policy unit tests (cross-tenant query blocked)
  - Permission helper tests (`canEditTitle()` returns false for unauthorized roles)
  - Playwright E2E: Role-based access (author can't see other authors' royalties)

- **OWASP Validation:**
  - **SQL Injection:** Drizzle parameterized queries (safe by default, validate with SQLMap)
  - **XSS:** React escaping (safe by default, no `dangerouslySetInnerHTML`)
  - **CSRF:** Next.js CSRF tokens (built-in)
  - **Broken Access Control:** RLS + permission checks (unit tests)

- **Secret Handling:**
  - Validate .env variables not committed (git pre-commit hook)
  - Pino redaction: `logger.redact(['password', 'token', 'apiKey'])`
  - Test S3 presigned URLs expire (15-min TTL)

**Tools:**
- Vitest (unit tests for permissions, RLS)
- Playwright (E2E auth flows)
- SQLMap (SQL injection scanning - run on staging)
- OWASP ZAP (security scanning - run on staging)

**Acceptance Criteria:**
- 100% of RLS policies unit tested
- 100% of permission checks tested
- 0 secrets in git history
- OWASP ZAP scan passes with 0 high-severity issues

---

### Performance (PERF Category)

**Requirements:**
- UX Target: Inventory query <500ms
- UX Target: Dashboard load <1.5s
- UX Target: Page load <2s
- Success Criteria: Support 50-500 titles per publisher efficiently

**Testing Approach:**
- **Load Testing (k6):**
  ```javascript
  // k6 script example
  export const options = {
    stages: [
      { duration: '2m', target: 50 }, // Ramp up to 50 users
      { duration: '5m', target: 50 }, // Stay at 50 users
      { duration: '2m', target: 100 }, // Spike to 100 users
      { duration: '5m', target: 0 }, // Ramp down
    ],
    thresholds: {
      http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
      http_req_failed: ['rate<0.01'], // <1% errors
    },
  }
  ```

- **Stress Testing:**
  - 100 simultaneous order creations
  - 50 concurrent Shopify webhooks
  - Database connection pool exhaustion (101st connection fails gracefully)

- **Soak Testing:**
  - 24-hour sustained load (10 req/sec)
  - Memory leak detection (heap profiling)
  - Connection leak detection (pg pool monitoring)

- **Query Profiling:**
  - Enable PostgreSQL slow query log (queries >200ms)
  - Use pgBadger for query analysis
  - Identify missing indexes

**Tools:**
- k6 (load/stress/soak testing)
- pgBadger (query analysis)
- Clinic.js (Node.js profiling)
- Playwright (Real User Monitoring - RUM)

**Acceptance Criteria:**
- p95 inventory query <500ms
- p95 dashboard load <1.5s
- p95 page load <2s
- No memory leaks over 24 hours
- No connection leaks

---

### Reliability (OPS Category)

**Requirements:**
- Architecture: Inngest retries (3 attempts with exponential backoff)
- Architecture: Docker deployment with health checks
- Architecture: Error handling with Sentry tracking

**Testing Approach:**
- **Error Handling:**
  - Test Server Actions return `{ success: false, error, message }` on failure
  - Test AppError classes serialize correctly
  - Test Sentry captures errors with full context (tenantId, userId, requestId)
  - Test global error boundary renders fallback UI

- **Retry Logic:**
  - Test Inngest jobs retry 3 times on failure
  - Test exponential backoff delays (1s, 2s, 4s)
  - Test circuit breaker pattern (after 3 failures, send failure event)

- **Health Checks:**
  - Test `/api/health` endpoint returns 200 with database connectivity
  - Test graceful shutdown (wait for in-flight requests)
  - Test database connection pool recovery after outage

**Tools:**
- Vitest (unit tests for error classes, retry logic)
- Chaos Toolkit (inject failures)
- Docker health check tests

**Acceptance Criteria:**
- 100% of Server Actions have try/catch error handling
- All Inngest jobs retry 3 times before failing
- Health check endpoint responds <1s
- Graceful shutdown completes in <30s

---

### Maintainability (TECH Category)

**Requirements:**
- Architecture: Type safety throughout (TypeScript + Drizzle + Zod)
- Architecture: Structured logging with Pino
- Architecture: ESLint + strict TypeScript

**Testing Approach:**
- **Coverage Targets:**
  - Unit test coverage: 80% (critical paths)
  - Integration test coverage: 60% (Server Actions)
  - E2E test coverage: Critical journeys only

- **Code Quality Gates:**
  - ESLint: 0 errors
  - TypeScript: strict mode, no `any` types
  - Prettier: consistent formatting
  - No console.log (use logger)

- **Observability Validation:**
  - Test Pino logs include `tenantId`, `userId`, `requestId`
  - Test Sentry breadcrumbs capture user actions
  - Test structured logs are queryable (JSON format)

**Tools:**
- Vitest coverage reports
- ESLint + TypeScript compiler
- SonarQube (code quality)
- Codecov (coverage tracking)

**Acceptance Criteria:**
- 80% unit test coverage on critical paths
- 0 ESLint errors
- 0 TypeScript strict mode violations
- 100% of logs structured (JSON)

---

## Test Environment Requirements

Based on Docker deployment architecture (Railway/Fly.io/Render):

### Local Development Environment

**Infrastructure:**
```yaml
# docker-compose.yml (from architecture)
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: salina_test
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5433:5432" # Different port to avoid conflicts

  redis:
    image: redis:7-alpine
    ports:
      - "6380:6379" # Different port
```

**Test Database Strategy:**
- **Isolated Test DB:** `salina_test` (separate from `salina_dev`)
- **Migration Application:** Run Drizzle migrations before tests (`beforeAll()`)
- **Tenant Isolation:** Each test creates unique tenant ID, cleans up after
- **Transaction Rollback:** Use `db.transaction()` with rollback for fast cleanup

**Environment Variables:**
```bash
# .env.test
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/salina_test
REDIS_URL=redis://localhost:6380
CLERK_SECRET_KEY=test_secret # Use Clerk test keys
ABLY_API_KEY=test_key # Mock in tests
INNGEST_SIGNING_KEY=test_key # Mock in tests
```

---

### CI/CD Environment

**GitHub Actions Pipeline:**
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  unit:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: salina_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run db:migrate
      - run: npm run test:unit # Vitest unit tests
      - run: npm run test:integration # Vitest integration tests

  e2e:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
      redis:
        image: redis:7-alpine
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - uses: microsoft/playwright@v1.40.0
      - run: npm ci
      - run: npm run db:migrate
      - run: npm run build
      - run: npm run test:e2e # Playwright E2E tests
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

**Test Execution Order:**
1. **Lint & Type Check** (ESLint, TypeScript) - <1 min
2. **Unit Tests** (Vitest) - <5 min
3. **Integration Tests** (Vitest + test DB) - <10 min
4. **E2E Tests** (Playwright) - <15 min
5. **Performance Tests** (k6) - On-demand (not every commit)

**Total CI Time:** <30 min for full suite

---

### Staging Environment

**Purpose:** Pre-production validation with production-like data

**Infrastructure:**
- Docker deployment (Railway/Fly.io)
- PostgreSQL 16 (managed service)
- Redis 7 (managed service)
- Ably (production account, separate app)
- Inngest (staging environment)

**Test Data:**
- **Seed Script:** `npm run db:seed:staging`
- **Test Tenants:** 3 publishers with realistic data
- **Test Users:** 8 users (one per role) for manual testing

**Validation:**
- Smoke tests after deployment (Playwright)
- OWASP ZAP security scan (weekly)
- Load test (k6) - 50 concurrent users (weekly)

---

## Testability Concerns

### CONCERN-1: RLS Policy Testing Complexity ⚠️

**Issue:**
Row-Level Security policies require careful test setup. Forgetting `withTenantContext()` causes tests to fail silently (empty result sets instead of errors).

**Impact on Testing:**
- Medium complexity - developers must remember wrapper
- Risk of false positives (test passes but policy not enforced)

**Recommended Mitigation:**
1. **Mandatory Wrapper Pattern:**
   ```typescript
   // ❌ WRONG - No tenant context
   const titles = await db.select().from(titles)

   // ✅ CORRECT - With tenant context
   const titles = await withTenantContext(tenantId, async () => {
     return await db.select().from(titles)
   })
   ```

2. **Test Utilities:**
   ```typescript
   // tests/helpers/tenant-test.ts
   export function tenantTest(name: string, fn: (tenantId: string) => Promise<void>) {
     test(name, async () => {
       const tenantId = uuid()
       await withTenantContext(tenantId, async () => {
         await fn(tenantId)
       })
       // Cleanup
       await deleteTenant(tenantId)
     })
   }
   ```

3. **RLS Policy Unit Tests:**
   ```typescript
   // tests/db/rls-policies.test.ts
   test('titles table enforces RLS', async () => {
     const tenant1 = uuid()
     const tenant2 = uuid()

     // Create title for tenant1
     await withTenantContext(tenant1, async () => {
       await db.insert(titles).values({ title: 'Book 1', tenantId: tenant1 })
     })

     // Try to read from tenant2 (should return empty)
     await withTenantContext(tenant2, async () => {
       const results = await db.select().from(titles)
       expect(results.length).toBe(0) // Tenant 2 can't see tenant 1's data
     })
   })
   ```

**Status:** **ADDRESSED** - Include in Sprint 0 test utilities

---

### CONCERN-2: Real-Time Testing Infrastructure (Ably) ⚠️

**Issue:**
Ably WebSocket testing adds async complexity and potential flakiness.

**Impact on Testing:**
- E2E tests may have timing issues (message arrives after assertion)
- WebSocket connection overhead in CI environment

**Recommended Mitigation:**
1. **Mock Ably in Unit/Integration Tests:**
   ```typescript
   // Mock Ably publish
   const mockAbly = {
     channels: {
       get: (name: string) => ({
         publish: vi.fn(),
         subscribe: vi.fn(),
       }),
     },
   }
   ```

2. **E2E Tests Only for Critical Paths:**
   ```typescript
   // tests/e2e/inventory-sync.spec.ts
   test('inventory updates sync across tabs', async ({ browser }) => {
     const context1 = await browser.newContext()
     const context2 = await browser.newContext()

     const page1 = await context1.newPage()
     const page2 = await context2.newPage()

     await page1.goto('/inventory')
     await page2.goto('/inventory')

     // Fulfill order in tab 1
     await page1.click('[data-testid="fulfill-order-1"]')

     // Wait for Ably message in tab 2
     await page2.waitForSelector('[data-testid="inventory-updated"]', { timeout: 5000 })

     // Verify inventory count updated
     await expect(page2.locator('[data-testid="sku-001-quantity"]')).toHaveText('95')
   })
   ```

3. **Wait Helpers:**
   ```typescript
   // tests/helpers/wait-for-ably.ts
   export async function waitForAblyMessage(page: Page, channel: string, timeout = 5000) {
     return page.waitForFunction(
       ({ channel }) => window.__ablyMessages?.[channel]?.length > 0,
       { channel },
       { timeout }
     )
   }
   ```

**Status:** **ADDRESSED** - Include in Sprint 0 E2E test setup

---

### CONCERN-3: Background Job Testing (Inngest) ⚠️

**Issue:**
Inngest jobs run asynchronously, making test assertions timing-dependent.

**Impact on Testing:**
- Tests may finish before job completes
- Retry logic adds test duration

**Recommended Mitigation:**
1. **Synchronous Job Execution in Tests:**
   ```typescript
   // Use Inngest Dev Server in test mode
   const inngest = new Inngest({
     id: 'salina-erp-test',
     isDevelopment: true, // Runs jobs synchronously
   })
   ```

2. **Mock Inngest in Unit Tests:**
   ```typescript
   const mockInngest = {
     send: vi.fn(),
   }

   test('fulfillOrder triggers Shopify sync job', async () => {
     await fulfillOrder(orderId)
     expect(mockInngest.send).toHaveBeenCalledWith({
       name: 'shopify/inventory.sync',
       data: { tenantId, skus: ['SKU-001'] },
     })
   })
   ```

3. **Integration Tests Wait for Completion:**
   ```typescript
   test('Shopify webhook processes order', async () => {
     const result = await inngest.send({ name: 'shopify/order.created', data: webhookPayload })

     // Wait for job to complete
     await result.waitForCompletion({ timeout: 10000 })

     // Assert order created
     const order = await db.select().from(orders).where(eq(orders.externalOrderId, '12345'))
     expect(order.length).toBe(1)
   })
   ```

**Status:** **ADDRESSED** - Include in Sprint 0 Inngest test setup

---

### CONCERN-4: ISBN Collision in Parallel Tests ⚠️

**Issue:**
Global `isbns` table (no RLS) means ISBNs must be unique across all test runs. Parallel tests might generate conflicting ISBNs.

**Impact on Testing:**
- Test failures due to uniqueness constraint violations
- Cannot run tests in parallel without coordination

**Recommended Mitigation:**
1. **Unique Test Prefixes:**
   ```typescript
   // tests/factories/isbn.ts
   export function testISBNPrefix() {
     const timestamp = Date.now()
     return `978-9-${timestamp.toString().slice(-6)}` // Last 6 digits of timestamp
   }

   // Generates: 978-9-456789-00-X through 978-9-456789-99-X
   ```

2. **Cleanup After Tests:**
   ```typescript
   afterEach(async () => {
     // Delete test ISBNs
     await db.delete(isbns).where(like(isbns.prefix, '978-9-%'))
   })
   ```

3. **Factory Pattern:**
   ```typescript
   // tests/factories/isbn-block.ts
   export async function createTestISBNBlock() {
     const prefix = testISBNPrefix()
     const block = await db.insert(isbnBlocks).values({
       tenantId: testTenantId,
       prefix,
     }).returning()

     await generateISBNBlock(prefix) // Creates 100 ISBNs
     return block[0]
   }
   ```

**Status:** **ADDRESSED** - Include in Sprint 0 test factory setup

---

## Recommendations for Sprint 0

Before implementing epics, establish test infrastructure:

### Priority 1: Test Foundation (Week 1)

1. **Test Database Setup**
   - Configure `salina_test` database
   - Add `npm run test:setup` script (creates DB, runs migrations)
   - Add `npm run test:teardown` script (drops DB)

2. **Vitest Configuration**
   ```typescript
   // vitest.config.ts
   export default defineConfig({
     test: {
       globals: true,
       environment: 'node',
       setupFiles: ['./tests/setup.ts'],
       coverage: {
         provider: 'v8',
         reporter: ['text', 'json', 'html'],
         exclude: ['node_modules/', 'tests/'],
       },
     },
   })
   ```

3. **Test Utilities**
   - `withTenantContext()` wrapper for RLS tests
   - `tenantTest()` helper for automatic tenant setup/cleanup
   - Factory functions (titleFactory, orderFactory, userFactory)

4. **RLS Policy Unit Tests**
   - Test all 15+ table RLS policies
   - Verify cross-tenant isolation
   - 100% coverage on RLS logic

**Deliverable:** `npm run test:unit` passes with 80% coverage

---

### Priority 2: Integration Test Setup (Week 1-2)

1. **Server Action Tests**
   - Test all Server Actions return correct types
   - Test error handling (`{ success: false }`)
   - Test validation (Zod schema failures)

2. **Mock External Services**
   - Mock Ably publish/subscribe
   - Mock Inngest send (synchronous execution)
   - Mock Shopify API (MSW - Mock Service Worker)
   - Mock EasyPost API (MSW)

3. **Database Transaction Tests**
   - Test rollback on error
   - Test inventory hold pattern (SELECT FOR UPDATE)

**Deliverable:** `npm run test:integration` passes

---

### Priority 3: E2E Test Framework (Week 2)

1. **Playwright Setup**
   ```typescript
   // playwright.config.ts
   export default defineConfig({
     testDir: './tests/e2e',
     use: {
       baseURL: 'http://localhost:3000',
       trace: 'on-first-retry',
     },
     projects: [
       {
         name: 'chromium',
         use: { ...devices['Desktop Chrome'] },
       },
     ],
   })
   ```

2. **Test Fixtures**
   - User authentication fixtures (8 roles)
   - Test data fixtures (tenants, titles, orders)
   - Page object models (LoginPage, DashboardPage, TitleWizardPage)

3. **Critical Journey Tests**
   - Title Creation Wizard (P0)
   - Order Fulfillment (P0)
   - Shopify Order Import (P0)

**Deliverable:** `npm run test:e2e` passes for 3 critical journeys

---

### Priority 4: CI/CD Pipeline (Week 2)

1. **GitHub Actions Workflow**
   - Unit tests on every commit
   - Integration tests on PR
   - E2E tests on PR to main
   - Performance tests on-demand

2. **Test Reporting**
   - Vitest coverage reports (Codecov)
   - Playwright test reports (artifacts)
   - Performance benchmarks (k6 output)

3. **Quality Gates**
   - Block merge if P0 tests fail
   - Require 80% unit test coverage
   - Require 0 ESLint errors

**Deliverable:** CI pipeline runs all tests in <30 min

---

## Gate Criteria for Solutioning → Implementation

Before proceeding to implementation (creating epics):

### Must Pass (Blockers)

- ✅ **Testability Assessment:** PASS (or PASS with addressed concerns)
- ✅ **High-Priority ASRs:** All 5 ASRs have test strategies defined
- ✅ **Test Levels Strategy:** 70/20/10 distribution documented
- ✅ **NFR Testing:** Security, Performance, Reliability approaches defined
- ✅ **Sprint 0 Plan:** Test infrastructure roadmap approved

### Concerns Addressed

- ✅ RLS testing complexity → Test utilities planned
- ✅ Real-time testing → Mock strategy + E2E wait helpers
- ✅ Background jobs → Synchronous test mode + mocks
- ✅ ISBN collisions → Unique prefixes per test run

### Recommendations

- ⚠️ **Proceed to Epic Breakdown:** `/bmad:bmm:workflows:create-epics-and-stories`
- ⚠️ **Sprint 0 Focus:** Test infrastructure before feature development
- ⚠️ **Next Workflow:** `implementation-readiness` to validate all artifacts align

---

## Summary

**Testability Rating:** **8/10** (Excellent with minor addressable concerns)

**Architecture Strengths:**
- Type safety reduces integration testing burden
- Server Actions simplify test setup (no HTTP mocking)
- RLS provides natural test isolation
- Documented test strategy (Vitest + Playwright)

**Addressable Concerns:**
- RLS testing complexity (mitigated with test utilities)
- Real-time testing infrastructure (mitigated with mocks + E2E wait helpers)
- Background job async testing (mitigated with synchronous test mode)
- ISBN collision prevention (mitigated with unique prefixes)

**Recommendation:** ✅ **PROCEED** to epic breakdown with Sprint 0 focus on test infrastructure.

---

**Generated by:** BMad TEA Agent - Test Architect Module
**Workflow:** `.bmad/bmm/workflows/testarch/test-design`
**Version:** 4.0 (BMad v6)
**Date:** 2025-11-18
