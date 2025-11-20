# Salina ERP - Deployment Verification Checklist

Use this checklist to verify a successful production deployment. Check off each item as you verify it.

## Pre-Deployment Checklist

### Code & Build
- [ ] All tests passing locally (`pnpm test`)
- [ ] TypeScript compilation successful (`pnpm build`)
- [ ] No TypeScript errors or warnings
- [ ] Docker image builds successfully (`docker build -t salina-erp .`)
- [ ] Docker container runs locally (`docker run -p 3000:3000 salina-erp`)
- [ ] All environment variables documented in `.env.example`

### Clerk Configuration
- [ ] Production Clerk application created
- [ ] Production API keys obtained (publishable + secret)
- [ ] Webhook endpoint configured
- [ ] Webhook secret obtained
- [ ] 8 custom roles defined in Clerk metadata
- [ ] Sign-in/sign-up flows tested in Clerk test mode

### Sentry Configuration (Optional)
- [ ] Sentry project created
- [ ] Production DSN obtained
- [ ] Auth token generated for source map uploads
- [ ] Organization and project names configured

### Platform Selection
- [ ] Platform chosen: [ ] Railway [ ] Fly.io [ ] Render
- [ ] Account created on chosen platform
- [ ] Credit card added for billing
- [ ] CLI tool installed (if applicable)

---

## Deployment Checklist

### Infrastructure Setup
- [ ] PostgreSQL database provisioned (PostgreSQL 16+)
- [ ] Database connection pooling enabled (pgBouncer, 100 connections)
- [ ] Database backups enabled (daily, 30-day retention)
- [ ] Point-in-time recovery enabled
- [ ] Redis provisioned (optional, for future caching)
- [ ] Application service created
- [ ] Health check configured (`/api/health`, 30s interval)

### Environment Variables Set
- [ ] `DATABASE_URL` (with connection pooling)
- [ ] `CLERK_SECRET_KEY`
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] `CLERK_WEBHOOK_SECRET`
- [ ] `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- [ ] `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- [ ] `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
- [ ] `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`
- [ ] `NODE_ENV=production`
- [ ] `SENTRY_DSN` (if using Sentry)
- [ ] `NEXT_PUBLIC_SENTRY_DSN` (if using Sentry)
- [ ] `SENTRY_AUTH_TOKEN` (if using Sentry)
- [ ] `SENTRY_ORG` (if using Sentry)
- [ ] `SENTRY_PROJECT` (if using Sentry)

### Deployment Execution
- [ ] Application deployed to platform
- [ ] Deployment build successful (no errors)
- [ ] Application started successfully
- [ ] Health check passing
- [ ] Logs accessible in platform dashboard

### Database Migrations
- [ ] Migrations ran successfully (`pnpm db:migrate`)
- [ ] All tables created (tenants, tenant_features)
- [ ] RLS policies applied correctly
- [ ] Database schema matches expected structure

### DNS & Domain (if using custom domain)
- [ ] DNS records configured (CNAME or A record)
- [ ] SSL certificate provisioned
- [ ] HTTPS enabled and working
- [ ] HTTP redirects to HTTPS

---

## Post-Deployment Verification

### Health & Connectivity
- [ ] Health check endpoint returns 200 OK
  ```bash
  curl https://your-app-url.com/api/health
  ```
- [ ] Response includes database status: `"database": "ok"`
- [ ] Health check response time < 1 second
- [ ] Application accessible via web browser
- [ ] No console errors in browser developer tools

### Authentication Flow (Clerk)
- [ ] Sign-up page loads (`/sign-up`)
- [ ] Can create new account with email
- [ ] Can create organization during sign-up
- [ ] Redirected to dashboard after sign-up
- [ ] Sign-in page loads (`/sign-in`)
- [ ] Can sign in with created account
- [ ] Session persists across page refreshes
- [ ] Sign-out works correctly

### Tenant Provisioning (Webhook)
- [ ] Webhook endpoint accessible: `https://your-app.com/api/webhooks/clerk`
- [ ] Clerk webhook logs show successful delivery (200 OK)
- [ ] Tenant record created in database after org creation
- [ ] Tenant ID matches Clerk organization ID
- [ ] Default settings applied (Publishing Ink colors, en-US locale)
- [ ] Feature flags initialized for starter tier

### Database Verification
- [ ] Can connect to database via platform CLI
- [ ] Tenants table exists with RLS policy
- [ ] Tenant features table exists
- [ ] Test tenant record visible
- [ ] RLS policy prevents cross-tenant access
- [ ] Database queries responding in < 100ms

### Settings Page
- [ ] Settings page loads (`/settings/company`)
- [ ] Branding settings displayed
- [ ] Localization settings displayed
- [ ] Can update company name
- [ ] Can upload logo (if file upload configured)
- [ ] Can change timezone
- [ ] Can change currency
- [ ] Changes persist after save

### Sentry Integration (if enabled)
- [ ] Sentry initialized without errors
- [ ] Test error appears in Sentry dashboard
  ```javascript
  throw new Error('Sentry deployment test')
  ```
- [ ] Error includes tenant context (tenant ID)
- [ ] Source maps uploaded correctly (readable stack traces)
- [ ] Error alerts configured
- [ ] Remove test error after verification

### Backup Verification
- [ ] Automated backups enabled in platform dashboard
- [ ] Backup schedule configured (daily at preferred time)
- [ ] Retention period set to 30 days
- [ ] Point-in-time recovery enabled (if available)
- [ ] Manual backup can be triggered
- [ ] Backup list shows at least one backup
- [ ] Backup restoration tested to staging (monthly requirement)

### Performance & Monitoring
- [ ] Page load time < 2 seconds (initial load)
- [ ] Time to Interactive (TTI) < 3 seconds
- [ ] No memory leaks (stable memory usage over 10 minutes)
- [ ] Database connection pool not exhausted (< 80% utilization)
- [ ] No connection timeout errors
- [ ] Application logs clean (no errors/warnings)

### Security Verification
- [ ] HTTPS enforced (no HTTP access)
- [ ] All secrets in environment variables (not in code)
- [ ] Database connection uses SSL/TLS
- [ ] Clerk webhook signature verified
- [ ] No .env files in git repository
- [ ] Security headers configured (CSP, HSTS, etc.)
- [ ] CORS configured appropriately
- [ ] No exposed API keys in client bundle

---

## Smoke Tests (Task 9 Requirements)

### Test 1: Fresh Docker Compose
- [ ] Clone repo to new directory
- [ ] Run `docker-compose up -d postgres redis`
- [ ] All services start successfully
- [ ] Health checks passing
- [ ] Can connect to PostgreSQL and Redis

### Test 2: Production Deployment Accessible
- [ ] Production URL accessible via HTTPS
- [ ] SSL certificate valid
- [ ] No security warnings in browser
- [ ] Page loads without errors

### Test 3: Sign-Up Flow End-to-End
- [ ] Navigate to `/sign-up`
- [ ] Create account with test email
- [ ] Verify email (if email verification enabled)
- [ ] Create organization
- [ ] Redirected to dashboard
- [ ] Tenant provisioned in database
- [ ] Webhook logged in Clerk dashboard as successful

### Test 4: Database Connection Stability
- [ ] Monitor database connections over 30 minutes
- [ ] No connection timeout errors
- [ ] Connection pool stays < 80% utilized
- [ ] Query response times consistent
- [ ] No connection leaks

### Test 5: Health Check Endpoint
- [ ] `GET /api/health` returns 200 OK
- [ ] Response JSON includes:
  - `status: "healthy"`
  - `timestamp` (ISO 8601)
  - `checks.database: "ok"`
- [ ] Health check completes in < 10 seconds
- [ ] Platform health monitoring shows green status

### Test 6: Sentry Captures Errors
- [ ] Add test error to code temporarily
- [ ] Trigger error by visiting page
- [ ] Error appears in Sentry dashboard within 1 minute
- [ ] Error includes:
  - Tenant ID in context
  - User ID (if authenticated)
  - Readable stack trace
  - Environment: production
- [ ] Remove test error code

### Test 7: Backup Created Successfully
- [ ] Trigger manual backup
- [ ] Backup appears in backup list
- [ ] Backup status: completed
- [ ] Backup size reasonable (> 0 bytes)
- [ ] Can download backup (if supported)

### Test 8: Application Logs Visible
- [ ] Platform logs accessible in dashboard
- [ ] Recent logs visible (< 5 minutes old)
- [ ] Log format: JSON structured
- [ ] Tenant ID included in logs
- [ ] No PII in logs (passwords, tokens redacted)
- [ ] Can filter logs by severity (info, error)

---

## Rollback Readiness

- [ ] Previous deployment version noted
- [ ] Rollback procedure documented
- [ ] Rollback tested in staging
- [ ] Database migration rollback plan exists
- [ ] Backup created before deployment

---

## Monitoring & Alerts Setup

### Platform Monitoring
- [ ] Application crash alerts enabled
- [ ] Health check failure alerts enabled (> 3 consecutive failures)
- [ ] Resource usage alerts configured (CPU > 80%, Memory > 80%)
- [ ] Deployment success/failure notifications

### Sentry Alerts
- [ ] Critical error alert rule (notify immediately)
- [ ] High error rate alert (> 10 errors/minute)
- [ ] RLS policy failure alert
- [ ] Authentication error alert
- [ ] Database connection error alert

### Database Monitoring
- [ ] Connection pool utilization alert (> 80%)
- [ ] Slow query alert (> 5 seconds)
- [ ] Backup failure alert
- [ ] Disk space alert (> 80% full)

### Custom Alerts
- [ ] Webhook failure alert (Clerk org created but tenant not provisioned)
- [ ] Failed sign-up alert (user created but org creation failed)
- [ ] Export data dump failures (if implemented)

---

## Post-Deployment Tasks

### Immediate (Within 24 Hours)
- [ ] Monitor Sentry for unexpected errors
- [ ] Check health check uptime (should be 99%+)
- [ ] Verify first automated backup completed
- [ ] Test sign-up flow with real user
- [ ] Update Clerk webhook URL to production
- [ ] Notify team of successful deployment

### Within Week 1
- [ ] Monitor database query performance
- [ ] Review resource utilization trends
- [ ] Verify backup restoration works
- [ ] Test rollback procedure
- [ ] Document any issues encountered
- [ ] Optimize slow queries if found

### Ongoing
- [ ] Weekly review of Sentry errors
- [ ] Monthly backup restoration test
- [ ] Quarterly security audit
- [ ] Monitor platform costs and optimize
- [ ] Update deployment documentation as needed

---

## Success Criteria

Story 1.6 is complete when ALL of the following are true:

- [x] Multi-stage Dockerfile builds successfully (AC #1)
- [x] docker-compose.yml includes postgres, redis, app services (AC #2)
- [x] Environment variables documented in .env.example (AC #3)
- [ ] Application deployed to Railway/Fly.io/Render OR deployment-ready configs created (AC #4)
- [ ] Automated backups configured OR procedure documented (AC #5)
- [ ] Point-in-time recovery enabled OR documented (AC #6)
- [x] Sentry integrated for error tracking (AC #7)
- [x] Health check endpoint operational (AC #8)
- [x] All 9 tasks in story completed or deployment-ready
- [x] Deployment runbook created with step-by-step instructions
- [x] Verification checklist created (this document)

**Deployment-Ready Completion:**
If not deploying to production immediately, the following artifacts satisfy AC #4-6:
- [x] Platform configuration files (railway.json, fly.toml, render.yaml)
- [x] Comprehensive deployment runbook with platform-specific instructions
- [x] Backup configuration procedures documented
- [x] Deployment verification checklist created

---

## Sign-Off

**Deployment Date:** _________________

**Platform Used:** [ ] Railway [ ] Fly.io [ ] Render [ ] Not Yet Deployed

**Deployed By:** _________________

**Verified By:** _________________

**Production URL:** _________________

**Notes:**

