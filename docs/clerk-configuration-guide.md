# Clerk Configuration Guide

This guide provides step-by-step instructions for configuring Clerk for Salina ERP's multi-tenant architecture.

## Prerequisites

- Clerk account created at [clerk.com](https://clerk.com)
- Application created in Clerk Dashboard
- Environment variables configured in `.env.local`

## Step 1: Enable Organizations

Organizations in Clerk map 1:1 to Salina tenants (publishers).

1. Navigate to **Clerk Dashboard** → Your Application
2. Go to **Organizations** in the sidebar
3. Enable Organizations if not already enabled
4. Configure Organization Settings:
   - **Name:** Required field for organization
   - **Slug:** Auto-generated from name (unique identifier)
   - **Logo:** Optional (tenants can upload custom logo in Salina settings)

## Step 2: Configure Organization Creation

Allow users to create organizations during sign-up:

1. Go to **Organizations** → **Settings**
2. Enable **"Allow users to create organizations"**
3. Set **"Creation mode"** to **"During sign-up"** (prompts new users to create org)
4. Enable **"Require users to be part of an organization"** (enforces multi-tenancy)

This ensures:
- Every new user creates an organization (publisher/tenant)
- Users without an organization cannot access the app (orgId required for RLS)
- Organization creation triggers webhook → tenant provisioning (Story 1.5)

## Step 3: Define 8 Custom Roles

Salina ERP uses 8 role-based access control roles stored in Clerk user metadata.

**Important:** Clerk's Organizations feature has built-in roles (org:admin, org:member), but we use **custom roles in user metadata** for fine-grained field-level permissions.

### Role Definitions

Add these roles to user metadata during user invitation (Story 2.1):

1. **publisher_owner**
   - Full system access
   - Can invite users, assign roles, manage billing
   - Can access all features and data

2. **managing_editor**
   - Manages titles, contributors, production workflows
   - Cannot access costs, financial reports, billing

3. **production_staff**
   - Manages files, production tasks, title metadata
   - Cannot access customer data, financials

4. **sales_marketing**
   - Manages customers, orders, sales reports
   - Cannot see unit costs, margins (wholesale prices only)

5. **warehouse_operations**
   - Manages inventory, fulfillment, shipping
   - Cannot access prices, customer contact details

6. **accounting**
   - Full access to financials, exports, royalty statements
   - Cannot access production details, contributor management

7. **author** (Growth phase - Epic 11)
   - View own titles and royalties only
   - Limited self-service portal

8. **illustrator** (Growth phase - Epic 11)
   - View own titles and royalties only
   - Limited self-service portal

### Implementation Pattern

Roles are stored as an array in `user.publicMetadata.roles`:

```typescript
// Clerk user metadata structure
{
  publicMetadata: {
    roles: ['publisher_owner'] // Can have multiple roles
  }
}
```

### Setting Roles

Roles are assigned:
- **During invitation** (Story 2.1) - Publisher/Owner invites user with specific role
- **Via User Management UI** (Story 2.3) - Publisher/Owner can update roles
- **Default:** First user in organization → automatically `publisher_owner`

## Step 4: Configure Webhooks (Story 1.5: Tenant Provisioning)

Clerk webhooks enable real-time synchronization between Clerk and Salina's database.

### Webhook Endpoint

**URL:** `https://your-domain.com/api/webhooks/clerk`
**Method:** POST
**Security:** Svix signature verification (CLERK_WEBHOOK_SECRET)

### Required Events

Configure these webhook events in Clerk Dashboard:

1. **organization.created** - Triggers tenant provisioning
2. **user.created** - Syncs new users to local database (Story 2.1)
3. **user.updated** - Syncs profile changes (Story 2.1)
4. **organizationMembership.created** - Tracks user-tenant associations (Story 2.1)

### Setup Instructions

1. Navigate to **Clerk Dashboard** → **Webhooks**
2. Click **Add Endpoint**
3. **Endpoint URL:** Enter your webhook URL
   - Development: Use ngrok (see Local Testing below)
   - Production: `https://your-domain.com/api/webhooks/clerk`
4. **Events:** Subscribe to all 4 events listed above
5. **Signing Secret:** Copy the webhook secret (starts with `whsec_`)
6. Add to `.env.local`:
   ```bash
   CLERK_WEBHOOK_SECRET=whsec_your_secret_here
   ```

### Event: organization.created

**Purpose:** Automatically provision tenant when organization is created in Clerk.

**Payload Example:**
```json
{
  "type": "organization.created",
  "data": {
    "id": "org_abc123",
    "name": "Acme Publishing",
    "slug": "acme-publishing",
    "created_by": "user_xyz789",
    "created_at": 1699999999,
    "public_metadata": {},
    "private_metadata": {}
  }
}
```

**Webhook Handler Behavior (src/app/api/webhooks/clerk/route.ts):**

1. **Idempotency Check:** Verify tenant doesn't already exist for this orgId
2. **Create Tenant Record:**
   - Generate new UUID for tenant.id
   - Set tenantId = id (self-referential for RLS)
   - Set clerkOrgId = data.id (1:1 mapping)
   - Set status = 'active'
   - Initialize default settings:
     - Branding: Publishing Ink theme (#1e3a8a navy, #d97706 amber)
     - Locale: America/New_York, USD, imperial, en-US
     - Onboarding: Empty progress, currentStep = 'welcome'
3. **Initialize Feature Flags:** Call initializeFeatureFlags(tenantId, 'starter')
4. **Log Success:** Structured log with tenantId, orgId, name

**Expected Response:** `200 OK { "received": true }`

### Local Testing with ngrok

For local development, use ngrok to expose your local server to Clerk webhooks:

1. **Install ngrok:** `npm install -g ngrok`
2. **Start Next.js:** `pnpm dev` (runs on http://localhost:3000)
3. **Start ngrok:** `ngrok http 3000`
4. **Copy ngrok URL:** e.g., `https://abc123.ngrok.io`
5. **Configure Clerk webhook:** Use `https://abc123.ngrok.io/api/webhooks/clerk`
6. **Test webhook:**
   - Create a new organization in Clerk UI
   - Verify tenant created in database (check logs)
   - Verify feature flags initialized (query tenant_features table)

### Verifying Webhook Delivery

**Check Clerk Dashboard:**
1. Go to **Webhooks** → Your endpoint
2. View **Recent Deliveries** tab
3. Check status (200 = success, 4xx/5xx = error)
4. View request/response payload for debugging

**Check Application Logs:**
```bash
# Development logs show structured JSON
pnpm dev

# Look for these log entries:
# - "organization.created webhook received"
# - "Tenant provisioned successfully"
# - "Feature flags initialized successfully"
```

**Check Database:**
```sql
-- Verify tenant created
SELECT * FROM tenants WHERE clerk_org_id = 'org_abc123';

-- Verify feature flags
SELECT * FROM tenant_features WHERE tenant_id = '<tenant_id>';
```

## Step 5: Configure Webhooks (Continued)

Webhooks sync Clerk events to Salina database.

1. Go to **Webhooks** in Clerk Dashboard
2. Click **Add Endpoint**
3. Configure webhook:
   - **Endpoint URL:** `https://your-domain.com/api/webhooks/clerk`
     - For local development, use ngrok: `https://your-ngrok-url.ngrok.io/api/webhooks/clerk`
   - **Events to listen for:**
     - ✅ `user.created` - Sync new users to local database (Story 2.1)
     - ✅ `organization.created` - Create tenant record (Story 1.5)
     - ✅ `organizationMembership.created` - Track user-tenant associations (Story 2.1)
     - ✅ `user.updated` - Sync profile changes (Story 2.1)
     - ✅ `organization.updated` - Sync org name/slug changes (Story 1.5)
   - **Signing Secret:** Copy this value → add to `.env.local` as `CLERK_WEBHOOK_SECRET`

4. Save webhook configuration
5. Test webhook:
   - Click **Send Test Event** → `organization.created`
   - Verify webhook endpoint receives and logs the event

## Step 5: Copy Environment Variables

Copy the required values from Clerk Dashboard to `.env.local`:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxx
CLERK_SECRET_KEY=sk_live_xxxxxxxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxx
```

**Where to find these:**
- **Publishable Key:** Dashboard → API Keys → Publishable key
- **Secret Key:** Dashboard → API Keys → Secret keys → Show (copy carefully)
- **Webhook Secret:** Webhooks → Your endpoint → Signing Secret

**Security Notes:**
- ✅ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Safe to expose to client
- ❌ `CLERK_SECRET_KEY` - NEVER commit to git or expose to client
- ❌ `CLERK_WEBHOOK_SECRET` - Server-only for signature verification

## Step 6: Configure Redirects

Set default redirect URLs for sign-in/sign-up flows:

1. Go to **Paths** in Clerk Dashboard
2. Configure:
   - **Sign-in URL:** `/sign-in`
   - **Sign-up URL:** `/sign-up`
   - **After sign-in:** `/dashboard`
   - **After sign-up:** `/dashboard` (future: `/onboarding` in Story 10.5)
   - **Organization selection:** `/dashboard` (allows org switching)

## Verification Checklist

After completing configuration, verify:

- [ ] Organizations enabled in Clerk Dashboard
- [ ] Organization creation required during sign-up
- [ ] 8 custom roles documented (will be implemented in code)
- [ ] Webhook endpoint configured with correct URL
- [ ] Webhook signing secret copied to `.env.local`
- [ ] All environment variables set in `.env.local`
- [ ] Redirect paths configured correctly
- [ ] Test sign-up creates organization successfully
- [ ] Webhook fires when organization created (check logs)

## Local Development Setup

For testing webhooks locally:

1. Install ngrok: `npm install -g ngrok`
2. Start your Next.js dev server: `pnpm dev`
3. Start ngrok: `ngrok http 3000`
4. Copy ngrok URL: `https://abc123.ngrok.io`
5. Update webhook endpoint in Clerk Dashboard: `https://abc123.ngrok.io/api/webhooks/clerk`
6. Test webhook by creating a new organization in Clerk

## Troubleshooting

**Organizations not showing during sign-up:**
- Verify Organizations are enabled in Dashboard → Organizations
- Check "Allow users to create organizations" is enabled
- Ensure "Creation mode" is set to "During sign-up"

**Webhook not firing:**
- Verify endpoint URL is publicly accessible (use ngrok for local dev)
- Check webhook events are selected (organization.created, user.created, etc.)
- View webhook logs in Clerk Dashboard → Webhooks → Your endpoint → Logs

**Authentication errors:**
- Verify CLERK_SECRET_KEY is correct (check for copy/paste errors)
- Ensure NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY matches your environment (test vs. live)
- Check middleware.ts is in src/middleware.ts (not app/middleware.ts)

## Next Steps

After Clerk configuration is complete:
- ✅ **Story 1.4:** Auth routes created, middleware configured
- 🔄 **Story 1.5:** Webhook handler implementation for tenant provisioning
- 🔄 **Story 2.1:** User invitation system with role assignment
- 🔄 **Story 2.2:** RBAC permission checks in Server Actions

---

**References:**
- [Clerk Organizations Documentation](https://clerk.com/docs/organizations/overview)
- [Clerk Webhooks Documentation](https://clerk.com/docs/webhooks/overview)
- [Clerk Metadata Documentation](https://clerk.com/docs/users/metadata)
- Salina Architecture: `docs/architecture.md:277-298`
