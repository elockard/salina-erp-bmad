# salina-erp-bmad - Epic Breakdown

**Author:** BMad
**Date:** 2025-11-18
**Project Level:** enterprise
**Target Scale:** Multi-tenant SaaS

---

## Overview

This document provides the complete epic and story breakdown for salina-erp-bmad, decomposing the requirements from the [PRD](./prd.md) into implementable stories.

**Living Document Notice:** This is the initial version. It will be updated after UX Design and Architecture workflows add interaction and technical details to stories.

**MVP Epics (10 Epics, ~50-60 Stories):**

1. **Foundation & Multi-Tenant Setup** - Core infrastructure, authentication, tenant provisioning
2. **User & Access Management** - 8-role RBAC system, user invitations, permissions
3. **ISBN Block Management** - ISBN generation with Modulo 10, reservation, alerts
4. **Title & Metadata Management** - Title wizard, multi-format support, BISAC, assets
5. **Contributor Management** - Author/illustrator tracking, title associations
6. **Customer Management** - Customer records, types, pricing rules
7. **Inventory Management** - Stock tracking, print runs, moving average cost, alerts
8. **Order Processing** - Order entry, fulfillment, shipping, returns (complete lifecycle)
9. **Integration Ecosystem** - Shopify, QuickBooks, EasyPost integrations
10. **Dashboards & Reporting** - KPIs, sales reports, inventory reports, onboarding

**Growth Epics (4 Epics, Post-MVP):**

11. **Contracts & Royalties** - Contract records, royalty calculations, statements
12. **Production & Scheduling** - Production milestones, Gantt/Kanban views, task management
13. **ONIX & Metadata Automation** - ONIX 3.0 export, batch updates, distributor sync
14. **Advanced Analytics** - Title P&L, inventory aging, cash flow projections

---

## Functional Requirements Inventory

**MVP Requirements (FR1-FR114):**

- **Tenant & Subscription Management:** FR1-FR9
- **User Management & Access Control:** FR10-FR17
- **ISBN Block Management:** FR18-FR26
- **Title & Metadata Management:** FR27-FR40
- **Contributor Management:** FR41-FR47
- **Customer Management:** FR48-FR53
- **Inventory Management:** FR54-FR62
- **Order Management:** FR63-FR72
- **Fulfillment & Shipping:** FR73-FR80
- **Returns Management:** FR81-FR85
- **Integrations:** FR86-FR99
- **Dashboards & Reporting:** FR100-FR106
- **System Administration:** FR107-FR114

**Growth Requirements (FR115-FR144):**

- **Contracts & Royalties:** FR115-FR125
- **Production & Scheduling:** FR126-FR134
- **ONIX & Metadata Export:** FR135-FR138
- **Advanced Analytics:** FR139-FR144

---

## FR Coverage Map

| Epic | Covers FRs | FR Count |
|------|-----------|----------|
| Epic 1: Foundation & Multi-Tenant Setup | FR1-FR9 | 9 FRs |
| Epic 2: User & Access Management | FR10-FR17 | 8 FRs |
| Epic 3: ISBN Block Management | FR18-FR26 | 9 FRs |
| Epic 4: Title & Metadata Management | FR27-FR40 | 14 FRs |
| Epic 5: Contributor Management | FR41-FR47 | 7 FRs |
| Epic 6: Customer Management | FR48-FR53 | 6 FRs |
| Epic 7: Inventory Management | FR54-FR62 | 9 FRs |
| Epic 8: Order Processing | FR63-FR85 | 23 FRs |
| Epic 9: Integration Ecosystem | FR86-FR99 | 14 FRs |
| Epic 10: Dashboards & Reporting | FR100-FR114 | 15 FRs |
| **Total MVP Coverage** | **FR1-FR114** | **114 FRs** |
| Epic 11: Contracts & Royalties (Growth) | FR115-FR125 | 11 FRs |
| Epic 12: Production & Scheduling (Growth) | FR126-FR134 | 9 FRs |
| Epic 13: ONIX & Metadata Automation (Growth) | FR135-FR138 | 4 FRs |
| Epic 14: Advanced Analytics (Growth) | FR139-FR144 | 6 FRs |
| **Total Growth Coverage** | **FR115-FR144** | **30 FRs** |
| **GRAND TOTAL** | **FR1-FR144** | **144 FRs** |

---

## Epic 1: Foundation & Multi-Tenant Setup

**Epic Goal:** Establish the foundational infrastructure for Salina ERP including Next.js application, PostgreSQL database with Row-Level Security, Clerk authentication, and tenant provisioning workflows. This epic enables publishers to sign up, create isolated tenants, and begin using the platform.

**Covers:** FR1-FR9 (Tenant & Subscription Management)

**Dependencies:** None (greenfield project start)

---

### Story 1.1: Initialize Next.js Project with Core Dependencies

As a **developer**,
I want **to initialize the Next.js project with TypeScript, Tailwind CSS, and shadcn/ui**,
So that **the foundational codebase is ready for feature development**.

**Acceptance Criteria:**

**Given** the project repository exists
**When** I run `npx create-next-app@latest` with the specified options
**Then** the project is created with Next.js 15, TypeScript 5, Tailwind CSS 4, App Router, and src/ directory structure

**And** shadcn/ui is initialized with `npx shadcn@latest init`
**And** the Publishing Ink theme is configured in tailwind.config.ts (navy blue, amber accents, slate text)
**And** the project structure follows the Architecture spec (app/, components/, lib/, db/, etc.)

**Prerequisites:** None (first story)

**Technical Notes:**
- Follow Architecture docs/architecture.md:18-50 for exact initialization commands
- Use create-next-app flags: `--typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
- Configure Publishing Ink theme colors in tailwind.config.ts:263-272
- Install ESLint, Prettier, and configure for consistency
- **Covers:** Foundation setup (prerequisite for all FRs)

---

### Story 1.2: Set Up PostgreSQL Database with Drizzle ORM

As a **developer**,
I want **to configure PostgreSQL with Drizzle ORM and establish the database connection**,
So that **we can define schemas and execute type-safe queries**.

**Acceptance Criteria:**

**Given** the Next.js project is initialized
**When** I install drizzle-orm, drizzle-kit, and pg driver
**Then** the database connection is configured in db/index.ts with connection pooling

**And** drizzle.config.ts is created with migration settings
**And** the base schema (db/schema/base.ts) is created with tenantFields mixin (tenant_id, created_at, updated_at)
**And** I can run `pnpm db:generate` and `pnpm db:migrate` successfully
**And** docker-compose.yml is created for local PostgreSQL and Redis

**Prerequisites:** Story 1.1 (project initialization)

**Technical Notes:**
- Follow Architecture docs/architecture.md:229-238 for Drizzle configuration
- Create tenantFields mixin in db/schema/base.ts:1504-1510
- Configure pgBouncer connection pooling (100 connections)
- Set up local development with docker-compose.yml:1932-1966
- **Covers:** Database foundation (prerequisite for FR2)

---

### Story 1.3: Implement Row-Level Security (RLS) Infrastructure

As a **developer**,
I want **to implement the Row-Level Security pattern with withTenantContext wrapper**,
So that **tenant data isolation is enforced at the database level**.

**Acceptance Criteria:**

**Given** the database is configured with Drizzle
**When** I create the withTenantContext() wrapper function
**Then** it sets the `app.current_tenant_id` session variable before executing queries

**And** the RLS policy template is defined using Drizzle's pgPolicy()
**And** the tenants table is created with RLS policy for tenant_isolation
**And** test queries verify that RLS blocks cross-tenant access
**And** the pattern is documented for future schema definitions

**Prerequisites:** Story 1.2 (database setup)

**Technical Notes:**
- Implement withTenantContext in db/tenant-context.ts:124
- Follow RLS pattern in docs/architecture.md:1501-1527
- Create tenants table in db/schema/tenants.ts with RLS policy
- Write integration tests for RLS enforcement (tests/integration/rls.test.ts)
- **Critical:** All future tenant-scoped tables must use this pattern
- **Covers:** FR2 (tenant provisioning with isolated schema)

---

### Story 1.4: Integrate Clerk Authentication

As a **developer**,
I want **to integrate Clerk for authentication and organization management**,
So that **users can sign up, log in, and belong to tenant organizations**.

**Acceptance Criteria:**

**Given** the RLS infrastructure is in place
**When** I install @clerk/nextjs and configure environment variables
**Then** the Clerk middleware is set up in src/middleware.ts

**And** auth routes are created: `app/(auth)/sign-in/[[...sign-in]]/page.tsx` and `sign-up`
**And** Clerk Organizations are mapped 1:1 to Salina tenants
**And** the 8 custom roles are defined in Clerk metadata (publisher_owner, managing_editor, etc.)
**And** users can sign up, create an organization, and be assigned a role
**And** auth() helper provides userId and orgId in Server Actions

**Prerequisites:** Story 1.3 (RLS infrastructure)

**Technical Notes:**
- Follow Architecture docs/architecture.md:277-298 for Clerk configuration
- Middleware pattern: Extract orgId → setTenantContext() for RLS
- Define 8 roles in Clerk dashboard: docs/architecture.md:283-291
- Clerk webhook endpoint for user/org sync (will be enhanced in Story 2.1)
- **Covers:** FR10-FR12 (partial - user authentication and invitation structure)

---

### Story 1.5: Build Tenant Provisioning Workflow

As a **prospective publisher**,
I want **to sign up for Salina ERP and have my tenant automatically provisioned**,
So that **I can start using the platform immediately**.

**Acceptance Criteria:**

**Given** Clerk authentication is integrated
**When** a new user signs up and creates an organization
**Then** a tenant record is created in the tenants table with isolated schema

**And** the tenant settings page allows configuration of branding (logo, colors, email templates)
**And** the tenant can set timezone, locale, default currency, and measurement units
**And** tiered subscription plans are defined with feature flags (Starter, Professional, Enterprise)
**And** the tenant can view usage metrics (titles, users, orders) on settings page
**And** the tenant can export complete data dump (JSON/CSV) from settings page

**Prerequisites:** Story 1.4 (Clerk integration)

**Technical Notes:**
- Webhook handler: `app/api/webhooks/clerk/route.ts` (Hono endpoint)
- Tenant schema in db/schema/tenants.ts with fields for branding, locale, timezone, currency
- Settings page: `app/(dashboard)/settings/company/page.tsx`
- Data export action in src/actions/tenants.ts using `db.select()` for all tenant tables
- Feature flags table: db/schema/tenant-features.ts (subscription tier controls)
- **Covers:** FR1 (self-service registration), FR2 (tenant provisioning), FR3 (branding), FR4 (timezone/locale/currency), FR5 (tiered plans), FR7 (usage tracking), FR8 (data export)

---

### Story 1.6: Set Up Deployment Infrastructure

As a **developer**,
I want **to configure Docker deployment and set up the production environment**,
So that **the application can be deployed to Railway/Fly.io/Render with automated backups**.

**Acceptance Criteria:**

**Given** the application is functional locally
**When** I create a Dockerfile following the multi-stage build pattern
**Then** the Docker image builds successfully and runs the application

**And** docker-compose.yml includes postgres, redis, and app services for local development
**And** environment variables are configured in .env.example (DATABASE_URL, CLERK_SECRET_KEY, etc.)
**And** the application is deployed to Railway/Fly.io/Render
**And** automated daily backups are configured for the PostgreSQL database
**And** point-in-time recovery is enabled (restore to any point within 30 days)

**Prerequisites:** Story 1.5 (tenant provisioning)

**Technical Notes:**
- Dockerfile: docs/architecture.md:1896-1930 (multi-stage build)
- docker-compose.yml: docs/architecture.md:1932-1966
- Deploy to Railway/Fly.io/Render (NOT Vercel due to timeout limits): docs/architecture.md:1969-1982
- Environment variables: docs/architecture.md:1984-2010
- Backup configuration: FR9 requires point-in-time restore with 30-day retention
- **Covers:** FR9 (automated backups), deployment foundation

## Epic 2: User & Access Management

**Epic Goal:** Enable publishers to invite team members, assign them to one of 8 roles, and enforce granular permissions throughout the application. This epic delivers the complete Role-Based Access Control (RBAC) system including user invitations, permission enforcement, audit trails, and user management interfaces.

**Covers:** FR10-FR17 (User Management & Access Control)

**Dependencies:** Epic 1 (Foundation & Multi-Tenant Setup - requires Clerk and tenant infrastructure)

---

### Story 2.1: Build User Invitation System

As a **Publisher/Owner**,
I want **to invite team members via email with assigned roles**,
So that **my staff can access the system with appropriate permissions**.

**Acceptance Criteria:**

**Given** I am logged in as Publisher/Owner
**When** I navigate to Settings > Users and click "Invite User"
**Then** I can enter an email address and select one of the 8 roles (publisher_owner, managing_editor, production_staff, sales_marketing, warehouse_operations, accounting, author, illustrator)

**And** the system sends an email invitation with an account activation link
**And** the invited user receives the email within 2 minutes
**And** the user can click the link, be redirected to Clerk sign-up, and complete their profile
**And** upon completing sign-up, the user is automatically added to the tenant organization with the assigned role
**And** the user appears in the Settings > Users list with their role displayed

**Prerequisites:** Story 1.4 (Clerk integration), Story 1.5 (tenant provisioning)

**Technical Notes:**
- User invitation page: `app/(dashboard)/settings/users/page.tsx`
- Server Action: `src/actions/users.ts` → `inviteUser(email, role, tenantId)`
- Inngest job for email sending: `inngest/functions/email-notifications.ts`
- Clerk Organizations API for adding members with roles
- Email template with branding from tenant settings (FR3)
- **Covers:** FR10 (invite users), FR11 (invitation email), FR12 (accept invitation)

---

### Story 2.2: Implement Role-Based Permission System

As a **developer**,
I want **to implement the 8-role RBAC system with field-level permissions**,
So that **users only see and edit what their role allows**.

**Acceptance Criteria:**

**Given** the user invitation system is functional
**When** I create the permissions library in `lib/permissions.ts`
**Then** permission functions are defined for each capability (canEditTitle, canSeeCosts, canManageInventory, etc.)

**And** the 8 roles are fully defined with their permissions matrix (docs/architecture.md:1729-1742)
**And** Server Actions check permissions before executing (throw FORBIDDEN error if denied)
**And** React components use permission hooks to conditionally render UI elements
**And** API routes (Hono) verify permissions for webhook-triggered actions
**And** field-level permissions hide sensitive data (Sales sees price but not cost)

**Prerequisites:** Story 2.1 (user invitation)

**Technical Notes:**
- Permission functions: `lib/permissions.ts` (e.g., `canEditTitle(role): boolean`)
- Permission hook: `hooks/use-permissions.ts` → `const { canEditTitle } = usePermissions()`
- Server Action pattern: Check auth().orgId + user role, call permission function, throw AppError if denied
- 8 roles permission matrix: docs/prd.md:232-292 (detailed permission lists)
- Field-level example: Hide `unitCost` field in Order table for sales_marketing role
- **Covers:** FR13 (enforce RBAC for 8 roles), FR17 (field-level permissions)

---

### Story 2.3: Build User Management Interface

As a **Publisher/Owner**,
I want **to manage my team members (view, deactivate, reactivate)**,
So that **I can control who has access to our tenant**.

**Acceptance Criteria:**

**Given** users have been invited and accepted
**When** I navigate to Settings > Users
**Then** I see a table of all users in my tenant with columns: Name, Email, Role, Status (Active/Inactive), Last Login

**And** I can click a user row to view their profile and activity
**And** I can click "Deactivate" to revoke access (user remains in database but cannot log in)
**And** I can click "Reactivate" to restore access
**And** any user can click "Edit Profile" to update their own name, email, and contact information
**And** role changes require deactivation → role update → reactivation (prevents accidental escalation)

**Prerequisites:** Story 2.2 (permission system)

**Technical Notes:**
- User list page: `app/(dashboard)/settings/users/page.tsx` (Server Component fetches users)
- User profile page: `app/(dashboard)/settings/users/[id]/page.tsx`
- Server Actions: `src/actions/users.ts` → `deactivateUser()`, `reactivateUser()`, `updateUserProfile()`
- Clerk API: Update user metadata (active/inactive status)
- Users table: Synced from Clerk via webhook (db/schema/users.ts)
- **Covers:** FR15 (deactivate/reactivate users), FR16 (update own profile)

---

### Story 2.4: Implement Audit Trail System

As a **Publisher/Owner**,
I want **to view an audit trail of sensitive user actions**,
So that **I can track who did what and when for compliance and security**.

**Acceptance Criteria:**

**Given** the user management interface is complete
**When** a user performs a sensitive action (create/edit contract, modify royalty, export financial data, change permissions)
**Then** an audit log entry is created with: userId, tenantId, action type, resource type, resource ID, timestamp, IP address

**And** I can navigate to Settings > Audit Log to view all entries
**And** I can filter by user, action type, date range, and resource type
**And** audit logs are immutable (cannot be edited or deleted)
**And** audit logs are retained for minimum 7 years
**And** audit logs exclude non-sensitive actions (viewing pages, searching)

**Prerequisites:** Story 2.3 (user management interface)

**Technical Notes:**
- Audit log table: `db/schema/audit-logs.ts` with RLS policy (owner/accounting only)
- Audit log page: `app/(dashboard)/settings/audit-log/page.tsx`
- Helper function: `lib/audit.ts` → `logAuditEvent(action, resourceType, resourceId)`
- Call logAuditEvent() in Server Actions for sensitive operations
- Sensitive actions list: contracts, royalties, financial exports, user management, integration configs
- Use Pino logger in addition to DB (dual logging for redundancy)
- **Covers:** FR14 (audit trail of user actions on sensitive data)

---

## Epic 3: ISBN Block Management

**Epic Goal:** Enable publishers to manage their ISBN inventory by adding blocks, auto-generating the full 100-ISBN range with Modulo 10 check digits, reserving ISBNs for future titles, and receiving alerts when blocks are nearing exhaustion. This is a publishing-specific feature critical for title management.

**Covers:** FR18-FR26 (ISBN Block Management)

**Dependencies:** Epic 1 (Foundation), Epic 2 (User & Access Management - requires permissions)

---

### Story 3.1: Implement ISBN Modulo 10 Algorithm

As a **developer**,
I want **to implement the ISBN-13 Modulo 10 check digit calculation**,
So that **the system can generate valid ISBNs automatically**.

**Acceptance Criteria:**

**Given** the codebase is ready for ISBN functionality
**When** I implement `calculateISBN13CheckDigit(prefix)` in `lib/isbn.ts`
**Then** the function takes a 12-digit prefix (e.g., "978-1-234567-42") and returns the check digit (0-9)

**And** the algorithm alternates weights (1, 3, 1, 3...) for each digit as per ISBN-13 spec
**And** the check digit is calculated as (10 - (sum % 10)) % 10
**And** unit tests verify check digits for known valid ISBNs
**And** edge cases are tested (sum ending in 0, large prefixes, etc.)

**Prerequisites:** Story 1.2 (database setup)

**Technical Notes:**
- Implementation: `lib/isbn.ts:462-474` (follow Architecture pattern exactly)
- Algorithm: docs/architecture.md:456-498 (full ISBN pattern design)
- Unit tests: `tests/unit/isbn.test.ts` with known valid ISBNs from publishers
- Reference: ISBN-13 specification (Modulo 10 weighted checksum)
- **Covers:** FR19 (partial - check digit calculation for ISBN generation)

---

### Story 3.2: Create ISBN Block Generation System

As a **Publisher/Owner**,
I want **to enter an ISBN prefix and have the system generate all 100 ISBNs**,
So that **I don't have to manually calculate check digits**.

**Acceptance Criteria:**

**Given** the Modulo 10 algorithm is implemented
**When** I enter an ISBN prefix (e.g., "978-1-234567") in Settings > ISBN Blocks
**Then** the system generates all 100 ISBNs (suffix 00-99) with auto-calculated check digits

**And** the ISBNs are stored in two tables: `isbn_blocks` (with RLS) and `isbns` (global, no RLS)
**And** the `isbns` table enforces global uniqueness (cannot create duplicate ISBNs across all tenants)
**And** each ISBN starts with status "available"
**And** the block displays utilization: "0 of 100 used"
**And** I can create multiple blocks for my tenant

**Prerequisites:** Story 3.1 (Modulo 10 algorithm)

**Technical Notes:**
- Database schemas: `db/schema/isbn-blocks.ts` (with RLS), `db/schema/isbns.ts` (NO RLS for uniqueness)
- Server Action: `src/actions/isbn-blocks.ts` → `createISBNBlock(prefix)`
- Algorithm: Loop 0-99, calculate check digit, insert into both tables
- Architecture pattern: docs/architecture.md:500-527 (two-table design for global uniqueness)
- ISBN format: "978-1-234567-42-7" (prefix-sequence-check)
- **Covers:** FR18 (enter ISBN prefix), FR19 (generate range with check digits), FR21 (global uniqueness), FR25 (multiple blocks)

---

### Story 3.3: Build ISBN Reservation System

As a **Managing Editor**,
I want **to reserve ISBNs for upcoming titles before full title creation**,
So that **I can allocate ISBNs during planning without creating full records**.

**Acceptance Criteria:**

**Given** ISBN blocks exist with available ISBNs
**When** I navigate to Settings > ISBN Blocks and click "Reserve ISBN"
**Then** I can select an available ISBN and mark it as "reserved" with an optional title note

**And** reserved ISBNs show status "reserved" instead of "available"
**And** reserved ISBNs do not appear in the title creation wizard's available ISBN list
**And** I can "un-reserve" an ISBN to make it available again
**And** reserved ISBNs can be converted to "assigned" when the title is created

**Prerequisites:** Story 3.2 (ISBN block generation)

**Technical Notes:**
- ISBN reservation modal: `components/isbn/ISBNReservationModal.tsx`
- Server Action: `src/actions/isbn-blocks.ts` → `reserveISBN(isbn, titleNote?)`, `unreserveISBN(isbn)`
- ISBN statuses: 'available' | 'reserved' | 'assigned'
- Update `isbns` table status field (no tenant_id, but track `assignedToTenantId`)
- Display reserved ISBNs in Settings > ISBN Blocks with note and reservation date
- **Covers:** FR24 (reserve ISBNs for future titles)

---

### Story 3.4: Build ISBN Block Visualizer and Picker

As a **Publisher/Owner**,
I want **to visualize ISBN block utilization and pick specific ISBNs**,
So that **I can see at a glance which ISBNs are available and choose specific numbers**.

**Acceptance Criteria:**

**Given** ISBN blocks exist with various statuses (available, reserved, assigned)
**When** I navigate to Settings > ISBN Blocks and click a block
**Then** I see a grid visualizer showing all 100 ISBNs color-coded by status (green=available, yellow=reserved, blue=assigned)

**And** I can click an available ISBN to reserve it
**And** I can filter the view to show only available ISBNs
**And** the block card shows utilization metrics: "45 of 100 used, 5 reserved, 50 available"
**And** I can search for a specific ISBN across all my blocks

**Prerequisites:** Story 3.3 (ISBN reservation)

**Technical Notes:**
- Component: `components/isbn/ISBNBlockVisualizer.tsx` (grid view with color coding)
- Component: `components/isbn/ISBNPicker.tsx` (for title creation wizard)
- Use TanStack Query to cache ISBN data with 5-min stale time
- Grid layout: 10x10 grid for 100 ISBNs
- Real-time updates: Ably channel for ISBN status changes (optional enhancement)
- **Covers:** FR20 (track available/assigned status), FR22 (view block utilization), FR26 (manually assign from pool)

---

### Story 3.5: Implement Low-ISBN Alert System

As a **Publisher/Owner**,
I want **to receive an alert when an ISBN block has fewer than 5 available ISBNs**,
So that **I can purchase new blocks before running out**.

**Acceptance Criteria:**

**Given** ISBN blocks exist with varying utilization
**When** an ISBN block reaches 5 or fewer available ISBNs
**Then** the Publisher/Owner receives an email alert

**And** a warning badge appears on the Settings > ISBN Blocks page
**And** the block card displays "⚠️ Low ISBN Alert: Only 3 available"
**And** the dashboard shows a "Low ISBN Blocks" widget if any blocks are low
**And** alerts are only sent once per block (not on every assignment after threshold)

**Prerequisites:** Story 3.4 (ISBN visualizer)

**Technical Notes:**
- Inngest job: `inngest/functions/low-isbn-alert.ts` (checks blocks daily + triggered on assignment)
- Trigger: Call after `assignISBN()` in Server Action, check if threshold crossed
- Email notification: Use email template with tenant branding
- Dashboard widget: `components/dashboard/LowISBNAlert.tsx`
- Store alert status in `isbn_blocks` table (`low_isbn_alert_sent: boolean`)
- **Covers:** FR23 (alert when block < 5 remaining)

---

## Epic 4: Title & Metadata Management

**Epic Goal:** Enable publishers to create and manage their title catalog including the multi-step title creation wizard, multi-format support, ISBN assignment, BISAC code selection, asset uploads, and metadata management. This is the core content management capability of the ERP.

**Covers:** FR27-FR40 (Title & Metadata Management)

**Dependencies:** Epic 1 (Foundation), Epic 2 (User & Access), Epic 3 (ISBN Management - requires ISBN assignment)

---

### Story 4.1: Create Title Database Schema with Multi-Format Support

As a **developer**,
I want **to create the titles and formats tables with proper relationships**,
So that **a single title can have multiple formats (hardcover, paperback, ebook) with shared metadata**.

**Acceptance Criteria:**

**Given** the database and RLS infrastructure exist
**When** I create the titles and formats schemas in `db/schema/`
**Then** the titles table has fields for shared metadata (title, subtitle, description, cover_url, publication_date, status, sales_metadata)

**And** the formats table has fields for format-specific data (format_type, isbn, sku, retail_price, wholesale_price, print_cost, moving_average_cost, dimensions)
**And** formats table has a foreign key to titles (one-to-many relationship)
**And** both tables have RLS policies for tenant isolation
**And** migrations are generated and tested with sample data

**Prerequisites:** Story 3.2 (ISBN blocks exist for ISBN assignment)

**Technical Notes:**
- Schemas: `db/schema/titles.ts` (parent), `db/schema/formats.ts` (child)
- Follow Architecture pattern: docs/architecture.md:1531-1571 (multi-format design)
- Relationship: titles (1) → formats (*)
- BISAC codes: Separate reference table `db/schema/bisac-codes.ts` (NO RLS, shared across tenants)
- Sales metadata: JSONB field with keywords, target audience, marketing copy
- **Covers:** FR27 (create title records), FR30 (multiple formats per title), FR31 (unique ISBN per format)

---

### Story 4.2: Build Title Creation Wizard (Steps 1-3)

As a **Managing Editor**,
I want **to create new titles using a guided wizard**,
So that **I don't forget required information and can save progress**.

**Acceptance Criteria:**

**Given** the title schema exists
**When** I click "Create Title" in the Titles section
**Then** I am guided through a multi-step wizard with progress indicator

**Step 1 - Basic Information:**
- Enter title (required), subtitle (optional), format selection (hardcover/paperback/ebook)
- Auto-save draft on field blur

**Step 2 - ISBN Assignment:**
- View available ISBNs from my blocks
- Auto-suggest next available ISBN
- Allow manual ISBN selection from visualizer
- Display block utilization

**Step 3 - Contributors:**
- Add authors/illustrators with role (optional, can defer to later)
- Search existing contributors or create new
- Specify contribution percentage (optional)

**And** I can navigate back to previous steps to edit
**And** the wizard saves progress automatically (draft state)
**And** I can exit and resume later from Drafts section

**Prerequisites:** Story 4.1 (title schema), Story 3.4 (ISBN picker)

**Technical Notes:**
- Wizard component: `components/titles/TitleWizard.tsx` (multi-step form)
- Use React Hook Form with Zod validation: `validators/title.ts`
- Server Actions: `src/actions/titles.ts` → `saveTitleDraft()`, `createTitle()`
- Auto-save: Debounced save after 2 seconds of inactivity
- Draft status: `titles.status = 'draft'` until wizard completion
- **Covers:** FR27 (create titles), FR28 (wizard), FR29 (auto-suggest ISBN), FR41 (add contributors - partial)

---

### Story 4.3: Build Title Creation Wizard (Steps 4-7)

As a **Managing Editor**,
I want **to complete the title wizard with metadata, pricing, assets, and review**,
So that **titles are fully configured before activation**.

**Acceptance Criteria:**

**Step 4 - Metadata:**
- Add BISAC subject codes (autocomplete from reference table)
- Enter descriptions (short, long), keywords, target audience
- Set publication date and status (forthcoming, active, out-of-print)

**Step 5 - Pricing:**
- Set retail price per format (required)
- Set wholesale price (defaults to 50% of retail, editable)
- Configure discount schedules (bookstore, library, educational - optional)

**Step 6 - Assets:**
- Upload cover image (PNG/JPG, max 10MB) → stored in S3, URL in title record
- Upload interior PDF (optional) → S3
- Upload marketing files (optional) → S3

**Step 7 - Review & Create:**
- Show summary of all entered data
- Option to create production project (deferred to Epic 12)
- Click "Create Title" → finalizes title, marks status as 'active' (or 'forthcoming' if publication date is future)

**And** after creation, I see a success message with quick actions (add another format, create print run, view title)

**Prerequisites:** Story 4.2 (wizard steps 1-3)

**Technical Notes:**
- BISAC autocomplete: Query `bisac_codes` table (no RLS, reference data)
- File uploads: Presigned S3 POST URLs (15-min expiry), CloudFront delivery
- Storage pattern: `s3://bucket/tenants/{tenantId}/covers/{titleId}.jpg`
- Discount schedules: JSONB field in `formats` table or separate `pricing_rules` table
- Server Action: `createTitle()` wraps all steps in transaction
- **Covers:** FR32 (BISAC), FR33 (sales metadata), FR34 (upload assets), FR35 (pricing), FR36 (auto-save draft), FR37 (edit after creation - via separate story)

---

### Story 4.4: Build Title List and Detail Views

As a **Publisher/Owner**,
I want **to view all my titles in a searchable, filterable list**,
So that **I can quickly find and access title records**.

**Acceptance Criteria:**

**Given** titles exist in the system
**When** I navigate to the Titles section
**Then** I see a table of all titles with columns: Cover, Title, Formats, Publication Date, Status, Actions

**And** I can search by title, ISBN, author name, or BISAC code
**And** I can filter by status (forthcoming, active, out-of-print) and format type
**And** I can sort by publication date, title, or last updated
**And** clicking a row opens the Title Detail page
**And** the Title Detail page shows all formats, contributors, metadata, assets, and recent activity (orders, inventory)

**Prerequisites:** Story 4.3 (title creation wizard complete)

**Technical Notes:**
- List page: `app/(dashboard)/titles/page.tsx` (Server Component)
- Detail page: `app/(dashboard)/titles/[id]/page.tsx` (Server Component with parallel routes for tabs)
- Search: Full-text search using PostgreSQL `to_tsvector()` on title + subtitle
- Filter/sort: Query params → server-side filtering with Drizzle
- Data table: Use shared `components/shared/DataTable.tsx` with shadcn/ui Table
- **Covers:** FR38 (view complete title record), FR39 (search titles), FR40 (track publication date and status)

---

### Story 4.5: Build Title Editing Interface

As a **Managing Editor**,
I want **to edit existing title metadata, formats, and assets**,
So that **I can keep records up-to-date as information changes**.

**Acceptance Criteria:**

**Given** a title exists
**When** I open the Title Detail page and click "Edit"
**Then** I can update the title name, subtitle, description, keywords, BISAC codes, publication date, and status

**And** I can add new formats to the title (with unique ISBNs)
**And** I can edit existing formats (pricing, dimensions, SKU)
**And** I can upload new cover images or replace existing ones
**And** I can delete formats (only if no inventory or order history exists)
**And** changes are saved immediately with optimistic UI updates
**And** the title's `updated_at` timestamp is refreshed

**Prerequisites:** Story 4.4 (title list and detail views)

**Technical Notes:**
- Edit mode: Toggle between view/edit mode on Title Detail page
- Inline editing: Use shadcn/ui Form components with React Hook Form
- Server Actions: `updateTitle()`, `addFormat()`, `updateFormat()`, `deleteFormat()`
- Optimistic updates: TanStack Query mutation with onMutate
- Validation: Cannot delete format if `inventory.quantity > 0` OR `order_line_items` exist
- **Covers:** FR37 (edit existing titles)

---

## Epic 5: Contributor Management

**Epic Goal:** Enable publishers to manage authors and illustrators, link them to titles with roles and royalty percentages, and provide contributors with view-only access to their associated titles. This sets the foundation for the Royalties epic (Growth phase).

**Covers:** FR41-FR47 (Contributor Management)

**Dependencies:** Epic 1 (Foundation), Epic 2 (User & Access), Epic 4 (Title Management - requires titles to exist)

---

### Story 5.1: Create Contributor Database Schema

As a **developer**,
I want **to create the contributors and title_contributors junction table**,
So that **many-to-many relationships between contributors and titles can be tracked**.

**Acceptance Criteria:**

**Given** the title schema exists
**When** I create the contributor schema in `db/schema/contributors.ts`
**Then** the contributors table has fields for name, email, type (author/illustrator), contact information, payment details

**And** the title_contributors junction table links contributors to titles with role, contribution percentage, royalty rate (for future use)
**And** both tables have RLS policies for tenant isolation
**And** contributors can be linked to multiple titles
**And** titles can have multiple contributors

**Prerequisites:** Story 4.1 (title schema exists)

**Technical Notes:**
- Schema: `db/schema/contributors.ts` (contributor records)
- Junction table: `db/schema/title-contributors.ts` (many-to-many with metadata)
- Relationship: contributors (*) ←→ (*) titles via title_contributors
- Fields in junction: role (author, illustrator, editor, etc.), contribution_percentage, royalty_contract_id (nullable, for Epic 11)
- **Covers:** FR41 (add contributors), FR42 (specify role and percentage), FR43 (store contact info)

---

### Story 5.2: Build Contributor Management Interface

As a **Managing Editor**,
I want **to add, edit, and view contributors**,
So that **I can maintain accurate contributor records**.

**Acceptance Criteria:**

**Given** the contributor schema exists
**When** I navigate to the Contributors section and click "Add Contributor"
**Then** I can enter contributor details: name, email, type (author/illustrator), address, payment method, tax ID

**And** I can link the contributor to titles (or defer and add from title edit page)
**And** I can view a list of all contributors with search and filter by type
**And** clicking a contributor opens their profile showing contact info and associated titles
**And** I can edit contributor details (name, contact info, payment details)
**And** contributors with email addresses can be invited as users with "Author" or "Illustrator" role

**Prerequisites:** Story 5.1 (contributor schema)

**Technical Notes:**
- Contributor list: `app/(dashboard)/contributors/page.tsx`
- Contributor detail: `app/(dashboard)/contributors/[id]/page.tsx`
- Contributor modal: `components/contributors/ContributorModal.tsx` (reusable for add/edit)
- Server Actions: `src/actions/contributors.ts` → `createContributor()`, `updateContributor()`, `linkToTitle()`
- Invite as user: Reuse invitation system from Story 2.1, assign Author/Illustrator role
- **Covers:** FR41 (add contributors), FR42 (roles and percentages), FR43 (contact info), FR44 (link to multiple titles)

---

### Story 5.3: Add Contributors to Title Wizard and Title Edit

As a **Managing Editor**,
I want **to add contributors directly from the title creation/edit workflow**,
So that **I don't have to switch contexts to manage contributors**.

**Acceptance Criteria:**

**Given** the contributor management interface exists
**When** I am creating or editing a title and reach the Contributors step/section
**Then** I can search for existing contributors by name or email

**And** I can click "Add Existing Contributor" to link them to the title with a role and contribution percentage
**And** I can click "Create New Contributor" to open an inline modal, create the contributor, and link them immediately
**And** I can remove a contributor from a title (removes link but keeps contributor record)
**And** I can update role and contribution percentage for existing links

**Prerequisites:** Story 5.2 (contributor interface), Story 4.2 (title wizard)

**Technical Notes:**
- Enhance TitleWizard Step 3 with contributor search/add functionality
- Component: `components/contributors/ContributorSelector.tsx` (autocomplete search)
- Server Action: `linkContributorToTitle(titleId, contributorId, role, percentage)`
- Display contributors in Title Detail page with edit capability
- **Covers:** FR41 (add contributors to titles), FR42 (role and contribution percentage), FR44 (link to multiple titles)

---

### Story 5.4: Build Contributor Self-Service Portal

As an **Author or Illustrator**,
I want **to log in and view my associated titles**,
So that **I can see which titles I've worked on**.

**Acceptance Criteria:**

**Given** I am a contributor invited as a user with Author or Illustrator role
**When** I log in to Salina ERP
**Then** I see a simplified dashboard showing only my associated titles

**And** I can view title details (title, formats, publication date, status, cover image)
**And** I can view sales data for my titles (title-level sales summary, not detailed customer data)
**And** I can update my own contact information and payment details
**And** I cannot see titles I'm not associated with
**And** I cannot see other contributors' data or publisher financial information

**Prerequisites:** Story 5.3 (contributors linked to titles), Story 2.2 (permission system)

**Technical Notes:**
- Dashboard: `app/(dashboard)/page.tsx` (conditional rendering based on role)
- Permission function: `lib/permissions.ts` → `canViewTitle(userId, titleId, role)` checks `title_contributors` link
- Restrict queries: Server Component checks role, filters titles by contributor link
- Profile edit: `app/(dashboard)/profile/page.tsx` (own profile only)
- **Covers:** FR45 (view all titles associated with contributor), FR46 (contributors can log in and view titles), FR47 (update own contact info)

---

## Epic 6: Customer Management

**Epic Goal:** Enable publishers to maintain customer records for bookstores, schools, libraries, and consumers, categorize customers by type, configure customer-specific pricing rules, and view order history. This is essential for order processing and sales tracking.

**Covers:** FR48-FR53 (Customer Management)

**Dependencies:** Epic 1 (Foundation), Epic 2 (User & Access - requires sales/marketing roles)

---

### Story 6.1: Create Customer Database Schema

As a **developer**,
I want **to create the customers and customer_pricing tables**,
So that **customer records and custom pricing can be stored**.

**Acceptance Criteria:**

**Given** the database foundation exists
**When** I create the customer schema in `db/schema/customers.ts`
**Then** the customers table has fields for name, type (retail, wholesale, educational, consumer), contact info, billing address, shipping address(es)

**And** the customer_pricing table stores custom discount rules per customer (percentage off retail, flat rate, or specific format pricing)
**And** both tables have RLS policies for tenant isolation
**And** customers can have multiple shipping addresses (one-to-many)
**And** customers have a default payment terms field (net 30, net 60, etc.)

**Prerequisites:** Story 1.3 (RLS infrastructure)

**Technical Notes:**
- Schema: `db/schema/customers.ts` (customer records)
- Pricing table: `db/schema/customer-pricing.ts` (custom pricing rules)
- Customer types: 'retail' | 'wholesale' | 'educational' | 'consumer'
- Shipping addresses: JSONB array or separate `customer_addresses` table
- **Covers:** FR48 (create customer records), FR49 (categorize by type), FR50 (store addresses)

---

### Story 6.2: Build Customer Management Interface

As a **Sales & Marketing user**,
I want **to create, edit, and view customer records**,
So that **I can maintain accurate customer information for order processing**.

**Acceptance Criteria:**

**Given** the customer schema exists
**When** I navigate to the Customers section and click "Add Customer"
**Then** I can enter customer details: name, type, email, phone, billing address, shipping addresses (multiple), payment terms

**And** I can view a list of all customers with search (by name, email, location) and filter (by type)
**And** clicking a customer opens their profile showing contact info, addresses, pricing rules, and order history
**And** I can edit customer details (name, contact info, addresses, payment terms)
**And** I can archive customers (soft delete - hide from lists but preserve order history)

**Prerequisites:** Story 6.1 (customer schema)

**Technical Notes:**
- Customer list: `app/(dashboard)/customers/page.tsx`
- Customer detail: `app/(dashboard)/customers/[id]/page.tsx`
- Customer modal: `components/customers/CustomerModal.tsx`
- Server Actions: `src/actions/customers.ts` → `createCustomer()`, `updateCustomer()`, `archiveCustomer()`
- Search: Full-text search on name, email fields
- **Covers:** FR48 (create customers), FR49 (categorize by type), FR50 (store addresses), FR53 (search customers)

---

### Story 6.3: Build Customer Pricing Rules System

As a **Sales & Marketing user**,
I want **to configure custom pricing for specific customers**,
So that **wholesale, educational, and VIP customers get their negotiated discounts**.

**Acceptance Criteria:**

**Given** customers exist in the system
**When** I open a customer profile and click "Pricing Rules"
**Then** I can add custom pricing rules: percentage discount off retail (e.g., 40% off for wholesalers), or specific prices per format

**And** I can set different rules for different format types (e.g., 40% off hardcovers, 30% off paperbacks)
**And** I can set tiered discounts based on quantity (e.g., 10+ copies = 45% off)
**And** pricing rules apply automatically during order entry (next epic)
**And** I can view and edit existing pricing rules
**And** I can set an effective date range for pricing rules (seasonal discounts)

**Prerequisites:** Story 6.2 (customer interface)

**Technical Notes:**
- Pricing rules page: `app/(dashboard)/customers/[id]/pricing/page.tsx`
- Pricing rules table: `customer_pricing` with fields: customer_id, format_type (nullable for "all"), discount_type (percentage | fixed_amount), discount_value, min_quantity, effective_from, effective_to
- Server Actions: `src/actions/customers.ts` → `addPricingRule()`, `updatePricingRule()`, `deletePricingRule()`
- Pricing calculation helper: `lib/pricing.ts` → `calculateCustomerPrice(customerId, formatId, quantity)`
- **Covers:** FR51 (assign customer-specific pricing rules and discount schedules)

---

### Story 6.4: Add Customer Order History View

As a **Sales & Marketing user**,
I want **to view a customer's order history and purchase patterns**,
So that **I can understand their buying behavior and provide better service**.

**Acceptance Criteria:**

**Given** customers and orders exist (orders from Epic 8)
**When** I open a customer profile and navigate to the "Orders" tab
**Then** I see a list of all orders placed by this customer with date, total, status, and items

**And** I can see aggregate metrics: total orders, total revenue, average order value, last order date
**And** I can see purchase patterns: most frequently ordered titles, preferred formats
**And** I can click an order to view its full details
**And** the order history respects permissions (Warehouse cannot see customer names, only order numbers)

**Prerequisites:** Story 6.2 (customer interface), Epic 8 (Order Processing - will be enhanced once orders exist)

**Technical Notes:**
- Order history tab: `app/(dashboard)/customers/[id]/orders/page.tsx` (Server Component)
- Query: Join orders → order_line_items → formats → titles for customer
- Aggregate metrics: SQL aggregate queries (SUM, COUNT, AVG)
- Purchase patterns: Group by title/format, order by frequency
- **Covers:** FR52 (view customer order history and purchase patterns)

---

## Epic 7: Inventory Management

**Epic Goal:** Enable publishers to track inventory levels per SKU and location, record print runs with costs, calculate moving average unit cost, perform inventory adjustments, and receive low-stock alerts. This is critical for fulfillment and financial reporting.

**Covers:** FR54-FR62 (Inventory Management)

**Dependencies:** Epic 1 (Foundation), Epic 2 (User & Access - warehouse role), Epic 4 (Title Management - requires formats/SKUs)

---

### Story 7.1: Create Inventory Database Schema

As a **developer**,
I want **to create the inventory and inventory_transactions tables**,
So that **stock levels and all inventory movements can be tracked**.

**Acceptance Criteria:**

**Given** the formats table exists (SKUs defined)
**When** I create the inventory schema in `db/schema/inventory.ts`
**Then** the inventory table has fields for format_id, sku, location_id, quantity, reorder_threshold, moving_average_cost

**And** the inventory_transactions table logs all movements: type (receipt, shipment, adjustment, return), quantity (positive/negative), reason_code, order_id (if applicable), print_run_id (if applicable)
**And** the locations table stores warehouse/storage locations per tenant
**And** both inventory and transactions tables have RLS policies
**And** moving_average_cost is recalculated on each receipt transaction

**Prerequisites:** Story 4.1 (formats schema with SKUs)

**Technical Notes:**
- Schemas: `db/schema/inventory.ts`, `db/schema/inventory-transactions.ts`, `db/schema/locations.ts`
- Unique constraint: (tenant_id, sku, location_id) - one inventory record per SKU per location
- Moving average formula: ((current_quantity * current_avg_cost) + (receipt_quantity * receipt_unit_cost)) / (current_quantity + receipt_quantity)
- Transaction types: 'receipt' | 'shipment' | 'adjustment' | 'return'
- **Covers:** FR54 (track inventory per SKU and location), FR56 (moving average cost), FR58 (transaction history), FR62 (multiple locations)

---

### Story 7.2: Build Print Run Receipt Workflow

As a **Warehouse/Operations user**,
I want **to record print run receipts with quantities, costs, and freight**,
So that **inventory is updated and unit costs are calculated accurately**.

**Acceptance Criteria:**

**Given** the inventory schema exists
**When** I navigate to Inventory > Print Runs and click "Record Print Run"
**Then** I can enter print run details: title/format (SKU), quantity, printer name, printing cost, freight cost, expected delivery date

**And** the system calculates total unit cost (printing + freight) / quantity
**And** upon saving, inventory quantity is increased and moving average cost is recalculated
**And** an inventory transaction is created with type='receipt' and linked to the print run record
**And** I can view a list of all print runs with date, SKU, quantity, and total cost
**And** print runs can be edited before final receipt confirmation

**Prerequisites:** Story 7.1 (inventory schema)

**Technical Notes:**
- Print run page: `app/(dashboard)/inventory/print-runs/page.tsx`
- Print run modal: `components/inventory/PrintRunModal.tsx`
- Server Action: `src/actions/inventory.ts` → `recordPrintRun(data)` wraps inventory update + transaction log in DB transaction
- Moving average calculation: Implement in Server Action as helper function
- Print runs table: `db/schema/print-runs.ts` (optional, or store in inventory_transactions metadata)
- **Covers:** FR55 (record print runs with printer, cost, freight), FR56 (calculate moving average cost)

---

### Story 7.3: Build Inventory Adjustment Workflow

As a **Warehouse/Operations user**,
I want **to perform inventory adjustments for cycle counts, damage, or corrections**,
So that **inventory records match physical stock**.

**Acceptance Criteria:**

**Given** inventory exists
**When** I navigate to Inventory > Adjustments and click "New Adjustment"
**Then** I can select a SKU and location, enter the adjustment quantity (positive or negative), select a reason code (cycle count, damaged, lost, found, correction), and add notes

**And** the inventory quantity is updated immediately
**And** an inventory transaction is created with type='adjustment' and the reason code
**And** I can view an adjustment history log with date, user, SKU, quantity, and reason
**And** adjustments are logged in the audit trail (sensitive operation)

**Prerequisites:** Story 7.2 (print run workflow), Story 2.4 (audit trail)

**Technical Notes:**
- Adjustment page: `app/(dashboard)/inventory/adjustments/page.tsx`
- Adjustment modal: `components/inventory/AdjustmentModal.tsx`
- Server Action: `src/actions/inventory.ts` → `adjustInventory(sku, locationId, quantity, reasonCode, notes)`
- Reason codes: 'cycle_count' | 'damaged' | 'lost' | 'found' | 'correction'
- Audit log: Call `logAuditEvent('inventory_adjustment', 'inventory', inventoryId)` in Server Action
- **Covers:** FR57 (perform inventory adjustments with reason codes)

---

### Story 7.4: Build Inventory List and Status Views

As a **Warehouse/Operations user**,
I want **to view current inventory levels across all SKUs and locations**,
So that **I can see stock status at a glance**.

**Acceptance Criteria:**

**Given** inventory records exist
**When** I navigate to the Inventory section
**Then** I see a table of all inventory records with columns: Title, Format, SKU, Location, Quantity, Reorder Threshold, Status (In Stock/Low Stock/Out of Stock)

**And** I can filter by location, title, or status
**And** I can search by SKU or title name
**And** I can sort by quantity (ascending to see low stock first)
**And** low stock items (quantity <= reorder_threshold) are highlighted in yellow
**And** out-of-stock items (quantity = 0) are highlighted in red
**And** I can click a row to view transaction history for that SKU/location

**Prerequisites:** Story 7.3 (adjustments)

**Technical Notes:**
- Inventory list: `app/(dashboard)/inventory/page.tsx`
- Join query: inventory → formats → titles for display
- Status calculation: `quantity === 0 ? 'out_of_stock' : quantity <= reorder_threshold ? 'low_stock' : 'in_stock'`
- Transaction history: `app/(dashboard)/inventory/[id]/transactions/page.tsx`
- Real-time updates: Ably channel `tenant_{id}_inventory` for quantity changes (from order fulfillment)
- **Covers:** FR54 (track inventory), FR60 (view inventory levels), FR61 (view inventory value)

---

### Story 7.5: Implement Low-Stock Alert System

As a **Publisher/Owner**,
I want **to receive alerts when SKU inventory falls below the reorder threshold**,
So that **I can order new print runs before running out**.

**Acceptance Criteria:**

**Given** inventory exists with reorder thresholds set
**When** inventory quantity falls to or below the reorder threshold
**Then** the Publisher/Owner receives an email alert

**And** a "Low Stock" badge appears on the Inventory page for affected SKUs
**And** the dashboard shows a "Low Stock Alerts" widget listing all low-stock SKUs
**And** alerts are sent once when threshold is crossed (not on every deduction)
**And** the alert includes: SKU, current quantity, reorder threshold, suggested reorder quantity (based on sales velocity - optional enhancement)

**Prerequisites:** Story 7.4 (inventory views)

**Technical Notes:**
- Inngest job: Triggered after inventory deduction in `fulfillOrder()` or `adjustInventory()`
- Check: If new quantity <= reorder_threshold AND previous quantity > reorder_threshold, send alert
- Email template: Include SKU details, current quantity, link to inventory page
- Dashboard widget: `components/dashboard/LowStockAlerts.tsx`
- Store alert status: Add `low_stock_alert_sent` boolean to inventory table
- **Covers:** FR59 (alert users when SKU inventory falls below threshold)

---

## Epic 8: Order Processing

**Epic Goal:** Enable publishers to process customer orders from entry through fulfillment, shipping, and returns. This epic covers manual order entry, Shopify order import, pick/pack workflows, shipping label generation via EasyPost, and returns handling. This is the complete order lifecycle.

**Covers:** FR63-FR85 (Order Management + Fulfillment & Shipping + Returns Management)

**Dependencies:** Epic 1 (Foundation), Epic 4 (Title Management - requires formats/SKUs), Epic 6 (Customer Management), Epic 7 (Inventory Management)

---

### Story 8.1: Create Order Database Schema

As a **developer**,
I want **to create the orders, order_line_items, shipments, and returns tables**,
So that **the complete order lifecycle can be tracked**.

**Acceptance Criteria:**

**Given** the customer and inventory schemas exist
**When** I create the order schemas in `db/schema/`
**Then** the orders table has fields for customer_id, order_number, external_order_id (Shopify), source (manual/shopify), status, subtotal, tax, shipping, total, shipped_at

**And** the order_line_items table has fields for order_id, format_id, sku, quantity, unit_price, discount, line_total (generated column)
**And** the shipments table has fields for order_id, carrier, tracking_number, label_url, shipped_at, delivered_at
**And** the returns table has fields for order_id, reason_code, items (JSONB), credit_amount, status (pending/approved/completed)
**And** all tables have RLS policies for tenant isolation

**Prerequisites:** Story 6.1 (customer schema), Story 7.1 (inventory schema)

**Technical Notes:**
- Schemas: `db/schema/orders.ts`, `order-line-items.ts`, `shipments.ts`, `returns.ts`
- Order status: 'pending' | 'pending_fulfillment' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
- Generated column: `line_total` = `quantity * unit_price * (1 - discount)`
- External order ID: For Shopify sync, nullable for manual orders
- **Covers:** FR63-FR85 (structural foundation for all order functionality)

---

### Story 8.2: Build Manual Order Entry Workflow

As a **Sales & Marketing user**,
I want **to create manual sales orders with customer and line item selection**,
So that **I can process phone/email orders and direct sales**.

**Acceptance Criteria:**

**Given** customers and inventory exist
**When** I navigate to Orders and click "Create Order"
**Then** I can select a customer (autocomplete search by name/email)

**And** I can add line items by selecting SKU (autocomplete with title/format display)
**And** for each line item, the system checks real-time inventory availability and warns if insufficient stock
**And** pricing rules are applied automatically based on customer_pricing (or retail price if no custom pricing)
**And** I can override the automatic price with manual adjustments (requires reason note)
**And** the system calculates subtotal, tax (optional per tenant settings), and displays total
**And** I can calculate shipping via EasyPost integration (address → rates) or enter manual shipping cost
**And** clicking "Create Order" saves the order with status='pending_fulfillment' and generates an order number

**Prerequisites:** Story 8.1 (order schema), Story 6.3 (customer pricing), Story 7.1 (inventory)

**Technical Notes:**
- Order creation page: `app/(dashboard)/orders/new/page.tsx`
- Customer autocomplete: TanStack Query with debounced search
- SKU autocomplete: Join formats → titles, filter by inventory > 0
- Inventory check: Real-time query to inventory table, display available quantity
- Pricing: Call `calculateCustomerPrice()` from lib/pricing.ts
- Server Action: `src/actions/orders.ts` → `createOrder(orderData)` wraps in transaction
- **Covers:** FR63 (create manual orders), FR64 (add line items), FR65 (real-time inventory check), FR66 (apply pricing rules), FR67 (manual price override)

---

### Story 8.3: Integrate Shopify Order Import

As a **Publisher/Owner**,
I want **Shopify orders to automatically import into Salina ERP**,
So that **I don't have to manually re-enter online orders**.

**Acceptance Criteria:**

**Given** the Shopify integration is configured (Epic 9, Story 9.1)
**When** a customer places an order on my Shopify store
**Then** Shopify sends a webhook to `/api/webhooks/shopify` with the order data

**And** the webhook is verified with HMAC signature
**And** an Inngest job is triggered to process the order
**And** the job creates a customer record (if new) and an order with line items
**And** the job checks inventory availability and creates the order with status='pending_fulfillment'
**And** if inventory is insufficient, the job sends an alert and marks order as 'on_hold'
**And** the order's external_order_id is set to the Shopify order ID for sync
**And** I can view Shopify orders in the Orders list with a Shopify icon

**Prerequisites:** Story 8.2 (manual order entry), Story 9.1 (Shopify integration setup)

**Technical Notes:**
- Webhook endpoint: `hono/routes/webhooks/shopify.ts` (Hono POST route)
- Inngest job: `inngest/functions/shopify-webhook.ts` (pattern in Architecture:608-710)
- HMAC verification: `X-Shopify-Hmac-Sha256` header validation
- Transaction steps: Validate → Check inventory → Create customer (if needed) → Create order + line items → Notify warehouse → Confirm to Shopify
- Error handling: Retry 3 times, send failure event if exhausted
- **Covers:** FR68 (import Shopify orders automatically), FR69 (sync order status - partial, completed in Story 8.5)

---

### Story 8.4: Build Pick/Pack/Ship Fulfillment Workflow

As a **Warehouse/Operations user**,
I want **to process daily pick lists and fulfill orders**,
So that **I can ship products to customers efficiently**.

**Acceptance Criteria:**

**Given** orders exist with status='pending_fulfillment'
**When** I navigate to Fulfillment and view today's pick list
**Then** I see all pending orders grouped by order with line items listed (SKU, title, quantity, location)

**And** I can print the pick list for warehouse staff
**And** as I pick items, I can scan barcodes (SKU) to verify correct items
**And** after picking all items for an order, I click "Pack Complete"
**And** I can generate a shipping label via EasyPost integration (address → carrier selection → label PDF)
**And** the label includes tracking number
**And** I click "Mark Shipped" and enter the tracking number
**And** the order status updates to 'shipped', inventory is deducted, and the customer receives a shipping confirmation email

**Prerequisites:** Story 8.2 (orders exist), Story 9.2 (EasyPost integration)

**Technical Notes:**
- Fulfillment page: `app/(dashboard)/fulfillment/page.tsx`
- Pick list component: `components/orders/PickList.tsx` (printable view)
- Barcode scanning: Use `<input>` with autofocus, validate SKU on enter
- Server Action: `src/actions/fulfillment.ts` → `fulfillOrder(orderId, trackingNumber)`
- Transaction: Update order status → Deduct inventory → Create shipment record → Create inventory transactions
- Ably publish: Notify other clients of inventory change (pattern in Architecture:719-857)
- **Covers:** FR73 (view pick lists), FR74 (barcode scanning), FR77 (mark shipped with tracking), FR78 (deduct inventory on shipment), FR79 (shipping confirmation email)

---

### Story 8.5: Integrate EasyPost Shipping

As a **Warehouse/Operations user**,
I want **to calculate shipping rates and generate labels via EasyPost**,
So that **I can ship orders with accurate costs and tracking**.

**Acceptance Criteria:**

**Given** the EasyPost integration is configured (Epic 9, Story 9.2)
**When** I am fulfilling an order and click "Calculate Shipping"
**Then** the system calls EasyPost with the customer's shipping address and package dimensions

**And** EasyPost returns available carrier options (USPS, UPS, FedEx) with rates
**And** I can select a carrier and service level (e.g., USPS Priority Mail)
**And** I click "Generate Label" and the system creates a shipment in EasyPost
**And** the label PDF is returned and stored in S3 (or displayed for immediate printing)
**And** the tracking number is captured and associated with the order
**And** the system periodically (hourly) fetches tracking updates from EasyPost and updates shipment status

**Prerequisites:** Story 8.4 (fulfillment workflow), Story 9.2 (EasyPost integration)

**Technical Notes:**
- EasyPost SDK: Call `/rates` endpoint with address + package details
- Display rates: `components/orders/ShippingRateSelector.tsx`
- Generate label: Call `/shipments` endpoint, get label_url and tracking_code
- Store label: Upload PDF to S3 or store EasyPost URL in shipments table
- Tracking updates: Inngest scheduled job `inngest/functions/easypost-tracking.ts` runs hourly
- **Covers:** FR75 (generate shipping labels), FR76 (calculate shipping rates), FR80 (view shipment status and tracking)

---

### Story 8.6: Build Order List and Detail Views

As a **Sales & Marketing user**,
I want **to view all orders with filtering, searching, and status tracking**,
So that **I can monitor the order pipeline**.

**Acceptance Criteria:**

**Given** orders exist
**When** I navigate to the Orders section
**Then** I see a table of all orders with columns: Order Number, Customer, Date, Status, Total, Source (manual/Shopify), Actions

**And** I can search by order number, customer name, or SKU
**And** I can filter by status (pending, pending_fulfillment, shipped, delivered, cancelled, returned) and source
**And** I can sort by date, total, or status
**And** clicking an order opens the Order Detail page showing customer info, line items, shipment details, and timeline
**And** I can edit orders before fulfillment (add/remove items, change quantities)
**And** I cannot edit orders after shipment (status = 'shipped')

**Prerequisites:** Story 8.2 (orders exist)

**Technical Notes:**
- Order list: `app/(dashboard)/orders/page.tsx`
- Order detail: `app/(dashboard)/orders/[id]/page.tsx`
- Edit order: Only if status === 'pending' | 'pending_fulfillment'
- Server Action: `updateOrder()` with validation for status check
- Timeline: Display status changes with timestamps (created → pending_fulfillment → shipped → delivered)
- **Covers:** FR70 (view order pipeline), FR71 (edit orders before fulfillment), FR72 (prevent editing after shipment)

---

### Story 8.7: Build Returns Management Workflow

As a **Sales & Marketing user**,
I want **to process customer returns with credit memos**,
So that **I can handle returns and adjust inventory**.

**Acceptance Criteria:**

**Given** shipped orders exist
**When** a customer requests a return and I navigate to the order and click "Process Return"
**Then** I can select which line items are being returned and the quantity

**And** I can enter a reason code (damaged, wrong item, customer changed mind, defective)
**And** the system calculates the credit amount based on the original line item prices
**And** I can choose to: (1) add returned items back to inventory, or (2) mark as damaged (no inventory adjustment)
**And** upon confirming the return, a credit memo is created and linked to the order
**And** if items are returned to inventory, inventory quantity is increased and a transaction is logged
**And** I can apply the credit to the customer's account or issue a refund

**Prerequisites:** Story 8.6 (order details), Story 7.3 (inventory adjustments)

**Technical Notes:**
- Returns modal: `components/orders/ReturnModal.tsx`
- Server Action: `src/actions/returns.ts` → `processReturn(orderId, items, reasonCode, addToInventory)`
- Transaction: Create return record → Create credit_memo → Adjust inventory (if applicable) → Log inventory transaction
- Credit application: Store in `customer_credits` table or integrate with accounting export
- Return history: Display in Order Detail page and Customer profile
- **Covers:** FR81 (record returns with reason codes), FR82 (create credit memo), FR83 (adjust inventory), FR84 (apply credit or refund), FR85 (view returns history)

---

## Epic 9: Integration Ecosystem

**Epic Goal:** Enable publishers to connect Salina ERP with external services (Shopify, QuickBooks, EasyPost) for automated order import, accounting exports, and shipping operations. This epic delivers the integration configuration interfaces, webhook handling, and background job processing for seamless data sync.

**Covers:** FR86-FR99 (Integrations)

**Dependencies:** Epic 1 (Foundation - Inngest, Hono), Epic 2 (User & Access), Epic 7 (Inventory), Epic 8 (Orders)

---

### Story 9.1: Build Shopify Integration Configuration

As a **Publisher/Owner**,
I want **to configure Shopify integration with my store's API credentials**,
So that **orders can import automatically**.

**Acceptance Criteria:**

**Given** I am logged in as Publisher/Owner
**When** I navigate to Settings > Integrations > Shopify
**Then** I can click "Connect Shopify" and am redirected to Shopify OAuth flow

**And** I authorize the Salina ERP app on my Shopify store
**And** the OAuth tokens (access token, refresh token) are stored encrypted in the database
**And** I can configure: (1) order import frequency (real-time webhook or hourly batch), (2) inventory sync settings (enable/disable, sync frequency)
**And** I can view integration status: Connected, Last Sync, Webhook Status (healthy/errors)
**And** I can disconnect the integration (revokes tokens and disables sync)
**And** I can view integration logs (last 100 events with success/failure status)

**Prerequisites:** Story 1.5 (tenant settings), Story 2.4 (audit trail for credential changes)

**Technical Notes:**
- Integration config page: `app/(dashboard)/settings/integrations/shopify/page.tsx`
- OAuth flow: `app/api/integrations/shopify/callback/route.ts` (Hono route)
- Credentials table: `db/schema/integration-configs.ts` with encrypted credentials (pgcrypto)
- Webhook registration: After OAuth, register `/webhooks/shopify` endpoint with Shopify
- Server Actions: `src/actions/integrations.ts` → `connectShopify()`, `disconnectShopify()`
- Integration logs table: `db/schema/integration-logs.ts` (last 100 events per tenant per integration)
- **Covers:** FR86 (configure Shopify integration), FR87 (import orders - setup), FR88 (sync inventory - setup), FR89 (monitor integration health)

---

### Story 9.2: Build EasyPost Integration Configuration

As a **Publisher/Owner**,
I want **to configure EasyPost integration with my API key**,
So that **I can calculate shipping rates and generate labels**.

**Acceptance Criteria:**

**Given** I am logged in as Publisher/Owner
**When** I navigate to Settings > Integrations > EasyPost
**Then** I can enter my EasyPost API key (or click "Get API Key" link to EasyPost)

**And** the system validates the API key by calling EasyPost /v2/api_keys endpoint
**And** if valid, the API key is stored encrypted in the database
**And** I can configure: (1) default warehouse address (from address for shipments), (2) preferred carriers (USPS, UPS, FedEx)
**And** I can test the integration by generating a sample rate quote
**And** I can view integration status and logs (last 100 API calls)
**And** I can rotate the API key (update with new key)

**Prerequisites:** Story 9.1 (integration config pattern)

**Technical Notes:**
- Integration config page: `app/(dashboard)/settings/integrations/easypost/page.tsx`
- API key validation: Call EasyPost SDK `easypost.apiKeys.retrieve()` to verify
- Store API key: Encrypted in `integration_configs` table
- Test integration: Call EasyPost `/rates` with dummy shipment data
- Server Actions: `src/actions/integrations.ts` → `connectEasyPost()`, `testEasyPost()`, `updateEasyPostKey()`
- **Covers:** FR94 (configure EasyPost integration), FR95-FR97 (setup for rate calculation, label generation, tracking)

---

### Story 9.3: Build QuickBooks Export Configuration

As a **Accounting user**,
I want **to configure QuickBooks export settings and account mappings**,
So that **I can export sales, COGS, and inventory data to QuickBooks**.

**Acceptance Criteria:**

**Given** I am logged in with Accounting role
**When** I navigate to Settings > Integrations > QuickBooks
**Then** I can select QuickBooks version (Desktop = IIF format, Online = CSV format)

**And** I can configure export schedule (daily, weekly, manual only)
**And** I can map Salina accounts to QuickBooks chart of accounts:
  - Sales Revenue → QB Income Account
  - COGS → QB COGS Account
  - Inventory Asset → QB Asset Account
  - Shipping Revenue → QB Income Account
**And** I can configure export scope (sales only, sales + COGS, sales + COGS + inventory adjustments)
**And** I can click "Generate Export Now" to create an export file immediately
**And** the export file is generated, uploaded to S3, and a download link is provided
**And** I receive an email with the export file link

**Prerequisites:** Story 9.1 (integration config pattern), Story 8.1 (orders exist for export)

**Technical Notes:**
- Integration config page: `app/(dashboard)/settings/integrations/quickbooks/page.tsx`
- Account mapping: `db/schema/account-mappings.ts` (Salina account type → QB account name)
- Export generation: Inngest job `inngest/functions/quickbooks-export.ts` (scheduled or manual trigger)
- Export formats: IIF for QB Desktop (fixed-width text), CSV for QB Online
- Export includes: Sales invoices (from orders), COGS journal entries (from shipments), inventory adjustments
- Store exports: S3 with 90-day retention, track in `accounting_exports` table
- **Covers:** FR90 (configure QuickBooks integration), FR91 (generate export files), FR92 (map accounts), FR93 (export on schedule)

---

### Story 9.4: Implement Shopify Inventory Sync

As a **Publisher/Owner**,
I want **inventory levels to sync automatically from Salina ERP to Shopify**,
So that **my online store never oversells out-of-stock items**.

**Acceptance Criteria:**

**Given** Shopify integration is configured with inventory sync enabled
**When** inventory quantity changes in Salina ERP (print run receipt, order fulfillment, adjustment)
**Then** an Inngest job is triggered to sync the inventory level to Shopify

**And** the job calls Shopify Inventory API with the new quantity for the matching SKU
**And** if the API call succeeds, the integration log records success
**And** if the API call fails (rate limit, network error), the job retries up to 3 times
**And** if all retries fail, the Publisher/Owner receives an error notification
**And** I can view sync status for each SKU in the Inventory page (last synced timestamp, sync status)

**Prerequisites:** Story 9.1 (Shopify integration), Story 7.2 (inventory changes)

**Technical Notes:**
- Inngest job: `inngest/functions/shopify-inventory-sync.ts`
- Trigger: After inventory update in `recordPrintRun()`, `adjustInventory()`, `fulfillOrder()`
- Shopify API: PUT `/admin/api/2024-01/inventory_levels/set.json` with location_id and available quantity
- Rate limiting: Use Bottleneck library to respect Shopify's 2 req/sec limit (Architecture:400)
- Error handling: Retry with exponential backoff, send failure event to Inngest
- **Covers:** FR88 (sync inventory levels to Shopify), FR89 (monitor integration health)

---

### Story 9.5: Implement Integration Health Monitoring

As a **Publisher/Owner**,
I want **to receive notifications when integrations fail or degrade**,
So that **I can address issues before they impact operations**.

**Acceptance Criteria:**

**Given** integrations are configured and active
**When** an integration experiences errors (API failures, webhook delivery failures, rate limit errors)
**Then** the integration status changes from "Healthy" to "Degraded" or "Failing"

**And** the Publisher/Owner receives an email notification with error details
**And** the Settings > Integrations dashboard shows a status indicator (green/yellow/red) for each integration
**And** I can click an integration to view the error log (last 100 events)
**And** I can click "Test Connection" to verify the integration manually
**And** I can click "Retry Failed Jobs" to manually re-trigger failed Inngest jobs

**Prerequisites:** Story 9.1 (Shopify), Story 9.2 (EasyPost), Story 9.3 (QuickBooks)

**Technical Notes:**
- Integration health: Calculated from `integration_logs` table (% success in last 24 hours)
- Status thresholds: 95%+ = Healthy, 80-95% = Degraded, <80% = Failing
- Notification: Inngest job monitors integration_logs, sends alert if threshold crossed
- Dashboard: `app/(dashboard)/settings/integrations/page.tsx` with status cards
- Test connection: Call each integration's health check endpoint (Shopify /admin/shop.json, EasyPost /api_keys, etc.)
- **Covers:** FR89 (integration health monitoring and error notifications), FR98 (secure credential storage - implemented in Stories 9.1-9.3)

---

### Story 9.6: Implement Webhook Security and Rate Limiting

As a **developer**,
I want **to secure webhook endpoints with signature verification and rate limiting**,
So that **the system is protected from unauthorized requests and abuse**.

**Acceptance Criteria:**

**Given** webhook endpoints exist for Shopify and EasyPost
**When** a webhook request is received
**Then** the signature header (X-Shopify-Hmac-Sha256, X-EasyPost-Signature) is verified against the stored secret

**And** if signature verification fails, the request is rejected with 401 Unauthorized
**And** if rate limit is exceeded (100 requests per minute per tenant/IP), the request is rejected with 429 Too Many Requests
**And** if the webhook payload fails validation (missing required fields), the request is rejected with 400 Bad Request
**And** successful webhook events are logged to integration_logs table
**And** failed webhook events are logged with error details for debugging

**Prerequisites:** Story 9.1 (Shopify webhooks), Story 9.2 (EasyPost webhooks)

**Technical Notes:**
- Hono middleware: `hono/middleware/webhook-auth.ts` (signature verification)
- Rate limiting: Upstash Redis with sliding window (Architecture:431-440)
- Signature verification: HMAC-SHA256 for Shopify, EasyPost signature algorithm
- Validation: Zod schemas in `validators/webhooks.ts`
- Error logging: Pino structured logs + Sentry for webhook failures
- **Covers:** FR98 (secure credential storage), FR99 (OAuth flows - Shopify), general webhook security

---

## Epic 10: Dashboards & Reporting

**Epic Goal:** Enable publishers to view business insights through KPI dashboards, sales reports, inventory reports, and guided onboarding. This epic also includes data import tools for migrating from legacy systems.

**Covers:** FR100-FR114 (Dashboards & Reporting + System Administration)

**Dependencies:** Epic 1 (Foundation), Epic 4 (Titles), Epic 7 (Inventory), Epic 8 (Orders)

---

### Story 10.1: Build Publisher/Owner Dashboard

As a **Publisher/Owner**,
I want **to see key business metrics at a glance**,
So that **I can monitor business health without digging through reports**.

**Acceptance Criteria:**

**Given** I am logged in as Publisher/Owner
**When** I navigate to the Dashboard (home page)
**Then** I see KPI widgets: Sales today/this week/this month, Pending orders, Low stock alerts, Upcoming production milestones (Epic 12)

**And** I see a sales trend chart (last 30 days, grouped by day) with revenue
**And** I see a top titles widget (best-selling titles this month by revenue and units)
**And** I see a recent activity feed (recent orders, title creations, inventory adjustments)
**And** I see quick actions: Create Title, Enter Order, View Reports
**And** the dashboard refreshes automatically every 5 minutes (or via Ably real-time updates)

**Prerequisites:** Story 8.1 (orders exist), Story 7.1 (inventory exists), Story 4.1 (titles exist)

**Technical Notes:**
- Dashboard: `app/(dashboard)/page.tsx` (Server Component with real-time updates)
- KPI widgets: `components/dashboard/KPICard.tsx`, `components/dashboard/SalesTrendChart.tsx` (using Recharts)
- Queries: Aggregate queries with date filters (SUM, COUNT, GROUP BY)
- Real-time: Ably channel `tenant_{id}_dashboard` receives updates on order creation, inventory changes
- Caching: TanStack Query with 1-min stale time for dashboard data
- **Covers:** FR100 (dashboard with key metrics), FR105 (recent activity feed), FR106 (quick actions)

---

### Story 10.2: Build Sales Reports

As a **Sales & Marketing user**,
I want **to view sales reports by title, channel, customer type, and date range**,
So that **I can analyze sales performance**.

**Acceptance Criteria:**

**Given** orders exist
**When** I navigate to Reports > Sales
**Then** I can select a date range (this week, this month, this year, custom)

**And** I can group by: Title, Format, Customer Type, Sales Channel (manual/Shopify), or Customer
**And** the report displays: Total Revenue, Units Sold, Average Order Value, Number of Orders
**And** I can view a breakdown table with drill-down capability (e.g., click title to see format breakdown)
**And** I can export the report to CSV
**And** I see a chart visualization (bar chart or line chart) of sales over time

**Prerequisites:** Story 8.1 (orders exist)

**Technical Notes:**
- Sales report page: `app/(dashboard)/reports/sales/page.tsx`
- Query: Join orders → order_line_items → formats → titles → customers with GROUP BY
- Filters: Date range picker, multi-select for grouping dimensions
- CSV export: Server Action generates CSV file, returns download URL
- Charts: Recharts bar chart or line chart with responsive design
- **Covers:** FR101 (sales reports by title, channel, customer type, date range)

---

### Story 10.3: Build Inventory Reports

As a **Warehouse/Operations user**,
I want **to view inventory status reports with stock levels and locations**,
So that **I can make informed restocking decisions**.

**Acceptance Criteria:**

**Given** inventory exists
**When** I navigate to Reports > Inventory
**Then** I see a report showing all SKUs with: Current Quantity, Location, Reorder Threshold, Status (In Stock/Low Stock/Out of Stock), Moving Average Cost, Total Value

**And** I can filter by location, status, or title
**And** I can sort by quantity, value, or title
**And** I can export the report to CSV
**And** I see summary metrics: Total inventory value, Number of SKUs, Low stock count, Out of stock count

**Prerequisites:** Story 7.1 (inventory exists)

**Technical Notes:**
- Inventory report page: `app/(dashboard)/reports/inventory/page.tsx`
- Query: Join inventory → formats → titles with calculations for value (quantity * moving_average_cost)
- Summary metrics: Aggregate queries (SUM, COUNT with WHERE clauses)
- CSV export: Include all columns with headers
- **Covers:** FR102 (inventory status reports with stock levels and locations)

---

### Story 10.4: Build Customer Purchase Reports

As a **Sales & Marketing user**,
I want **to view reports on customer purchase patterns**,
So that **I can identify top customers and trends**.

**Acceptance Criteria:**

**Given** customers and orders exist
**When** I navigate to Reports > Customers
**Then** I see a report showing: Customer Name, Type, Total Orders, Total Revenue, Average Order Value, Last Order Date, Favorite Titles (most frequently ordered)

**And** I can filter by customer type (retail, wholesale, educational, consumer) and date range
**And** I can sort by revenue, order count, or last order date
**And** I can click a customer to view detailed purchase history
**And** I can export the report to CSV

**Prerequisites:** Story 8.1 (orders exist), Story 6.1 (customers exist)

**Technical Notes:**
- Customer report page: `app/(dashboard)/reports/customers/page.tsx`
- Query: Join customers → orders → order_line_items → formats → titles with GROUP BY customer
- Favorite titles: Subquery to find most frequently ordered titles per customer (COUNT, ORDER BY)
- CSV export: Generate with all visible columns
- **Covers:** FR103 (customer purchase reports)

---

### Story 10.5: Build Guided Onboarding Wizard

As a **new Publisher/Owner**,
I want **to be guided through initial setup with a checklist**,
So that **I get started quickly without missing important configuration**.

**Acceptance Criteria:**

**Given** I am a new tenant (just signed up)
**When** I first log in
**Then** I see an onboarding wizard overlay with a progress checklist

**Checklist steps:**
1. Configure company info and branding (Settings > Company)
2. Add your first ISBN block (Settings > ISBN Blocks)
3. Invite team members (Settings > Users)
4. Create your first title (Titles > Create Title)
5. Connect integrations (Settings > Integrations - optional)

**And** I can check off completed steps manually or they auto-complete when the action is performed
**And** I can dismiss the wizard and access it later from Settings > Onboarding
**And** when all steps are complete, I see a congratulatory message and the wizard is marked as complete

**Prerequisites:** Story 1.5 (tenant settings), Story 3.2 (ISBN blocks), Story 2.1 (user invites), Story 4.2 (title creation)

**Technical Notes:**
- Onboarding wizard: `components/onboarding/OnboardingWizard.tsx` (modal overlay)
- Progress tracking: `tenant_onboarding` table with completed_steps JSONB field
- Auto-completion: Trigger step completion in relevant Server Actions (e.g., `createISBNBlock()` marks step 2 complete)
- Dismissible: Store dismissed status in tenant_onboarding table
- **Covers:** FR108 (guided onboarding wizard for new tenants)

---

### Story 10.6: Build CSV Data Import Tools

As a **Publisher/Owner**,
I want **to import titles, customers, and inventory from CSV files**,
So that **I can migrate data from my legacy spreadsheets and systems**.

**Acceptance Criteria:**

**Given** I have existing data in CSV files
**When** I navigate to Settings > Data Import
**Then** I can select import type (Titles, Customers, Inventory)

**And** I can download a CSV template with required columns and formatting instructions
**And** I can upload my CSV file (max 10MB, max 10,000 rows)
**And** the system validates the CSV format, checks for required fields, and previews the first 10 rows
**And** I can map CSV columns to Salina ERP fields (if column names don't match exactly)
**And** I click "Import" and the system processes the CSV in a background job (Inngest)
**And** I receive a summary email when import completes: X rows succeeded, Y rows failed (with error details)
**And** failed rows are exported to a CSV file for correction and re-import

**Prerequisites:** Story 4.1 (title schema), Story 6.1 (customer schema), Story 7.1 (inventory schema)

**Technical Notes:**
- Import page: `app/(dashboard)/settings/data-import/page.tsx`
- CSV parsing: Use `csv-parser` or `papaparse` library
- Validation: Zod schemas for each import type (title, customer, inventory)
- Background job: `inngest/functions/csv-import.ts` (handles large files, avoids timeout)
- Error handling: Collect validation errors, generate error CSV with row numbers and error messages
- **Covers:** FR110 (import titles from CSV), FR111 (import customers from CSV), FR112 (import inventory from CSV)

---

### Story 10.7: Implement System Administration Features

As a **Publisher/Owner**,
I want **to configure company information, view usage statistics, and access contextual help**,
So that **I can manage my tenant effectively**.

**Acceptance Criteria:**

**Given** I am logged in as Publisher/Owner
**When** I navigate to Settings > Company
**Then** I can configure: Company name, Address, Phone, Email, Website, Logo, Timezone, Locale, Default currency, Measurement units

**And** I can navigate to Settings > Usage to view: Number of titles, Number of users, Number of orders (this month), Storage used (MB), API calls (this month)
**And** I can navigate to Settings > Help to access: Contextual help articles, Video tutorials, Contact support
**And** help articles are context-aware (e.g., on Title page, show "How to create titles" article)
**And** I can submit a support request with description and screenshots

**Prerequisites:** Story 1.5 (tenant settings)

**Technical Notes:**
- Company settings: `app/(dashboard)/settings/company/page.tsx` (update tenant record)
- Usage statistics: `app/(dashboard)/settings/usage/page.tsx` (aggregate queries)
- Help system: Embed help widget (e.g., Intercom, HelpScout) or static markdown docs
- Context-aware help: Detect current route, show relevant help article
- Support request: Email notification to support email or integrate with ticketing system
- **Covers:** FR107 (configure company information), FR109 (contextual help and documentation), FR114 (view system usage statistics)

---

## Epic 11: Contracts & Royalties (Growth - Post-MVP)

**Epic Goal:** Enable publishers to manage contributor contracts, define royalty rules per format and channel, track advances and recoupment, automatically calculate royalties based on sales and returns, and generate royalty statements. This automates a complex, error-prone manual process.

**Covers:** FR115-FR125 (Contracts & Royalties)

**Dependencies:** Epic 1 (Foundation), Epic 5 (Contributor Management), Epic 8 (Order Processing - requires sales data)

---

### Story 11.1: Create Contract and Royalty Database Schema

As a **developer**,
I want **to create the contracts, royalty_rules, and royalty_statements tables**,
So that **contributor contracts and royalty calculations can be tracked**.

**Acceptance Criteria:**

**Given** the contributor schema exists
**When** I create the contract schemas in `db/schema/`
**Then** the contracts table has fields for contributor_id, title_id, contract_type (author/illustrator agreement), start_date, end_date, advance_amount, advance_paid_date, recoupment_status

**And** the royalty_rules table defines rules per contract: format_type (hardcover/paperback/ebook/all), sales_channel (direct/shopify/amazon/wholesale/all), royalty_type (percentage/flat_rate/sliding_scale), royalty_value, min_units_sold (for sliding scale)
**And** the royalty_statements table stores generated statements: contract_id, statement_period (start_date, end_date), total_units_sold, total_sales_revenue, royalty_earned, advance_recoupment_deduction, net_royalty_payable, pdf_url, generated_at
**And** all tables have RLS policies for tenant isolation

**Prerequisites:** Story 5.1 (contributor schema), Story 8.1 (orders for sales data)

**Technical Notes:**
- Schemas: `db/schema/contracts.ts`, `royalty-rules.ts`, `royalty-statements.ts`
- Sliding scale: Multiple rules per contract with min_units_sold thresholds (0-1000 = 10%, 1001-5000 = 12%, 5001+ = 15%)
- Recoupment status: 'not_started' | 'in_progress' | 'recouped'
- **Covers:** FR115 (create contract records), FR116 (define royalty rules), FR117 (royalty rates by format and channel)

---

### Story 11.2: Build Contract Management Interface

As a **Accounting user**,
I want **to create and manage contributor contracts with royalty terms**,
So that **royalty calculations are based on accurate contract data**.

**Acceptance Criteria:**

**Given** contributors exist
**When** I navigate to Contracts and click "Create Contract"
**Then** I can select a contributor and title, enter contract details (start date, end date, advance amount, advance paid date)

**And** I can add royalty rules: Select format type, sales channel, royalty type (percentage/flat/sliding scale), and value
**And** for sliding scale, I can add multiple tiers with unit thresholds (e.g., 0-1000 units = 10%, 1001+ = 12%)
**And** I can view a list of all contracts with search by contributor or title
**And** clicking a contract shows full details, royalty rules, and payment history
**And** I can edit contract details and royalty rules (with audit trail logging)

**Prerequisites:** Story 11.1 (contract schema)

**Technical Notes:**
- Contract list: `app/(dashboard)/contracts/page.tsx`
- Contract detail: `app/(dashboard)/contracts/[id]/page.tsx`
- Contract modal: `components/contracts/ContractModal.tsx`
- Royalty rules component: `components/contracts/RoyaltyRulesEditor.tsx` (dynamic form for adding multiple rules)
- Server Actions: `src/actions/contracts.ts` → `createContract()`, `updateContract()`, `addRoyaltyRule()`
- Audit trail: Log contract creation/edits as sensitive operations
- **Covers:** FR115 (create contracts), FR116 (define royalty rules), FR117 (rates by format/channel), FR118 (record advances)

---

### Story 11.3: Implement Royalty Calculation Engine

As a **developer**,
I want **to build the royalty calculation engine that processes sales and returns**,
So that **royalties are calculated accurately based on contract rules**.

**Acceptance Criteria:**

**Given** contracts with royalty rules exist and sales data exists
**When** the royalty calculation job runs (monthly or on-demand)
**Then** for each contract, the system retrieves all sales and returns for the contract's title/formats in the statement period

**And** the system applies the appropriate royalty rule based on format_type and sales_channel
**And** for sliding scale rules, the system determines which tier applies based on cumulative units sold
**And** the system calculates gross royalty: SUM(units_sold * unit_price * royalty_percentage) OR SUM(units_sold * flat_rate)
**And** the system deducts advance recoupment: IF advance_amount > 0 AND recoupment_status != 'recouped', THEN net_royalty = gross_royalty - remaining_advance
**And** the system updates recoupment_status to 'recouped' when gross_royalty >= advance_amount
**And** the calculation results are stored in a royalty_calculations table for review before statement generation

**Prerequisites:** Story 11.2 (contracts exist), Story 8.1 (sales data)

**Technical Notes:**
- Calculation job: `inngest/functions/calculate-royalties.ts` (triggered monthly or manually)
- Query: Join orders → order_line_items → formats → title_contributors → contracts → royalty_rules
- Filter: Only orders with status='shipped' or 'delivered' (not 'cancelled')
- Returns handling: Deduct returned units from units_sold
- Sliding scale: ORDER BY min_units_sold DESC, take first matching rule
- Advance recoupment: Track cumulative_royalty_paid in contract record
- **Covers:** FR119 (calculate royalties based on sales and returns), FR120 (account for advance recoupment)

---

### Story 11.4: Build Royalty Statement Generation

As a **Accounting user**,
I want **to generate royalty statements as PDF reports**,
So that **contributors can review their earnings**.

**Acceptance Criteria:**

**Given** royalty calculations exist for a period
**When** I navigate to Royalties > Statements and click "Generate Statements"
**Then** I can select the statement period (e.g., Q1 2025, January 2025, custom date range)

**And** the system generates a PDF statement for each contract with royalty activity
**And** the statement includes: Contributor name/address, Contract details, Statement period, Sales summary (units sold by format, sales revenue), Royalty calculation (rate, gross royalty), Advance recoupment (if applicable), Net royalty payable, Payment instructions
**And** the PDF is stored in S3 and the URL is saved to royalty_statements table
**And** I can preview the PDF before finalizing
**And** I can click "Finalize & Send" to mark statements as finalized and email them to contributors

**Prerequisites:** Story 11.3 (royalty calculations)

**Technical Notes:**
- Statement generation page: `app/(dashboard)/royalties/statements/page.tsx`
- PDF generation: Use `@react-pdf/renderer` or `puppeteer` to generate PDFs
- Template: Professional royalty statement template with tenant branding
- Email: Inngest job to send emails with PDF attachment to contributors
- Storage: S3 with long-term retention (7+ years for accounting compliance)
- **Covers:** FR121 (generate royalty statements in PDF format), FR122 (contributors can view statements - partial, completed in Story 11.5)

---

### Story 11.5: Build Contributor Royalty Self-Service

As an **Author or Illustrator**,
I want **to view and download my royalty statements online**,
So that **I can track my earnings without waiting for emails**.

**Acceptance Criteria:**

**Given** I am a contributor with a contract and royalty statements
**When** I log in with Author or Illustrator role
**Then** I see a Royalty Statements section in my dashboard

**And** I can view a list of all my royalty statements with period, net royalty payable, and status (draft/finalized/paid)
**And** I can click a statement to view details (sales summary, royalty calculation)
**And** I can download the PDF statement
**And** I can view historical statements (all past periods)
**And** I cannot see statements for other contributors

**Prerequisites:** Story 11.4 (statement generation), Story 5.4 (contributor portal)

**Technical Notes:**
- Royalty dashboard: `app/(dashboard)/royalties/page.tsx` (role-based rendering)
- Permission check: Filter royalty_statements by contracts where contributor_id = current user's contributor record
- PDF download: Presigned S3 URL with 1-hour expiry
- Historical view: Display all statements ordered by period DESC
- **Covers:** FR122 (contributors view royalty statements online), FR123 (download historical statements)

---

### Story 11.6: Build Royalty Payment Export

As an **Accounting user**,
I want **to export royalty payment summaries for processing**,
So that **I can pay contributors via check, ACH, or PayPal**.

**Acceptance Criteria:**

**Given** royalty statements are finalized
**When** I navigate to Royalties > Payments and select a statement period
**Then** I see a list of all contributors with net royalty payable amounts

**And** I can export a CSV file with: Contributor name, Payment method (from contributor record), Net royalty payable, Contract ID, Statement ID
**And** I can mark payments as "Paid" and enter payment date
**And** the system creates an accounting entry for royalty expenses
**And** the QuickBooks export includes royalty payables as journal entries

**Prerequisites:** Story 11.4 (statements), Story 9.3 (QuickBooks export)

**Technical Notes:**
- Payment page: `app/(dashboard)/royalties/payments/page.tsx`
- CSV export: Include payment method, address, tax ID (if applicable)
- Mark paid: Update royalty_statements.payment_status and payment_date
- Accounting entry: Insert into accounting_transactions table (for QuickBooks export)
- Journal entry format: Debit Royalty Expense, Credit Accounts Payable
- **Covers:** FR124 (export royalty payment summaries for accounting), FR125 (create accounting entries for royalty expenses and payables)

---

## Epic 12: Production & Scheduling (Growth - Post-MVP)

**Epic Goal:** Enable publishers to manage editorial and production workflows with production projects, milestones, task assignments, Gantt and Kanban views, cost tracking, and file version management. This helps publishers deliver titles on schedule and budget.

**Covers:** FR126-FR134 (Production & Scheduling)

**Dependencies:** Epic 1 (Foundation), Epic 2 (User & Access - production roles), Epic 4 (Title Management)

---

### Story 12.1: Create Production Database Schema

As a **developer**,
I want **to create the production_projects, production_tasks, and file_versions tables**,
So that **production workflows can be tracked**.

**Acceptance Criteria:**

**Given** the title schema exists
**When** I create the production schemas in `db/schema/`
**Then** the production_projects table has fields for title_id, status (planning/in_progress/completed/on_hold), target_publication_date, actual_publication_date, total_cost_budget, actual_cost

**And** the production_tasks table has fields for project_id, milestone (editorial/design/proofing/final_files), task_name, assigned_to_user_id, due_date, completed_at, cost, notes
**And** the file_versions table has fields for project_id, file_type (manuscript/cover/interior), version_number, file_url (S3), uploaded_by_user_id, uploaded_at, notes
**And** all tables have RLS policies for tenant isolation

**Prerequisites:** Story 4.1 (title schema), Story 2.1 (user management)

**Technical Notes:**
- Schemas: `db/schema/production-projects.ts`, `production-tasks.ts`, `file-versions.ts`
- Milestones: Predefined list (editorial, design, proofing, final_files) or custom per project
- Cost tracking: Task costs aggregate to project actual_cost
- **Covers:** FR126 (create production projects), FR127 (define milestones), FR131 (track production costs)

---

### Story 12.2: Build Production Project Management Interface

As a **Managing Editor**,
I want **to create production projects and assign tasks to team members**,
So that **titles move through the production process on schedule**.

**Acceptance Criteria:**

**Given** titles exist
**When** I navigate to Production and click "Create Project"
**Then** I can select a title, set target publication date, and define production budget

**And** I can add milestones (editorial, design, proofing, final files) with due dates
**And** for each milestone, I can add tasks with: Task name, Assigned to (user dropdown), Due date, Estimated cost
**And** I can view a list of all production projects with status and progress indicators
**And** clicking a project shows full details, task list, and timeline
**And** I can edit tasks (reassign, change due date, mark complete)
**And** I can upload file versions (manuscript, cover, interior) to the project

**Prerequisites:** Story 12.1 (production schema)

**Technical Notes:**
- Production list: `app/(dashboard)/production/page.tsx`
- Production detail: `app/(dashboard)/production/[id]/page.tsx`
- Project modal: `components/production/ProductionProjectModal.tsx`
- Task list component: `components/production/TaskList.tsx` (with inline editing)
- File upload: Presigned S3 POST for file uploads, store URL in file_versions
- **Covers:** FR126 (create projects), FR127 (define milestones), FR128 (assign tasks with due dates), FR132 (upload file versions)

---

### Story 12.3: Build Gantt Chart View

As a **Managing Editor**,
I want **to view production timelines in a Gantt chart**,
So that **I can see task dependencies and identify schedule conflicts**.

**Acceptance Criteria:**

**Given** production projects with tasks exist
**When** I navigate to Production and select "Gantt View"
**Then** I see a Gantt chart showing all tasks on a timeline (x-axis = dates, y-axis = tasks)

**And** tasks are color-coded by milestone (editorial = blue, design = green, proofing = yellow, final files = orange)
**And** I can see task dependencies (arrows between tasks, e.g., "Design" depends on "Editorial complete")
**And** I can drag tasks to adjust due dates
**And** overdue tasks are highlighted in red
**And** I can filter by project, assigned user, or milestone

**Prerequisites:** Story 12.2 (projects and tasks exist)

**Technical Notes:**
- Gantt component: Use `react-gantt-chart` or `frappe-gantt` library
- Data format: Convert production_tasks to Gantt data structure (task name, start date, end date, dependencies)
- Drag-to-update: Update task due_date on drag event, call Server Action
- Dependencies: Store in task record (depends_on_task_id)
- **Covers:** FR129 (view production timeline in Gantt chart format)

---

### Story 12.4: Build Kanban Board View

As a **Production Staff**,
I want **to view and manage production tasks in a Kanban board**,
So that **I can focus on current work and move tasks through stages**.

**Acceptance Criteria:**

**Given** production tasks exist
**When** I navigate to Production and select "Kanban View"
**Then** I see a Kanban board with columns: To Do, In Progress, Review, Done

**And** tasks are displayed as cards with: Task name, Assigned to, Due date, Title
**And** I can drag cards between columns to update task status
**And** I can click a card to edit details (description, due date, cost, notes)
**And** I can filter by project or assigned user
**And** cards are color-coded by overdue status (red if past due)

**Prerequisites:** Story 12.2 (tasks exist)

**Technical Notes:**
- Kanban component: Use `@dnd-kit/core` for drag-and-drop functionality
- Columns: Map to task status field ('todo' | 'in_progress' | 'review' | 'done')
- Card component: `components/production/TaskCard.tsx`
- Update on drop: Call Server Action to update task status
- **Covers:** FR130 (view production tasks in Kanban board format)

---

### Story 12.5: Implement Production Alerts and Dashboards

As a **Managing Editor**,
I want **to receive alerts for overdue production tasks and view production pipeline health**,
So that **I can proactively address delays**.

**Acceptance Criteria:**

**Given** production tasks exist
**When** a task becomes overdue (due_date < today AND status != 'done')
**Then** the assigned user receives an email alert

**And** the Managing Editor receives a daily digest of all overdue tasks
**And** the Production Dashboard shows: Projects in progress, Overdue tasks, Upcoming deadlines (next 7 days), Production costs vs. budget
**And** the main dashboard (Publisher/Owner) shows a "Production Pipeline" widget with upcoming milestones
**And** I can click "View All Overdue Tasks" to see a filtered list

**Prerequisites:** Story 12.2 (tasks), Story 10.1 (dashboard)

**Technical Notes:**
- Overdue check: Inngest scheduled job (daily) checks tasks with due_date < NOW() AND status != 'done'
- Email alerts: Individual alerts + daily digest email
- Production dashboard: `app/(dashboard)/production/dashboard/page.tsx`
- Widget: `components/dashboard/ProductionPipelineWidget.tsx` (upcoming milestones)
- **Covers:** FR133 (view production pipeline health and upcoming deadlines), FR134 (alert users to overdue production tasks)

---

## Epic 13: ONIX & Metadata Automation (Growth - Post-MVP)

**Epic Goal:** Enable publishers to export title metadata in ONIX 3.0 format for distribution to retailers, aggregators, and libraries. This automates metadata delivery and ensures compliance with industry standards.

**Covers:** FR135-FR138 (ONIX & Metadata Export)

**Dependencies:** Epic 1 (Foundation), Epic 4 (Title Management - requires complete metadata)

---

### Story 13.1: Build ONIX 3.0 Export Engine

As a **developer**,
I want **to build the ONIX 3.0 export engine**,
So that **title metadata can be exported in the industry-standard format**.

**Acceptance Criteria:**

**Given** titles with complete metadata exist
**When** the ONIX export is triggered
**Then** the system generates an XML file conforming to ONIX 3.0 specification

**And** the XML includes: Product identifiers (ISBN), Descriptive detail (title, contributors, subjects/BISAC), Publishing detail (publisher, publication date, status), Product supply (prices, availability)
**And** the export validates against the ONIX 3.0 XSD schema
**And** multi-format titles export each format as a separate ONIX record
**And** the export file is stored in S3 with a generated filename (e.g., `salina-onix-2025-01-15.xml`)

**Prerequisites:** Story 4.1 (title schema with metadata)

**Technical Notes:**
- ONIX generation: Use XML builder library (e.g., `xmlbuilder2`)
- ONIX spec: Follow ONIX 3.0 Product Record structure (https://www.editeur.org/93/Release-3.0-Downloads/)
- Validation: Use ONIX XSD schema for validation before export
- Server Action: `src/actions/onix.ts` → `generateONIXExport(titleIds[])`
- Reference data: BISAC codes, contributor roles, product forms (hardcover = BB, paperback = BC, etc.)
- **Covers:** FR135 (export title metadata in ONIX 3.0 format)

---

### Story 13.2: Build ONIX Export Interface

As a **Sales & Marketing user**,
I want **to generate ONIX exports for selected titles**,
So that **I can send metadata to distributors and retailers**.

**Acceptance Criteria:**

**Given** titles exist with complete metadata
**When** I navigate to Metadata > ONIX Export
**Then** I can select titles to include in the export (all titles, or filter by status/publication date)

**And** I can click "Generate ONIX Export" and the system creates the XML file
**And** I see a progress indicator while the export is being generated
**And** when complete, I can download the ONIX file
**And** I can view a history of past exports (date, number of titles, file size, download link)
**And** I can schedule automatic ONIX exports (weekly, monthly) for all active titles

**Prerequisites:** Story 13.1 (ONIX export engine)

**Technical Notes:**
- ONIX export page: `app/(dashboard)/metadata/onix/page.tsx`
- Title selection: Multi-select table with filters
- Export job: Inngest job for large exports (avoid timeout)
- History: Store exports in `metadata_exports` table with file_url, title_count, created_at
- Scheduled exports: Inngest scheduled job (weekly/monthly)
- **Covers:** FR135 (export ONIX), FR137 (batch metadata updates - via scheduled export)

---

### Story 13.3: Build CSV Metadata Export

As a **Sales & Marketing user**,
I want **to export title metadata to CSV for distributors**,
So that **I can provide metadata to partners who don't accept ONIX**.

**Acceptance Criteria:**

**Given** titles exist
**When** I navigate to Metadata > CSV Export
**Then** I can select titles to include and choose which fields to export (Title, Subtitle, ISBN, Authors, BISAC, Description, Price, etc.)

**And** I can click "Generate CSV Export" and the system creates the CSV file
**And** I can download the CSV file
**And** I can save export configurations (field selections) for reuse
**And** I can view export history (date, title count, download link)

**Prerequisites:** Story 13.1 (export pattern)

**Technical Notes:**
- CSV export page: `app/(dashboard)/metadata/csv/page.tsx`
- Field selection: Checkboxes for all available fields (title, subtitle, isbn, contributors, bisac, description, prices, dimensions, etc.)
- CSV generation: Server Action generates CSV with selected fields
- Export configurations: Store in `export_configs` table for reuse
- **Covers:** FR136 (export metadata to CSV for distributors)

---

### Story 13.4: Implement ONIX Validation and Compliance Checking

As a **Sales & Marketing user**,
I want **the system to validate ONIX exports for compliance**,
So that **I can be confident the metadata will be accepted by distributors**.

**Acceptance Criteria:**

**Given** an ONIX export is generated
**When** the export is being created
**Then** the system validates the XML against the ONIX 3.0 XSD schema

**And** if validation fails, the system reports specific errors (missing required fields, invalid codes, etc.)
**And** I can see a validation report showing: Titles with missing ISBNs, Missing BISAC codes, Missing descriptions, Invalid product forms
**And** I can click "Fix Errors" to navigate to the title edit page for each problematic title
**And** the export is only generated if all titles pass validation (or I can choose to export valid titles only)

**Prerequisites:** Story 13.1 (ONIX export engine)

**Technical Notes:**
- Validation: Use ONIX XSD schema with XML validator library
- Validation report: `components/metadata/ONIXValidationReport.tsx`
- Error handling: Collect validation errors, display with title names and error messages
- Fix errors: Deep links to title edit page with error highlighting
- **Covers:** FR138 (validate ONIX export compliance with industry standards)

---

## Epic 14: Advanced Analytics (Growth - Post-MVP)

**Epic Goal:** Enable publishers to make data-driven business decisions with advanced reports including title P&L, contributor earnings, inventory aging, cash flow projections, and production pipeline metrics.

**Covers:** FR139-FR144 (Advanced Analytics)

**Dependencies:** Epic 1 (Foundation), Epic 4 (Titles), Epic 7 (Inventory), Epic 8 (Orders), Epic 11 (Royalties), Epic 12 (Production)

---

### Story 14.1: Build Title P&L Report

As a **Publisher/Owner**,
I want **to view profit & loss reports for each title**,
So that **I can understand which titles are profitable**.

**Acceptance Criteria:**

**Given** titles with sales, production costs, and royalties exist
**When** I navigate to Reports > Title P&L
**Then** I can select a title and date range

**And** the report displays:
  - Revenue: Total sales (by format and channel)
  - Cost of Goods Sold (COGS): Print costs (moving average × units sold)
  - Production Costs: Editorial, design, art, prepress (from production projects)
  - Royalties: Total royalty expenses (from royalty statements)
  - Gross Profit: Revenue - COGS - Production Costs - Royalties
  - Gross Margin: Gross Profit / Revenue

**And** I can view a breakdown by format (hardcover vs. paperback vs. ebook)
**And** I can export the P&L to CSV or PDF
**And** I can compare multiple titles side-by-side

**Prerequisites:** Story 8.1 (sales), Story 7.2 (COGS), Story 12.1 (production costs), Story 11.1 (royalties)

**Technical Notes:**
- P&L report page: `app/(dashboard)/reports/title-pl/page.tsx`
- Query: Join orders → order_line_items → formats → titles → production_projects → royalty_statements
- COGS calculation: SUM(units_sold * moving_average_cost)
- Production costs: SUM(production_tasks.cost) for title's project
- Royalties: SUM(royalty_statements.net_royalty_payable) for title's contracts
- Chart: Waterfall chart showing revenue → costs → profit
- **Covers:** FR139 (title P&L reports with production costs, sales, and royalties)

---

### Story 14.2: Build Contributor Earnings Report

As a **Accounting user**,
I want **to view contributor earnings and liability reports**,
So that **I can track total royalty obligations**.

**Acceptance Criteria:**

**Given** royalty statements exist
**When** I navigate to Reports > Contributor Earnings
**Then** I can select a date range or statement period

**And** the report displays for each contributor:
  - Total units sold (across all titles)
  - Total sales revenue (gross)
  - Total royalties earned (gross)
  - Total advance recoupment deductions
  - Net royalties payable
  - Payment status (unpaid/paid)

**And** I see summary metrics: Total royalties payable (liability), Total paid YTD, Outstanding balance
**And** I can filter by contributor or contract status (active/completed)
**And** I can export the report to CSV

**Prerequisites:** Story 11.3 (royalty calculations)

**Technical Notes:**
- Contributor earnings page: `app/(dashboard)/reports/contributor-earnings/page.tsx`
- Query: Aggregate royalty_statements grouped by contributor
- Liability calculation: SUM(net_royalty_payable WHERE payment_status = 'unpaid')
- **Covers:** FR140 (contributor earnings and liability tracking)

---

### Story 14.3: Build Inventory Aging Analysis

As a **Publisher/Owner**,
I want **to view inventory aging reports**,
So that **I can identify slow-moving stock**.

**Acceptance Criteria:**

**Given** inventory with transaction history exists
**When** I navigate to Reports > Inventory Aging
**Then** I see a report showing each SKU with:
  - Current quantity
  - Inventory value (quantity × moving_average_cost)
  - Average days in inventory (calculated from first receipt transaction date)
  - Aging bucket (0-90 days, 91-180 days, 181-365 days, 365+ days)
  - Sales velocity (units sold per month in last 6 months)

**And** I can filter by location or aging bucket
**And** I can sort by days in inventory (descending to see oldest stock)
**And** the report highlights slow-moving SKUs (low sales velocity + high inventory age)
**And** I see summary metrics: Total inventory value, % in each aging bucket

**Prerequisites:** Story 7.1 (inventory transactions)

**Technical Notes:**
- Inventory aging page: `app/(dashboard)/reports/inventory-aging/page.tsx`
- Days in inventory: `NOW() - MIN(inventory_transactions.created_at WHERE type='receipt')`
- Sales velocity: `SUM(units_sold in last 6 months) / 6`
- Aging buckets: CASE WHEN days <= 90 THEN '0-90' WHEN days <= 180 THEN '91-180', etc.
- Slow-moving: Flag if sales_velocity < 5 units/month AND days_in_inventory > 180
- **Covers:** FR141 (inventory aging analysis)

---

### Story 14.4: Build Months of Supply Calculator

As a **Warehouse/Operations user**,
I want **to calculate months of supply for each SKU**,
So that **I can plan print runs and avoid overstocking**.

**Acceptance Criteria:**

**Given** inventory and sales history exist
**When** I navigate to Reports > Months of Supply
**Then** I see a report showing each SKU with:
  - Current quantity
  - Average monthly sales (units sold per month in last 6 months)
  - Months of supply (current quantity / average monthly sales)
  - Status: Overstocked (12+ months), Healthy (3-12 months), Low (1-3 months), Critical (<1 month)

**And** I can filter by status or title
**And** I can sort by months of supply (descending to see overstocked items)
**And** the report suggests reorder quantity based on target months of supply (e.g., maintain 6 months)

**Prerequisites:** Story 7.1 (inventory), Story 8.1 (sales)

**Technical Notes:**
- Months of supply page: `app/(dashboard)/reports/months-of-supply/page.tsx`
- Average monthly sales: `SUM(units_sold in last 6 months) / 6`
- Months of supply: `current_quantity / average_monthly_sales`
- Suggested reorder: `(target_months_of_supply * average_monthly_sales) - current_quantity`
- Handle zero sales: If average_monthly_sales = 0, display "No recent sales" instead of infinity
- **Covers:** FR142 (calculate months of supply for inventory planning)

---

### Story 14.5: Build Cash Flow Projection Report

As a **Publisher/Owner**,
I want **to view cash flow projections**,
So that **I can anticipate cash needs for print runs and operations**.

**Acceptance Criteria:**

**Given** sales history, production costs, and royalty liabilities exist
**When** I navigate to Reports > Cash Flow Projection
**Then** I see a 12-month forward projection with:
  - Projected revenue (based on sales trend analysis)
  - Projected COGS (based on planned print runs and sales forecast)
  - Projected production costs (from production projects with future due dates)
  - Projected royalty payments (from unpaid royalty statements)
  - Net cash flow (revenue - costs - royalties)

**And** I can see monthly breakdown and cumulative totals
**And** I can adjust assumptions (sales growth rate, planned print runs) and see updated projections
**And** the projection highlights months with negative cash flow (cash shortfall)

**Prerequisites:** Story 8.1 (sales), Story 12.1 (production costs), Story 11.1 (royalties)

**Technical Notes:**
- Cash flow page: `app/(dashboard)/reports/cash-flow/page.tsx`
- Revenue projection: Linear regression on last 12 months of sales, project forward
- COGS projection: Planned print runs (from production schedule) × unit cost
- Production costs: SUM(production_tasks.cost WHERE due_date in projection period)
- Royalty payments: SUM(royalty_statements.net_royalty_payable WHERE payment_status = 'unpaid')
- Adjustable assumptions: Sliders for sales growth rate, print run quantities
- **Covers:** FR143 (cash flow projections)

---

### Story 14.6: Build Production Pipeline Health Metrics

As a **Managing Editor**,
I want **to view production pipeline health metrics**,
So that **I can identify bottlenecks and resource constraints**.

**Acceptance Criteria:**

**Given** production projects and tasks exist
**When** I navigate to Reports > Production Health
**Then** I see metrics:
  - Projects in progress (by milestone)
  - Average days per milestone (editorial, design, proofing, final files)
  - Overdue tasks (count and percentage)
  - Resource utilization (tasks assigned per user)
  - On-time delivery rate (% of projects completed on or before target publication date)

**And** I can see a trend chart showing production throughput (titles completed per month)
**And** I can identify bottlenecks (milestones with longest average duration)
**And** I can filter by date range or project status

**Prerequisites:** Story 12.1 (production projects)

**Technical Notes:**
- Production health page: `app/(dashboard)/reports/production-health/page.tsx`
- Average days per milestone: `AVG(completed_at - created_at) GROUP BY milestone`
- Resource utilization: `COUNT(tasks WHERE assigned_to_user_id = X AND status != 'done')`
- On-time delivery: `COUNT(projects WHERE actual_publication_date <= target_publication_date) / COUNT(projects)`
- Bottleneck detection: Highlight milestone with highest average duration
- **Covers:** FR144 (production pipeline health metrics)

---

## FR Coverage Matrix

This matrix ensures all 144 functional requirements are addressed by specific stories.

### MVP Coverage (FR1-FR114)

| FR# | Requirement Summary | Epic | Story |
|-----|---------------------|------|-------|
| FR1 | Self-service tenant registration | Epic 1 | Story 1.5 |
| FR2 | Tenant provisioning with isolated schema | Epic 1 | Stories 1.3, 1.5 |
| FR3 | Configure tenant branding | Epic 1 | Story 1.5 |
| FR4 | Configure timezone/locale/currency | Epic 1 | Story 1.5 |
| FR5 | Tiered subscription plans | Epic 1 | Story 1.5 |
| FR6 | Subscription upgrade/downgrade | Epic 1 | Story 1.5 |
| FR7 | View tenant usage metrics | Epic 1 | Story 1.5 |
| FR8 | Export tenant data dump | Epic 1 | Story 1.5 |
| FR9 | Automated backups with point-in-time recovery | Epic 1 | Story 1.6 |
| FR10 | Invite users via email with role assignment | Epic 2 | Story 2.1 |
| FR11 | Send invitation email with activation link | Epic 2 | Story 2.1 |
| FR12 | Accept invitation and complete profile | Epic 2 | Story 2.1 |
| FR13 | Enforce RBAC for 8 user types | Epic 2 | Story 2.2 |
| FR14 | Audit trail of user actions | Epic 2 | Story 2.4 |
| FR15 | Deactivate/reactivate user accounts | Epic 2 | Story 2.3 |
| FR16 | Update own profile and contact info | Epic 2 | Story 2.3 |
| FR17 | Field-level permissions based on role | Epic 2 | Story 2.2 |
| FR18 | Enter ISBN prefix | Epic 3 | Story 3.2 |
| FR19 | Generate ISBN range with check digits | Epic 3 | Stories 3.1, 3.2 |
| FR20 | Track available/assigned ISBN status | Epic 3 | Story 3.4 |
| FR21 | Enforce global ISBN uniqueness | Epic 3 | Story 3.2 |
| FR22 | View ISBN block utilization | Epic 3 | Story 3.4 |
| FR23 | Alert when block has <5 ISBNs | Epic 3 | Story 3.5 |
| FR24 | Reserve ISBNs for future titles | Epic 3 | Story 3.3 |
| FR25 | Create multiple ISBN blocks | Epic 3 | Story 3.2 |
| FR26 | Manually assign ISBN from pool | Epic 3 | Story 3.4 |
| FR27 | Create title records | Epic 4 | Stories 4.1, 4.2 |
| FR28 | Multi-step title creation wizard | Epic 4 | Stories 4.2, 4.3 |
| FR29 | Auto-suggest next available ISBN | Epic 4 | Story 4.2 |
| FR30 | Support multiple formats per title | Epic 4 | Story 4.1 |
| FR31 | Unique ISBN per format | Epic 4 | Story 4.1 |
| FR32 | Add BISAC subject codes | Epic 4 | Story 4.3 |
| FR33 | Enter sales metadata | Epic 4 | Story 4.3 |
| FR34 | Upload cover and asset files | Epic 4 | Story 4.3 |
| FR35 | Set pricing per format | Epic 4 | Story 4.3 |
| FR36 | Auto-save draft titles | Epic 4 | Stories 4.2, 4.3 |
| FR37 | Edit existing titles | Epic 4 | Story 4.5 |
| FR38 | View complete title record | Epic 4 | Story 4.4 |
| FR39 | Search titles by title/ISBN/author/BISAC | Epic 4 | Story 4.4 |
| FR40 | Track publication date and status | Epic 4 | Story 4.4 |
| FR41 | Add contributors to titles | Epic 5 | Stories 5.2, 5.3 |
| FR42 | Specify contributor role and percentage | Epic 5 | Stories 5.2, 5.3 |
| FR43 | Store contributor contact information | Epic 5 | Story 5.2 |
| FR44 | Link contributor to multiple titles | Epic 5 | Stories 5.2, 5.3 |
| FR45 | View all titles associated with contributor | Epic 5 | Story 5.4 |
| FR46 | Contributors can log in and view titles | Epic 5 | Story 5.4 |
| FR47 | Contributors can update own contact info | Epic 5 | Story 5.4 |
| FR48 | Create customer records | Epic 6 | Story 6.2 |
| FR49 | Categorize customers by type | Epic 6 | Stories 6.1, 6.2 |
| FR50 | Store billing and shipping addresses | Epic 6 | Stories 6.1, 6.2 |
| FR51 | Assign customer-specific pricing rules | Epic 6 | Story 6.3 |
| FR52 | View customer order history | Epic 6 | Story 6.4 |
| FR53 | Search customers | Epic 6 | Story 6.2 |
| FR54 | Track inventory per SKU and location | Epic 7 | Stories 7.1, 7.4 |
| FR55 | Record print runs with costs | Epic 7 | Story 7.2 |
| FR56 | Calculate moving average cost | Epic 7 | Stories 7.1, 7.2 |
| FR57 | Perform inventory adjustments | Epic 7 | Story 7.3 |
| FR58 | View inventory transaction history | Epic 7 | Stories 7.1, 7.4 |
| FR59 | Alert when inventory below threshold | Epic 7 | Story 7.5 |
| FR60 | View current inventory levels | Epic 7 | Story 7.4 |
| FR61 | View inventory value | Epic 7 | Story 7.4 |
| FR62 | Support multiple warehouse locations | Epic 7 | Story 7.1 |
| FR63 | Create manual orders | Epic 8 | Story 8.2 |
| FR64 | Add line items to orders | Epic 8 | Story 8.2 |
| FR65 | Real-time inventory availability check | Epic 8 | Story 8.2 |
| FR66 | Apply customer pricing rules | Epic 8 | Story 8.2 |
| FR67 | Manual price override | Epic 8 | Story 8.2 |
| FR68 | Import Shopify orders automatically | Epic 8 | Story 8.3 |
| FR69 | Sync order status with Shopify | Epic 8 | Stories 8.3, 8.5 |
| FR70 | View order pipeline | Epic 8 | Story 8.6 |
| FR71 | Edit orders before fulfillment | Epic 8 | Story 8.6 |
| FR72 | Prevent editing after shipment | Epic 8 | Story 8.6 |
| FR73 | View pick lists | Epic 8 | Story 8.4 |
| FR74 | Barcode scanning for fulfillment | Epic 8 | Story 8.4 |
| FR75 | Generate shipping labels | Epic 8 | Story 8.5 |
| FR76 | Calculate shipping rates | Epic 8 | Story 8.5 |
| FR77 | Mark shipped with tracking number | Epic 8 | Story 8.4 |
| FR78 | Deduct inventory on shipment | Epic 8 | Story 8.4 |
| FR79 | Shipping confirmation email | Epic 8 | Story 8.4 |
| FR80 | View shipment status and tracking | Epic 8 | Story 8.5 |
| FR81 | Record returns with reason codes | Epic 8 | Story 8.7 |
| FR82 | Create credit memo | Epic 8 | Story 8.7 |
| FR83 | Adjust inventory for returns | Epic 8 | Story 8.7 |
| FR84 | Apply credit or issue refund | Epic 8 | Story 8.7 |
| FR85 | View returns history | Epic 8 | Story 8.7 |
| FR86 | Configure Shopify integration | Epic 9 | Story 9.1 |
| FR87 | Import Shopify orders (config) | Epic 9 | Story 9.1 |
| FR88 | Sync inventory levels to Shopify | Epic 9 | Stories 9.1, 9.4 |
| FR89 | Monitor integration health | Epic 9 | Stories 9.1, 9.5 |
| FR90 | Configure QuickBooks integration | Epic 9 | Story 9.3 |
| FR91 | Generate QuickBooks export files | Epic 9 | Story 9.3 |
| FR92 | Map Salina accounts to QuickBooks | Epic 9 | Story 9.3 |
| FR93 | Schedule automated exports | Epic 9 | Story 9.3 |
| FR94 | Configure EasyPost integration | Epic 9 | Story 9.2 |
| FR95 | Calculate shipping rates (EasyPost) | Epic 9 | Story 9.2 |
| FR96 | Generate shipping labels (EasyPost) | Epic 9 | Story 9.2 |
| FR97 | Fetch tracking updates | Epic 9 | Story 9.2 |
| FR98 | Secure credential storage | Epic 9 | Stories 9.1, 9.2, 9.6 |
| FR99 | OAuth flows for integrations | Epic 9 | Stories 9.1, 9.6 |
| FR100 | Dashboard with key metrics | Epic 10 | Story 10.1 |
| FR101 | Sales reports by multiple dimensions | Epic 10 | Story 10.2 |
| FR102 | Inventory status reports | Epic 10 | Story 10.3 |
| FR103 | Customer purchase reports | Epic 10 | Story 10.4 |
| FR104 | Royalty reports (defer to Epic 11) | Epic 11 | Stories 11.4, 11.5 |
| FR105 | Recent activity feed | Epic 10 | Story 10.1 |
| FR106 | Quick actions on dashboard | Epic 10 | Story 10.1 |
| FR107 | Configure company information | Epic 10 | Story 10.7 |
| FR108 | Guided onboarding wizard | Epic 10 | Story 10.5 |
| FR109 | Contextual help and documentation | Epic 10 | Story 10.7 |
| FR110 | Import titles from CSV | Epic 10 | Story 10.6 |
| FR111 | Import customers from CSV | Epic 10 | Story 10.6 |
| FR112 | Import inventory from CSV | Epic 10 | Story 10.6 |
| FR113 | Bulk export data | Epic 10 | Story 10.7 |
| FR114 | View system usage statistics | Epic 10 | Story 10.7 |

### Growth Coverage (FR115-FR144)

| FR# | Requirement Summary | Epic | Story |
|-----|---------------------|------|-------|
| FR115 | Create contract records | Epic 11 | Stories 11.1, 11.2 |
| FR116 | Define royalty rules | Epic 11 | Stories 11.1, 11.2 |
| FR117 | Royalty rates by format and channel | Epic 11 | Stories 11.1, 11.2 |
| FR118 | Record advance payments | Epic 11 | Story 11.2 |
| FR119 | Calculate royalties based on sales | Epic 11 | Story 11.3 |
| FR120 | Account for advance recoupment | Epic 11 | Story 11.3 |
| FR121 | Generate royalty statements (PDF) | Epic 11 | Story 11.4 |
| FR122 | Contributors view statements online | Epic 11 | Story 11.5 |
| FR123 | Download historical statements | Epic 11 | Story 11.5 |
| FR124 | Export royalty payment summaries | Epic 11 | Story 11.6 |
| FR125 | Create accounting entries for royalties | Epic 11 | Story 11.6 |
| FR126 | Create production projects | Epic 12 | Stories 12.1, 12.2 |
| FR127 | Define production milestones | Epic 12 | Stories 12.1, 12.2 |
| FR128 | Assign tasks with due dates | Epic 12 | Story 12.2 |
| FR129 | View production timeline (Gantt) | Epic 12 | Story 12.3 |
| FR130 | View production tasks (Kanban) | Epic 12 | Story 12.4 |
| FR131 | Track production costs | Epic 12 | Stories 12.1, 12.2 |
| FR132 | Upload file versions | Epic 12 | Story 12.2 |
| FR133 | View production pipeline health | Epic 12 | Story 12.5 |
| FR134 | Alert overdue production tasks | Epic 12 | Story 12.5 |
| FR135 | Export ONIX 3.0 metadata | Epic 13 | Stories 13.1, 13.2 |
| FR136 | Export CSV metadata | Epic 13 | Story 13.3 |
| FR137 | Batch metadata updates | Epic 13 | Story 13.2 |
| FR138 | Validate ONIX compliance | Epic 13 | Story 13.4 |
| FR139 | Title P&L reports | Epic 14 | Story 14.1 |
| FR140 | Contributor earnings reports | Epic 14 | Story 14.2 |
| FR141 | Inventory aging analysis | Epic 14 | Story 14.3 |
| FR142 | Months of supply calculator | Epic 14 | Story 14.4 |
| FR143 | Cash flow projections | Epic 14 | Story 14.5 |
| FR144 | Production pipeline metrics | Epic 14 | Story 14.6 |

**Total Coverage:** All 144 functional requirements are mapped to specific implementable stories.

---

## Summary

## Epic and Story Summary

### MVP Implementation (Epics 1-10)

**Total MVP Stories:** 60 stories across 10 epics

**Epic Breakdown:**
- **Epic 1:** Foundation & Multi-Tenant Setup - 6 stories (greenfield setup exception)
- **Epic 2:** User & Access Management - 4 stories (8-role RBAC system)
- **Epic 3:** ISBN Block Management - 5 stories (publishing-specific ISBN management)
- **Epic 4:** Title & Metadata Management - 5 stories (core content management)
- **Epic 5:** Contributor Management - 4 stories (author/illustrator tracking)
- **Epic 6:** Customer Management - 4 stories (CRM for publishers)
- **Epic 7:** Inventory Management - 5 stories (stock tracking with moving average cost)
- **Epic 8:** Order Processing - 7 stories (order lifecycle: entry → fulfillment → shipping → returns)
- **Epic 9:** Integration Ecosystem - 6 stories (Shopify, QuickBooks, EasyPost)
- **Epic 10:** Dashboards & Reporting - 7 stories (KPIs, reports, onboarding, data import)

**MVP Scope:**
- Covers all 114 MVP functional requirements (FR1-FR114)
- Delivers a fully functional multi-tenant SaaS publishing ERP
- Enables day-one operations: title management, ISBN tracking, order processing, inventory management, and accounting integration
- Each story is sized for single dev agent completion in one focused session

### Growth Implementation (Epics 11-14)

**Total Growth Stories:** 20 stories across 4 epics

**Epic Breakdown:**
- **Epic 11:** Contracts & Royalties - 6 stories (automate royalty calculations and payments)
- **Epic 12:** Production & Scheduling - 5 stories (editorial/production workflow management)
- **Epic 13:** ONIX & Metadata Automation - 4 stories (industry-standard metadata distribution)
- **Epic 14:** Advanced Analytics - 6 stories (P&L, aging, cash flow, production metrics)

**Growth Scope:**
- Covers all 30 Growth functional requirements (FR115-FR144)
- Post-MVP features that enhance publisher operations
- Each epic delivers standalone value and can be prioritized independently

### Implementation Approach

**Story Sizing Principles:**
1. ✅ **Completable in one session** - Each story can be implemented by a single dev agent in one focused session
2. ✅ **Vertically sliced** - Stories deliver end-to-end functionality (database → API → UI)
3. ✅ **BDD acceptance criteria** - All stories use Given/When/Then format for testability
4. ✅ **Architecture references** - Technical notes cite specific architecture decisions and line numbers
5. ✅ **FR traceability** - Every story explicitly maps to functional requirements

**Epic Organization Principles:**
1. ✅ **User value delivery** - Each epic delivers tangible user value (NOT organized by technical layers)
2. ✅ **Clear dependencies** - Prerequisites are explicitly documented
3. ✅ **Testable outcomes** - Each epic has measurable completion criteria
4. ✅ **Exception handling** - Foundation epic (Epic 1) is the only acceptable technical-layer epic for greenfield setup

**Quality Assurance:**
- All 144 functional requirements have explicit story coverage
- All stories have prerequisites, acceptance criteria, technical notes, and FR mappings
- Stories reference architecture document line numbers for implementation guidance
- No time estimates (as per BMM workflow principles)

### Next Steps

**After Epic Approval:**
1. **Implementation Readiness Check** - Validate PRD, UX Design, Architecture, and Epic/Story alignment (workflow: `implementation-readiness`)
2. **Sprint Planning** - Create sprint status file and organize stories into sprints (workflow: `sprint-planning`)
3. **Story Development** - Execute stories using `dev-story` workflow with story context assembly
4. **Code Review** - Review completed stories with `code-review` workflow
5. **Testing** - Validate against acceptance criteria and test design system

**Living Document:**
This epic breakdown will be updated as:
- UX Design adds interaction details to stories
- Architecture provides additional technical decisions
- Implementation reveals new sub-tasks or dependencies
- User feedback drives priority adjustments

---

_For implementation: Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown._

_This document will be updated after UX Design and Architecture workflows to incorporate interaction details and technical decisions._
