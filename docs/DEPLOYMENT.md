# Salina ERP - Deployment Guide

This document provides instructions for deploying the Salina ERP application to production.

## Prerequisites

- Docker installed (for containerized deployment)
- PostgreSQL 16+ database
- Redis 7+ (optional, for future caching)
- Node.js 20+ (for local development)
- pnpm 9+ (package manager)

## Environment Variables

See `.env.example` for a complete list of required environment variables. Key variables include:

### Required

- `DATABASE_URL` - PostgreSQL connection string with connection pooling
- `CLERK_SECRET_KEY` - Clerk authentication secret key
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key (client-safe)
- `CLERK_WEBHOOK_SECRET` - Secret for verifying Clerk webhooks

### Optional (Production)

- `SENTRY_DSN` - Sentry error tracking DSN
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry client-side DSN
- `SENTRY_AUTH_TOKEN` - Sentry auth token for uploading source maps
- `REDIS_URL` - Redis connection string

## Deployment Options

### Option 1: Railway (Recommended)

Railway provides automated deployments from Git with built-in PostgreSQL and Redis support.

1. **Create a new Railway project:**
   ```bash
   railway login
   railway init
   ```

2. **Add PostgreSQL database:**
   ```bash
   railway add -d postgresql
   ```

3. **Set environment variables:**
   ```bash
   railway variables set CLERK_SECRET_KEY=sk_...
   railway variables set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
   railway variables set CLERK_WEBHOOK_SECRET=whsec_...
   ```

4. **Deploy:**
   ```bash
   railway up
   ```

Railway will automatically:
- Build the Docker image
- Set `DATABASE_URL` with connection pooling
- Assign a public URL
- Enable automatic deployments from Git

### Option 2: Fly.io

Fly.io provides global edge deployment with built-in load balancing.

1. **Install flyctl:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Initialize Fly app:**
   ```bash
   fly launch
   ```

3. **Create PostgreSQL database:**
   ```bash
   fly postgres create
   fly postgres attach <postgres-app-name>
   ```

4. **Set secrets:**
   ```bash
   fly secrets set CLERK_SECRET_KEY=sk_...
   fly secrets set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
   fly secrets set CLERK_WEBHOOK_SECRET=whsec_...
   ```

5. **Deploy:**
   ```bash
   fly deploy
   ```

### Option 3: Render

Render provides simple deployments with automatic HTTPS and CD from Git.

1. **Create a new Web Service** from the Render dashboard

2. **Connect your Git repository**

3. **Configure build settings:**
   - Build Command: `pnpm install && pnpm run build`
   - Start Command: `node .next/standalone/server.js`
   - Docker: Enable Dockerfile deployment

4. **Add PostgreSQL database:**
   - Create a new PostgreSQL instance
   - Link it to your web service

5. **Set environment variables** in the Render dashboard

6. **Deploy** - Render will automatically build and deploy

## Docker Deployment

### Building the Docker Image

```bash
docker build -t salina-erp .
```

### Running Locally with Docker Compose

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Run the application (uncomment app service in docker-compose.yml first)
docker-compose up app
```

### Running in Production

```bash
docker run -p 3000:3000 \\
  -e DATABASE_URL=postgresql://... \\
  -e CLERK_SECRET_KEY=sk_... \\
  -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_... \\
  -e CLERK_WEBHOOK_SECRET=whsec_... \\
  salina-erp
```

## Database Migrations

Before deploying, ensure database migrations are applied:

```bash
pnpm db:migrate
```

In production, migrations can be run as part of the deployment process or manually via:

```bash
docker exec -it <container-name> pnpm db:migrate
```

## Health Checks

The application exposes a health check endpoint at `/api/health` that verifies:
- Database connectivity
- Basic service availability

Use this endpoint for:
- Load balancer health checks
- Deployment verification
- Monitoring alerts

Example health check configuration:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## Monitoring and Error Tracking

### Sentry Integration

Sentry is configured for error tracking in production. To enable:

1. Create a Sentry project at [sentry.io](https://sentry.io)

2. Set environment variables:
   ```bash
   SENTRY_DSN=https://...@sentry.io/...
   NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
   SENTRY_AUTH_TOKEN=...
   SENTRY_ORG=your-org
   SENTRY_PROJECT=salina-erp
   ```

3. Deploy - Sentry will automatically capture:
   - Server-side errors
   - Client-side errors
   - Performance traces
   - Session replays (on error)

### Logging

The application uses JSON-structured logging with automatic PII redaction. Logs include:
- Tenant provisioning events
- Authentication events
- Database errors
- Webhook processing

Logs are written to stdout and can be ingested by your platform's logging service.

## Backups

### Automated Database Backups

**Railway:**
```bash
railway backups create
railway backups restore <backup-id>
```

**Fly.io:**
```bash
fly postgres backup create <postgres-app>
fly postgres backup restore <backup-id>
```

**Render:**
Automatic daily backups with 30-day retention (configured in dashboard)

### Point-in-Time Recovery

All recommended platforms (Railway, Fly.io, Render) support point-in-time recovery for PostgreSQL. Enable this feature in production for disaster recovery.

## Scaling

### Horizontal Scaling

The application is stateless and can be scaled horizontally by adding more instances:

```bash
# Railway
railway scale --replicas 3

# Fly.io
fly scale count 3

# Render
# Configure auto-scaling in dashboard
```

### Database Connection Pooling

Ensure your `DATABASE_URL` uses connection pooling (pgBouncer) to support multiple application instances:

```
postgresql://user:pass@pooler.example.com:6432/database?pgbouncer=true
```

## Troubleshooting

### Build Failures

1. **Pino bundling errors:** We've replaced Pino with a custom logger to avoid Turbopack bundling issues
2. **TypeScript errors:** Run `pnpm build` locally to catch errors before deployment
3. **Missing environment variables:** Verify all required variables are set

### Runtime Issues

1. **Database connection errors:**
   - Verify `DATABASE_URL` is correct
   - Check database is accessible from app
   - Ensure connection pooling is enabled

2. **Clerk webhook failures:**
   - Verify `CLERK_WEBHOOK_SECRET` matches Clerk dashboard
   - Check webhook URL is publicly accessible
   - Review Clerk webhook logs

3. **Health check failures:**
   - Check `/api/health` endpoint directly
   - Verify database connectivity
   - Review application logs

## Security Checklist

- [ ] All secrets stored in environment variables (never committed)
- [ ] PostgreSQL uses SSL/TLS in production
- [ ] Clerk webhook signatures verified
- [ ] Sentry configured with appropriate DSN
- [ ] Database backups enabled
- [ ] Health check endpoint not exposing sensitive data
- [ ] Container runs as non-root user (already configured in Dockerfile)
- [ ] Rate limiting configured (platform-level)

## Post-Deployment

After deploying:

1. Verify health check: `curl https://your-app.com/api/health`
2. Test authentication flow
3. Verify Clerk webhook is receiving events
4. Check Sentry for any errors
5. Monitor database connection pool usage
6. Set up alerts for critical errors

## Support

For deployment issues, refer to:
- [Story 1.6: Set Up Deployment Infrastructure](./sprint-artifacts/1-6-set-up-deployment-infrastructure.md)
- [Architecture Documentation](./architecture.md)
- Platform-specific documentation (Railway/Fly.io/Render)
