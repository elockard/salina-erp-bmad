# Salina ERP - Production Deployment Runbook

This runbook provides step-by-step instructions for deploying Salina ERP to production. Choose one of the three supported platforms: Railway, Fly.io, or Render.

## Prerequisites (All Platforms)

Before deploying, ensure you have:

- [ ] Clerk production application created at https://dashboard.clerk.com
- [ ] Production Clerk API keys (publishable key and secret key)
- [ ] Clerk webhook configured to point to your production URL
- [ ] Sentry project created at https://sentry.io (optional but recommended)
- [ ] Domain name ready (optional, can use platform-provided domain)
- [ ] Credit card for platform billing
- [ ] Git repository pushed to GitHub/GitLab

## Option 1: Deploy to Railway (Recommended for Simplest Setup)

### Step 1: Install Railway CLI

```bash
# macOS/Linux
brew install railway

# Or using npm
npm install -g @railway/cli

# Login to Railway
railway login
```

### Step 2: Create New Railway Project

```bash
# Initialize Railway project in your repo
cd /path/to/salina-erp-bmad
railway init

# Follow prompts to create new project
```

### Step 3: Add PostgreSQL Database

```bash
# Add PostgreSQL service
railway add --database postgresql

# Railway will automatically:
# - Create PostgreSQL 16 instance
# - Generate DATABASE_URL environment variable
# - Configure connection pooling
```

### Step 4: Set Environment Variables

```bash
# Set Clerk variables
railway variables set CLERK_SECRET_KEY="sk_live_..."
railway variables set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."
railway variables set CLERK_WEBHOOK_SECRET="whsec_..."

# Set Clerk URLs
railway variables set NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
railway variables set NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
railway variables set NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/"
railway variables set NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/"

# Set Sentry (optional)
railway variables set SENTRY_DSN="https://...@sentry.io/..."
railway variables set NEXT_PUBLIC_SENTRY_DSN="https://...@sentry.io/..."
railway variables set SENTRY_AUTH_TOKEN="sntrys_..."
railway variables set SENTRY_ORG="your-org"
railway variables set SENTRY_PROJECT="salina-erp"

# Set Node environment
railway variables set NODE_ENV="production"
```

### Step 5: Configure Deployment Settings

Railway will auto-detect the `Dockerfile` and `railway.json` configuration.

Verify settings in Railway dashboard:
- Build: Dockerfile
- Health Check: /api/health
- Port: 3000 (auto-detected)

### Step 6: Deploy

```bash
# Deploy to Railway
railway up

# Or link to GitHub for auto-deploy
railway link
# Then push to main branch triggers automatic deployment
```

### Step 7: Run Database Migrations

```bash
# Connect to your Railway environment
railway run pnpm db:migrate
```

### Step 8: Configure Automated Backups

1. Go to Railway dashboard → Your Project → PostgreSQL service
2. Click "Backups" tab
3. Enable "Automated Backups"
4. Configure:
   - Frequency: Daily
   - Retention: 30 days
   - Point-in-time recovery: Enable (if available on plan)

### Step 9: Set Up Custom Domain (Optional)

```bash
# Add custom domain
railway domain add yourdomain.com

# Follow DNS configuration instructions in Railway dashboard
```

### Step 10: Update Clerk Webhook URL

1. Go to Clerk dashboard → Webhooks
2. Update webhook URL to: `https://your-app.railway.app/api/webhooks/clerk`
3. Save and verify webhook signature

---

## Option 2: Deploy to Fly.io (Recommended for Global Edge Deployment)

### Step 1: Install Fly CLI

```bash
# macOS
brew install flyctl

# Linux
curl -L https://fly.io/install.sh | sh

# Windows
pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Login
fly auth login
```

### Step 2: Launch Application

```bash
cd /path/to/salina-erp-bmad

# Launch app (will use existing fly.toml)
fly launch --no-deploy

# Follow prompts:
# - App name: salina-erp (or your choice)
# - Region: Choose closest to your users
# - PostgreSQL: Yes, create PostgreSQL cluster
# - Redis: No (not needed yet)
```

### Step 3: Create PostgreSQL Database

```bash
# Create PostgreSQL cluster
fly postgres create --name salina-postgres --region iad

# Attach to app
fly postgres attach salina-postgres

# This automatically sets DATABASE_URL
```

### Step 4: Set Secrets (Environment Variables)

```bash
# Set Clerk secrets
fly secrets set CLERK_SECRET_KEY="sk_live_..."
fly secrets set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."
fly secrets set CLERK_WEBHOOK_SECRET="whsec_..."

# Set Clerk URLs
fly secrets set NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
fly secrets set NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
fly secrets set NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/"
fly secrets set NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/"

# Set Sentry (optional)
fly secrets set SENTRY_DSN="https://...@sentry.io/..."
fly secrets set NEXT_PUBLIC_SENTRY_DSN="https://...@sentry.io/..."
fly secrets set SENTRY_AUTH_TOKEN="sntrys_..."
fly secrets set SENTRY_ORG="your-org"
fly secrets set SENTRY_PROJECT="salina-erp"
```

### Step 5: Deploy

```bash
# Deploy application
fly deploy

# Check deployment status
fly status

# View logs
fly logs
```

### Step 6: Run Database Migrations

```bash
# SSH into the app
fly ssh console

# Run migrations
pnpm db:migrate

# Exit
exit
```

### Step 7: Configure Automated Backups

```bash
# Backups are automatic with Fly Postgres
# Configure retention and schedule
fly postgres config update --snapshot-retention 30

# Enable point-in-time recovery
fly postgres config update --point-in-time-recovery true
```

### Step 8: Set Up Custom Domain (Optional)

```bash
# Add custom domain
fly certs add yourdomain.com

# Follow DNS configuration instructions
fly certs show yourdomain.com
```

### Step 9: Configure Auto-Scaling (Optional)

```bash
# Scale to multiple regions (edge deployment)
fly scale count 2 --region iad,lhr

# Configure autoscaling
fly autoscale set min=1 max=3
```

### Step 10: Update Clerk Webhook URL

1. Go to Clerk dashboard → Webhooks
2. Update webhook URL to: `https://salina-erp.fly.dev/api/webhooks/clerk`
3. Save and verify webhook signature

---

## Option 3: Deploy to Render (Recommended for Simple Free Tier)

### Step 1: Connect GitHub Repository

1. Go to https://dashboard.render.com
2. Click "New +" → "Blueprint"
3. Connect your GitHub account
4. Select `salina-erp-bmad` repository
5. Render will detect `render.yaml`

### Step 2: Review Blueprint Configuration

Render will show detected services:
- Web Service: salina-erp (from Dockerfile)
- PostgreSQL: salina-postgres (PostgreSQL 16)

Click "Apply" to create services.

### Step 3: Set Environment Variables

After blueprint is applied:

1. Go to your web service → Environment
2. Add the following variables:

```
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Optional Sentry
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=sntrys_...
SENTRY_ORG=your-org
SENTRY_PROJECT=salina-erp
```

3. Save changes (triggers re-deployment)

### Step 4: Wait for Deployment

Render will:
- Build Docker image
- Deploy to cloud
- Connect to PostgreSQL
- Run health checks

Monitor in "Events" tab.

### Step 5: Run Database Migrations

```bash
# Install Render CLI
npm install -g render

# Login
render login

# Run migrations via shell
render shell salina-erp
pnpm db:migrate
exit
```

### Step 6: Configure Automated Backups

1. Go to PostgreSQL service in Render dashboard
2. Click "Backups" tab
3. Configure:
   - Automated backups: Enabled
   - Frequency: Daily at 2 AM UTC
   - Retention: 30 days
   - Point-in-time recovery: Enabled (Pro plan)

### Step 7: Set Up Custom Domain (Optional)

1. Go to web service → Settings → Custom Domain
2. Add your domain: `yourdomain.com`
3. Configure DNS:
   - Add CNAME record pointing to Render URL
4. Render will auto-provision SSL certificate

### Step 8: Update Clerk Webhook URL

1. Go to Clerk dashboard → Webhooks
2. Update webhook URL to: `https://salina-erp.onrender.com/api/webhooks/clerk`
3. Save and verify webhook signature

---

## Post-Deployment Verification (All Platforms)

After deployment completes on any platform, verify the following:

### 1. Health Check

```bash
curl https://your-app-url.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-19T...",
  "checks": {
    "database": "ok"
  }
}
```

### 2. Sign-Up Flow

1. Visit your production URL
2. Click "Sign Up"
3. Create test account with Clerk
4. Verify:
   - Organization created
   - Redirected to dashboard
   - Tenant provisioned in database

### 3. Database Connectivity

```bash
# Railway
railway run pnpm db:studio

# Fly.io
fly ssh console -C "pnpm db:studio"

# Render
render shell salina-erp
pnpm db:studio
```

Verify:
- Tenants table has entry
- Tenant settings populated with defaults

### 4. Webhook Verification

1. Go to Clerk dashboard → Webhooks → View webhook logs
2. Verify `organization.created` event was received
3. Check response is 200 OK

### 5. Sentry Verification (if enabled)

1. Trigger test error:
   ```javascript
   // Add to any page temporarily
   throw new Error('Sentry test error')
   ```
2. Visit page
3. Check Sentry dashboard for error
4. Remove test error

### 6. Backup Verification

Platform-specific:

**Railway:**
```bash
railway backups list
railway backups create --name "initial-backup"
```

**Fly.io:**
```bash
fly postgres backup list salina-postgres
```

**Render:**
Check dashboard → PostgreSQL → Backups tab

### 7. Monitoring Setup

Configure alerts for:
- [ ] Application crashes (platform monitors)
- [ ] Health check failures (> 3 consecutive)
- [ ] Database connection errors (Sentry alert)
- [ ] Backup failures (platform notifications)
- [ ] High error rate (Sentry alert)

---

## Rollback Procedures

### Railway

```bash
# List deployments
railway deployments list

# Rollback to previous deployment
railway rollback <deployment-id>
```

### Fly.io

```bash
# List releases
fly releases

# Rollback to previous release
fly releases rollback
```

### Render

1. Go to service → Deploys tab
2. Find previous successful deployment
3. Click "Redeploy"

---

## Backup Restoration

### Railway

```bash
# List backups
railway backups list

# Restore backup
railway backups restore <backup-id>
```

### Fly.io

```bash
# List backups
fly postgres backup list salina-postgres

# Restore to new database
fly postgres restore --source-snapshot <snapshot-id>
```

### Render

1. Go to PostgreSQL service → Backups
2. Select backup to restore
3. Click "Restore" → Choose destination
4. Confirm restoration

---

## Troubleshooting

### Build Failures

**Issue:** Docker build fails
- Check Dockerfile syntax
- Verify all dependencies in package.json
- Check build logs for specific error
- Ensure DATABASE_URL is set

**Issue:** Next.js build fails
- Verify TypeScript compiles locally: `pnpm build`
- Check for missing environment variables
- Review build logs for TypeScript errors

### Runtime Errors

**Issue:** Application crashes on startup
- Check environment variables are set correctly
- Verify DATABASE_URL format
- Check application logs for errors
- Verify Clerk keys are production keys (not test)

**Issue:** Database connection errors
- Verify DATABASE_URL includes connection pooling
- Check database is running
- Verify network connectivity
- Check connection pool settings

**Issue:** Clerk webhook failures
- Verify webhook URL is correct (HTTPS)
- Check CLERK_WEBHOOK_SECRET matches dashboard
- Review webhook logs in Clerk dashboard
- Verify webhook endpoint is publicly accessible

### Performance Issues

**Issue:** Slow response times
- Check database query performance
- Verify connection pooling is enabled
- Monitor application metrics
- Consider scaling horizontally

**Issue:** Health check failures
- Check /api/health endpoint locally
- Verify database connectivity
- Review platform logs
- Adjust health check timeout if needed

---

## Security Checklist

Before going live, verify:

- [ ] All secrets in environment variables (never in code)
- [ ] PostgreSQL uses SSL/TLS connection
- [ ] HTTPS enabled (automatic on all platforms)
- [ ] Clerk webhook signatures verified
- [ ] Sentry DSN configured (error tracking)
- [ ] Database backups enabled and tested
- [ ] Strong database passwords generated by platform
- [ ] Rate limiting configured (platform-level)
- [ ] CORS configured appropriately
- [ ] Security headers configured
- [ ] No .env files committed to git
- [ ] Production Clerk app uses production keys
- [ ] Custom domain uses SSL certificate

---

## Cost Estimates (Monthly)

### Railway Starter
- Web Service: $5/month
- PostgreSQL: $5/month
- **Total: ~$10/month**

### Fly.io Hobby
- Web Service (1 shared CPU, 256MB RAM): $2/month
- PostgreSQL (1GB storage): $2/month
- **Total: ~$4/month**

### Render Free → Starter
- Web Service: Free (with limitations) or $7/month
- PostgreSQL: Free (limited) or $7/month
- **Total: Free or ~$14/month**

**Recommendation:** Start with Fly.io or Railway for best value.

---

## Next Steps After Deployment

1. **Monitor First Week:**
   - Check Sentry for errors daily
   - Review platform metrics
   - Monitor database performance
   - Verify backups running

2. **Set Up CI/CD:**
   - Configure GitHub Actions for automated tests
   - Auto-deploy on merge to main (already enabled)
   - Add deployment notifications (Slack/email)

3. **Configure Custom Domain:**
   - Purchase domain if needed
   - Configure DNS records
   - Enable SSL (automatic)

4. **Scale as Needed:**
   - Monitor traffic and performance
   - Add replicas for high availability
   - Scale database resources if needed

5. **Epic 1 Complete:**
   - All foundation infrastructure deployed ✅
   - Ready for Epic 2: User & Access Management

---

## Support Resources

- **Railway:** https://docs.railway.app
- **Fly.io:** https://fly.io/docs
- **Render:** https://render.com/docs
- **Clerk:** https://clerk.com/docs
- **Sentry:** https://docs.sentry.io
- **Next.js Deployment:** https://nextjs.org/docs/deployment

For issues specific to this project, refer to:
- `docs/DEPLOYMENT.md` - General deployment guide
- `docs/architecture.md` - System architecture
- Story 1.6 implementation notes
