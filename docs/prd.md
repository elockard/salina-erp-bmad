# Salina Bookshelf ERP - Product Requirements Document

**Author:** BMad
**Date:** 2025-11-17
**Version:** 1.0

---

## Executive Summary

Salina Bookshelf ERP is a modern, web-based ERP system built specifically for small and midsize publishers. It unifies title metadata, production workflows, contracts & royalties, inventory management, order processing, and accounting handoff into one integrated platform. The system eliminates the scattered spreadsheets and manual workflows typical in small presses by providing purpose-built tools that understand publishing-specific operations including ISBN management, ONIX export, royalty calculations, and contributor management.

The platform serves multi-tenant deployment from the start, allowing multiple independent publishers to operate securely on shared infrastructure while maintaining complete data isolation and ownership.

### What Makes This Special

**Unified publishing operations that eliminate scattered spreadsheets** — Salina ERP is purpose-built for the unique workflows of small/midsize publishers (titles, royalties, production milestones, ONIX metadata) instead of forcing publishers into generic business software. It speaks the language of publishing: ISBNs, contributors, BISAC codes, royalty recoupment, print runs, and returns handling.

---

## Project Classification

**Technical Type:** saas_b2b
**Domain:** general (publishing vertical)
**Complexity:** medium

This is a multi-tenant SaaS B2B platform with specialized publishing workflows. While not in a highly-regulated domain like healthcare or fintech, it handles sensitive financial data (contracts, royalties, sales) and requires robust security, data isolation, and integration capabilities.

The publishing industry has unique data models and workflows (contributors, royalties, ONIX metadata, returns, print runs) that differentiate this from generic business management software.

---

## Success Criteria

Success means small and midsize publishers can:

1. **Replace spreadsheet chaos** - Eliminate manual data entry across multiple Excel files and tools
2. **Achieve operational clarity** - See real-time title P&L, inventory status, and royalty liabilities at a glance
3. **Scale confidently** - Handle growing title catalogs and sales volume without proportional operational overhead
4. **Integrate seamlessly** - Connect sales channels (Shopify), accounting (QuickBooks), and fulfillment (EasyPost) without custom development
5. **Trust the numbers** - Rely on automated royalty calculations and accounting exports with audit trails

### Business Metrics

- **Publisher retention**: Publishers continue using the system year-over-year (sticky due to historical data)
- **Time savings**: Reduce monthly close processes from days to hours
- **Data accuracy**: Eliminate royalty calculation disputes through transparent, auditable calculations
- **Catalog growth**: Support publishers managing 50-500+ active titles efficiently
- **Multi-channel success**: Publishers selling through 3+ channels (direct, Shopify, Amazon, wholesale) operate smoothly

---

## Product Scope

### MVP - Minimum Viable Product

**For the system to be useful to a publisher on day one, these capabilities must work:**

**Title & Metadata Management**
- Master record for each title/format: ISBNs, contributors, BISAC codes, prices
- ISBN block management: publishers enter prefixes, system generates full range (00-99) with auto-calculated check digits (Modulo 10 algorithm), track available/assigned status
- ISBN reservation for future titles before full title creation
- ISBN manual assignment per format (hardcover, paperback, ebook each get unique ISBN)
- Low-ISBN alerts when block nearing exhaustion (e.g., 5 remaining)
- Sales metadata: descriptions, keywords, reviews
- Asset links: covers, interiors, marketing files
- Multi-format title support (one title, multiple SKUs)

**Customer & Order Management**
- Customer records: schools, bookstores, consumers
- Manual order entry with pricing rules/discounts
- Shopify order import and sync
- Pick/pack workflow for warehouse operations
- Returns handling with credit and inventory adjustment

**Inventory Management**
- Inventory tracking per SKU and location
- Print run records: quantity, printer, cost, freight
- Moving average unit cost calculation
- Low-stock alerts
- Inventory transactions (receipts, shipments, adjustments, returns)

**Integrations (MVP Critical)**
- QuickBooks export: sales summaries, COGS, inventory adjustments (CSV/IIF format)
- EasyPost shipping integration: rate calculation, label generation, tracking
- Shopify: order import, inventory sync

**Multi-Tenant & Access Control**
- Multi-tenant architecture with complete data isolation
- Role-based permissions for 8 user types: Publisher/Owner, Managing Editor, Production Staff, Sales & Marketing, Warehouse/Operations, Accounting, Authors, Illustrators
- User invitation and management workflows
- Tenant-level configuration and branding

**Core Dashboards**
- Sales overview by title, channel, customer type
- Inventory status and alerts
- Order pipeline and fulfillment status

### Growth Features (Post-MVP)

**Contracts & Royalties Engine**
- Contract records per contributor (authors, illustrators)
- Royalty rules by format/channel (percentage, flat rate, sliding scales)
- Advances and recoupment tracking
- Automatic royalty calculation based on sales and returns
- Royalty statement generation (PDF)
- Royalty payment summaries for accounting export

**Production & Scheduling**
- Production milestones: editorial, design, proofing, final files
- Task assignments with due dates
- Gantt and Kanban views for project tracking
- Cost tracking for title P&L: editing, design, art, prepress
- File version management

**ONIX & Metadata Automation**
- ONIX 3.0 export (industry-standard metadata format)
- CSV metadata export for distributors
- Batch metadata updates
- Automated metadata sync to distribution partners

**Advanced Analytics**
- Title P&L reports (production costs + sales + royalties)
- Contributor earnings and liability tracking
- Inventory aging and months of supply analysis
- Production pipeline health metrics
- Cash flow projections

**Additional Integrations**
- Amazon order import
- Ingram, Baker & Taylor distributor integration
- ShipStation support (alternative to EasyPost)
- Multiple accounting systems beyond QuickBooks

### Vision (Future)

**Contributor Self-Service Portal**
- Authors and illustrators log in to view their royalty statements
- Download historical statements
- View title sales performance
- Update contact and payment information

**Mobile Warehouse App**
- Mobile-optimized pick/pack interface
- Barcode scanning for inventory management
- Quick inventory adjustments on the floor

**Advanced Forecasting**
- ML-based reprint suggestions using sales velocity
- Seasonal demand patterns
- Automated purchase order generation for print runs

**API & Extensibility**
- Public API for third-party integrations
- Webhook support for real-time events
- Custom report builder

**International Expansion**
- Multi-currency support
- International ISBN management (different country prefixes)
- VAT and international tax handling
- Multi-language interface

---

## saas_b2b Specific Requirements

**Subscription & Business Model:**
- Monthly and annual subscription tiers per publisher organization
- Tiered pricing model (Starter, Professional, Enterprise) based on feature access and usage limits
- Self-service signup with trial period capability
- Billing integration for automated invoicing and payment processing
- Usage tracking for fair billing (titles, users, order volume)

**Tenant Management:**
- Complete tenant isolation with separate database schemas per publisher
- Tenant-level configuration: branding, settings, preferences
- Tenant provisioning workflow: signup → payment → tenant creation → onboarding
- Data migration support: CSV import for titles, customers, inventory from legacy systems
- Tenant suspension/deletion with data export capability

**Onboarding Experience:**
- Guided onboarding wizard for new publishers
- Sample data and templates to accelerate setup
- Contextual help and documentation
- Onboarding checklist tracking progress through initial configuration

**Integration Management:**
- Per-tenant integration credentials (Shopify API keys, QuickBooks tokens, EasyPost credentials)
- Integration health monitoring and error notifications
- OAuth flows for third-party service authorization
- Secure credential storage (encrypted at rest)

**Publishing Industry Specifics:**
- ISBN prefix management per publisher (multiple blocks supported)
- BISAC subject code taxonomy (maintained centrally, used by all tenants)
- Standard royalty calculation templates (adaptable per publisher)
- ONIX metadata standards compliance
- Industry-standard discount schedules (bookstore, library, educational)

### Multi-Tenancy Architecture

**Tenant Isolation:**
- Database-level isolation using separate schemas per tenant
- Row-level security policies as additional safeguard
- Tenant context enforced at application layer (middleware)
- No cross-tenant data access without explicit permission
- Tenant ID validation on every database operation

**Scalability & Performance:**
- Horizontal scaling capability for application servers
- Database connection pooling per tenant
- Background job processing with tenant context
- Caching strategy respects tenant boundaries

**Data Ownership:**
- Publisher owns 100% of their operational data
- Self-service data export (full database dump in JSON/CSV)
- Scheduled automated backups per tenant
- Point-in-time restore capability
- Data portability for migration to other systems

**Tenant Configuration:**
- Custom branding: logo, colors, email templates
- Timezone and locale preferences
- Default currency and measurement units
- Integration toggles (enable/disable Shopify, QuickBooks, etc.)
- Feature flags for gradual rollout

### Permissions & Roles

**Built-in Role Definitions:**

1. **Publisher/Owner**
   - Full system access and configuration
   - Manage users and roles
   - Financial data access (P&L, cash flow, all sales)
   - Billing and subscription management
   - Integration configuration

2. **Managing Editor**
   - Full access to titles, production, and scheduling
   - View-only financial data
   - Manage contributors (authors, illustrators)
   - Cannot modify accounting or user settings

3. **Production Staff**
   - Access to production milestones and tasks
   - File uploads and version management
   - View title metadata
   - Cannot access financial data or customer information

4. **Sales & Marketing**
   - Manage customers and pricing rules
   - Create and edit orders
   - View sales reports and analytics
   - Access marketing metadata and assets
   - Cannot access cost data or royalty information

5. **Warehouse/Operations**
   - Inventory management (receipts, adjustments, locations)
   - Pick/pack/ship workflows
   - Print run records
   - View order fulfillment queue
   - Cannot access financial data or pricing

6. **Accounting**
   - Full access to financial data and reports
   - Configure chart of accounts mapping
   - Generate accounting exports
   - View and manage royalty statements
   - Cannot create or modify orders directly

7. **Author**
   - View-only access to own titles and sales data
   - View own royalty statements and payment history (Growth phase feature)
   - Update own contact information
   - Cannot access other authors' data or publisher financials

8. **Illustrator**
   - View-only access to own titles and sales data
   - View own royalty statements and payment history (Growth phase feature)
   - Update own contact information
   - Cannot access other contributors' data or publisher financials

**Permission Model:**
- Role-based access control (RBAC) with predefined roles
- Granular permissions per resource type (titles, orders, inventory, financials)
- Actions: Create, Read, Update, Delete, Export
- Field-level permissions (e.g., Sales can see price but not cost)
- Publisher/Owner can customize role permissions (advanced feature)

**User Management:**
- Invite users via email with role assignment
- User acceptance workflow (email verification)
- Multi-role assignment (user can have multiple roles)
- User deactivation/reactivation
- Audit trail of user actions on sensitive data (contracts, royalties, financial exports)

---

## User Experience Principles

**Visual Personality: Professional & Trustworthy**

Salina ERP should convey reliability and competence appropriate for financial and operational management software. The interface should feel like a professional tool that publishers can trust with their business-critical data.

- Clean, structured layouts with clear visual hierarchy
- Professional color palette (avoid playful or consumer-oriented design)
- Data tables optimized for scanning and comparison
- Consistent component design across modules
- Desktop-first optimization (primary users work at desks)

**Interaction Philosophy: Guided Workflows**

Complex operations (title creation, order entry, royalty setup) should guide users through required steps rather than presenting overwhelming forms. The system should be approachable for occasional users while efficient for daily power users.

- Wizard-based workflows for multi-step processes
- Contextual help and field-level guidance
- Progressive disclosure (show advanced options only when needed)
- Validation and error prevention (not just error handling)
- Clear save states and progress indicators

**Navigation Model: Module-Based**

Users mentally organize work by functional area (Titles, Orders, Inventory, etc.). Navigation should reflect this natural grouping.

- Top-level navigation by module: Titles, Customers, Orders, Inventory, Production, Reports, Settings
- Each module has consistent sub-navigation for related functions
- Dashboard provides cross-module overview for Publishers/Owners
- Breadcrumb trails for orientation within deep workflows
- Global search for quick access across modules

**Mobile Considerations**

While desktop-first, certain workflows benefit from mobile access:
- Warehouse operations (inventory checks, simple adjustments)
- Order status checking
- Dashboard viewing for owners on-the-go
- Responsive design for tablet use (not mobile-first development)

### Key Interactions

**Title Creation (Most Important Workflow)**

Creating a new title is the cornerstone operation that touches metadata, ISBN assignment, contributor relationships, and production setup. This must be smooth and comprehensive.

**Wizard Flow:**
1. **Basic Information**: Title, subtitle, format selection (hardcover/paperback/ebook)
2. **ISBN Assignment**: Auto-suggest next available ISBN from publisher's blocks, allow manual selection, show block utilization
3. **Contributors**: Add authors, illustrators with role and royalty assignment (or defer to later)
4. **Metadata**: BISAC codes, descriptions, keywords, publication date
5. **Pricing**: Retail price, discount schedules, wholesale pricing
6. **Assets**: Upload cover, interior files, marketing materials (optional, can add later)
7. **Review & Create**: Summary view, option to create production project

**Key Principles:**
- Save progress automatically (draft state)
- Allow skipping optional sections and returning later
- Pre-fill intelligent defaults (next ISBN, standard royalty rates, current year)
- Validate ISBN uniqueness across system (not just within tenant)
- Show related actions after creation (create print run, add to production schedule)

**Other Critical Interactions:**

**Order Entry (Sales & Marketing)**
- Quick customer lookup with autocomplete
- Line-item addition with real-time inventory check
- Pricing rules applied automatically with manual override
- Shipping calculation via EasyPost integration
- One-click order confirmation and pick list generation

**Pick/Pack (Warehouse)**
- Daily pick list grouped by order
- Barcode scanning support for SKU verification
- Simple inventory deduction workflow
- Shipping label generation via EasyPost
- Mark shipped with tracking number capture

**Inventory Adjustments (Warehouse)**
- Quick adjustment form (SKU, quantity, reason, location)
- Print run receipt wizard (quantities, costs, freight allocation)
- Low-stock alert dashboard
- Cycle count workflow with variance tracking

**Dashboard (Publisher/Owner)**
- At-a-glance metrics: sales today/this week/this month, pending orders, low stock alerts, upcoming production milestones
- Sales trend charts by title and channel
- Quick actions: create title, enter order, view reports
- Recent activity feed across all modules

---

## Functional Requirements

### Tenant & Subscription Management

**FR1:** Prospective publishers can sign up for Salina ERP with self-service registration
**FR2:** System can provision new tenant with isolated database schema and configuration
**FR3:** Tenants can configure branding (logo, colors, email templates)
**FR4:** Tenants can set timezone, locale, default currency, and measurement units
**FR5:** System supports tiered subscription plans with feature access controls
**FR6:** Tenants can upgrade or downgrade subscription tiers
**FR7:** System tracks usage metrics for billing purposes (titles, users, orders)
**FR8:** Tenants can export complete data dump (JSON/CSV) at any time
**FR9:** System performs automated backups per tenant with point-in-time restore capability

### User Management & Access Control

**FR10:** Publisher/Owner can invite users via email with role assignment
**FR11:** Invited users receive email with account activation link
**FR12:** Users can accept invitation and complete profile setup
**FR13:** System enforces role-based permissions for 8 user types: Publisher/Owner, Managing Editor, Production Staff, Sales & Marketing, Warehouse/Operations, Accounting, Author, Illustrator
**FR14:** Publisher/Owner can view audit trail of user actions on sensitive data
**FR15:** Publisher/Owner can deactivate or reactivate user accounts
**FR16:** Users can update their own profile and contact information
**FR17:** System enforces field-level permissions based on role (e.g., Sales sees price but not cost)

### ISBN Block Management

**FR18:** Publishers can enter ISBN prefix for a new block
**FR19:** System generates full ISBN range (00-99) with auto-calculated check digits using Modulo 10 algorithm
**FR20:** System stores each ISBN in block with available/assigned status
**FR21:** System validates ISBN uniqueness across all tenants globally
**FR22:** Publishers can view ISBN block utilization (e.g., "45 of 100 used")
**FR23:** System alerts publishers when ISBN block nearing exhaustion (5 remaining)
**FR24:** Publishers can reserve ISBNs for future titles before full title creation
**FR25:** System supports multiple ISBN blocks per publisher
**FR26:** Publishers can manually assign specific ISBN from available pool when creating title

### Title & Metadata Management

**FR27:** Users can create new title records with basic information (title, subtitle, format)
**FR28:** System guides users through multi-step title creation wizard
**FR29:** System auto-suggests next available ISBN during title creation
**FR30:** Users can create multiple formats for single title (hardcover, paperback, ebook)
**FR31:** Each format receives unique ISBN assignment
**FR32:** Users can add BISAC subject codes to titles
**FR33:** Users can enter sales metadata (descriptions, keywords, target audience)
**FR34:** Users can upload and link assets (cover images, interior PDFs, marketing files)
**FR35:** Users can set pricing per format (retail price, wholesale price, discount schedules)
**FR36:** System saves title creation progress automatically as draft
**FR37:** Users can edit existing title metadata
**FR38:** Users can view complete title record with all formats and metadata
**FR39:** Users can search titles by keyword, ISBN, author, or BISAC code
**FR40:** System tracks publication dates and title status (forthcoming, active, out-of-print)

### Contributor Management

**FR41:** Users can add contributors (authors, illustrators) to title records
**FR42:** Users can specify contributor roles and contribution percentage
**FR43:** System stores contributor contact information
**FR44:** Contributors can be linked to multiple titles
**FR45:** Users can view all titles associated with a contributor
**FR46:** Authors and Illustrators can log in to view their own title associations
**FR47:** Authors and Illustrators can update their own contact information

### Customer Management

**FR48:** Users can create customer records (bookstores, schools, libraries, consumers)
**FR49:** Users can categorize customers by type (retail, wholesale, educational, consumer)
**FR50:** Users can store customer shipping and billing addresses
**FR51:** Users can assign customer-specific pricing rules and discount schedules
**FR52:** Users can view customer order history and purchase patterns
**FR53:** Users can search customers by name, type, or location

### Inventory Management

**FR54:** System tracks inventory quantity per SKU and location
**FR55:** Users can record print run receipts (quantity, printer, cost, freight)
**FR56:** System calculates moving average unit cost per SKU
**FR57:** Users can perform inventory adjustments with reason codes
**FR58:** System maintains inventory transaction history (receipts, shipments, adjustments, returns)
**FR59:** System alerts users when SKU inventory falls below threshold
**FR60:** Users can view current inventory levels across all SKUs and locations
**FR61:** Users can view inventory value based on moving average cost
**FR62:** System supports multiple inventory locations per publisher

### Order Management

**FR63:** Users can create manual sales orders with customer selection
**FR64:** Users can add line items to orders with SKU selection
**FR65:** System checks real-time inventory availability during order entry
**FR66:** System applies pricing rules and customer-specific discounts automatically
**FR67:** Users can override automatic pricing with manual adjustments
**FR68:** Users can import orders from Shopify automatically
**FR69:** System syncs order status back to Shopify
**FR70:** Users can view order pipeline and fulfillment queue
**FR71:** Users can edit orders before fulfillment
**FR72:** System prevents editing orders after shipment

### Fulfillment & Shipping

**FR73:** Warehouse users can view daily pick lists grouped by order
**FR74:** System supports barcode scanning for SKU verification during pick/pack
**FR75:** Users can generate shipping labels via EasyPost integration
**FR76:** System calculates shipping rates in real-time via EasyPost
**FR77:** Users can mark orders as shipped with tracking number
**FR78:** System deducts inventory upon shipment confirmation
**FR79:** Customers receive shipping confirmation with tracking information
**FR80:** Users can view shipment status and tracking history

### Returns Management

**FR81:** Users can record customer returns with reason codes
**FR82:** System creates credit memo for returned items
**FR83:** System adjusts inventory for returned items (add back to stock or mark damaged)
**FR84:** Users can apply return credits to customer account or issue refund
**FR85:** Users can view returns history by customer and title

### Integrations

**FR86:** Publishers can configure Shopify integration with API credentials
**FR87:** System imports Shopify orders automatically on schedule or real-time
**FR88:** System syncs inventory levels to Shopify
**FR89:** System monitors Shopify integration health and notifies on errors
**FR90:** Publishers can configure QuickBooks integration with authentication
**FR91:** System generates QuickBooks export files (CSV/IIF format) for sales, COGS, inventory
**FR92:** Users can map Salina accounts to QuickBooks chart of accounts
**FR93:** System exports accounting data on daily or weekly schedule
**FR94:** Publishers can configure EasyPost integration with API credentials
**FR95:** System calculates shipping rates via EasyPost API
**FR96:** System generates shipping labels via EasyPost
**FR97:** System retrieves tracking information via EasyPost
**FR98:** System stores integration credentials encrypted at rest
**FR99:** System uses OAuth flows for third-party service authorization where applicable

### Dashboards & Reporting

**FR100:** Publisher/Owner can view dashboard with key metrics (sales, orders, inventory alerts)
**FR101:** Users can view sales reports by title, channel, customer type, and date range
**FR102:** Users can view inventory status reports with stock levels and locations
**FR103:** Users can view customer purchase reports
**FR104:** Users can export reports to CSV format
**FR105:** Dashboard displays recent activity feed across all modules
**FR106:** Dashboard provides quick actions for common tasks (create title, enter order)

### System Administration

**FR107:** Publisher/Owner can configure company information and preferences
**FR108:** System provides guided onboarding wizard for new tenants
**FR109:** System includes contextual help and documentation
**FR110:** Users can import titles from CSV for data migration
**FR111:** Users can import customers from CSV for data migration
**FR112:** Users can import inventory from CSV for data migration
**FR113:** System maintains audit logs for sensitive operations
**FR114:** Publisher/Owner can view system usage statistics

---

## Growth Features (Post-MVP Functional Requirements)

### Contracts & Royalties

**FR115:** Users can create contract records for contributors
**FR116:** Users can define royalty rules per contract (percentage, flat rate, sliding scale)
**FR117:** Users can specify royalty rates by format and sales channel
**FR118:** Users can record advance payments and track recoupment
**FR119:** System calculates royalties automatically based on sales and returns
**FR120:** System accounts for advance recoupment in royalty calculations
**FR121:** System generates royalty statements in PDF format
**FR122:** Contributors can view their royalty statements online
**FR123:** Contributors can download historical royalty statements
**FR124:** Users can export royalty payment summaries for accounting
**FR125:** System creates accounting entries for royalty expenses and payables

### Production & Scheduling

**FR126:** Users can create production projects for titles
**FR127:** Users can define production milestones (editorial, design, proofing, final files)
**FR128:** Users can assign tasks to team members with due dates
**FR129:** Users can view production timeline in Gantt chart format
**FR130:** Users can view production tasks in Kanban board format
**FR131:** Users can track production costs (editing, design, art, prepress)
**FR132:** Users can upload file versions for production assets
**FR133:** Users can view production pipeline health and upcoming deadlines
**FR134:** System alerts users to overdue production tasks

### ONIX & Metadata Export

**FR135:** System exports title metadata in ONIX 3.0 format
**FR136:** Users can export metadata to CSV for distributors
**FR137:** Users can perform batch metadata updates across multiple titles
**FR138:** System validates ONIX export compliance with industry standards

### Advanced Analytics

**FR139:** Users can view title P&L reports (production costs + sales + royalties)
**FR140:** Users can view contributor earnings and liability reports
**FR141:** Users can view inventory aging analysis
**FR142:** Users can calculate months of supply for inventory planning
**FR143:** Users can view cash flow projections
**FR144:** System provides production pipeline health metrics

---

## Non-Functional Requirements

### Performance

**Response Time Requirements:**
- Page loads complete within 2 seconds under normal load
- Dashboard initial render within 1.5 seconds
- Real-time inventory checks return within 500ms
- Order entry form interactions feel instant (sub-200ms)
- Search and autocomplete results appear within 500ms
- Report generation for standard date ranges (1 month) completes within 5 seconds
- Large reports (annual, multi-title) can run asynchronously with progress indication

**Background Processing:**
- Shopify order imports process within 5 minutes of order creation
- QuickBooks export generation completes within 10 minutes for daily batches
- Royalty calculation batch jobs complete within reasonable timeframes (minutes, not hours)
- Email notifications send within 2 minutes of triggering event

**Database Performance:**
- Database queries optimized with appropriate indexes
- N+1 query problems eliminated in high-traffic views
- Connection pooling prevents resource exhaustion

**Asset Handling:**
- Image uploads (covers) complete within 10 seconds for files up to 10MB
- File uploads (PDFs, marketing assets) support files up to 50MB
- Asset delivery via CDN for fast global access

### Security

**Authentication & Authorization:**
- Secure password requirements (minimum length, complexity)
- Two-factor authentication (2FA) available for all users, required for Publisher/Owner role
- Session timeout after 4 hours of inactivity
- Automatic logout on browser close option
- Password reset via email with time-limited tokens
- Role-based access control (RBAC) enforced at API and database layers

**Data Encryption:**
- All data encrypted in transit using TLS 1.3 or higher
- Sensitive data encrypted at rest (integration credentials, financial data)
- Database encryption using industry-standard algorithms (AES-256)
- Encryption key management follows security best practices

**Multi-Tenant Security:**
- Complete data isolation between tenants at database schema level
- Tenant context validated on every request
- No cross-tenant data leakage possible
- SQL injection prevention through parameterized queries
- CSRF protection on all state-changing operations
- XSS prevention through output encoding

**Integration Security:**
- Third-party API credentials stored encrypted
- OAuth tokens refreshed securely
- Webhook endpoints authenticated with signatures
- API rate limiting to prevent abuse
- Integration credentials scoped to minimum required permissions

**Audit & Compliance:**
- Audit logging for sensitive operations (user logins, financial exports, contract modifications, royalty calculations)
- Audit logs immutable and retained for minimum 7 years
- User activity tracking for security investigations
- Compliance with data protection regulations (GDPR, CCPA where applicable)
- Right to data portability (full export capability)
- Right to deletion (account and data removal on request)

**Security Monitoring:**
- Failed login attempt tracking with account lockout after 5 failures
- Suspicious activity detection and alerting
- Regular security vulnerability scanning
- Dependency updates for known CVEs

### Scalability

**Tenant Scaling:**
- Support 1,000+ concurrent tenants on shared infrastructure
- Horizontal scaling for application servers
- Database read replicas for read-heavy operations
- Background job processing distributed across workers

**Per-Tenant Capacity:**
- Support publishers with 50-5,000 titles per tenant
- Handle 5-100 users per tenant
- Process 100-10,000 orders per month per tenant
- Support inventory across 1-50 locations per tenant

**Growth Handling:**
- System can scale to accommodate 10x current load
- Database sharding strategy planned for future growth
- Caching layers (Redis) for frequently accessed data
- CDN for static assets and file downloads

**Peak Load Handling:**
- Handle 5x average load during peak periods (e.g., holiday seasons)
- Queue-based processing for batch operations prevents system overload
- Graceful degradation if external services (Shopify, EasyPost) experience downtime

### Availability & Reliability

**Uptime:**
- Target 99.5% uptime (approximately 3.6 hours downtime per month)
- Planned maintenance windows communicated 48 hours in advance
- Maintenance windows scheduled during low-traffic periods

**Backup & Recovery:**
- Automated daily backups per tenant
- Point-in-time recovery capability (restore to any point within 30 days)
- Backup retention for 90 days minimum
- Disaster recovery plan with RTO (Recovery Time Objective) of 4 hours
- RPO (Recovery Point Objective) of 1 hour maximum data loss

**Error Handling:**
- Graceful error messages (no stack traces exposed to users)
- Retry logic for transient failures (API calls, network issues)
- Circuit breakers for external service dependencies
- Failed background jobs logged and retried with exponential backoff

### Integration Reliability

**Shopify Integration:**
- Order import failures logged and retried automatically
- Manual retry capability for failed imports
- Webhook validation to prevent invalid data
- Sync status dashboard showing last successful import

**QuickBooks Integration:**
- Export generation validated before delivery
- Failed exports logged with clear error messages
- Export history maintained for audit trail
- Manual re-export capability

**EasyPost Integration:**
- Shipping rate lookup failures handled gracefully with retry
- Label generation failures reported immediately to user
- Carrier service outages detected and communicated
- Alternative carrier selection if primary unavailable

**General Integration Principles:**
- API calls timeout after 30 seconds with user notification
- Rate limiting respected to prevent API quota exhaustion
- Integration health monitoring with status dashboard
- Error notifications sent to Publisher/Owner for critical failures

---

---

## PRD Summary

**Requirements Captured:**
- 144 functional requirements (114 MVP + 30 Growth features)
- Comprehensive non-functional requirements (Performance, Security, Scalability, Availability, Integration Reliability)
- 8 user roles with detailed permission model
- 3 critical integrations (Shopify, QuickBooks, EasyPost) for MVP
- Multi-tenant SaaS architecture with complete data isolation

**Product Value:**

_This PRD captures the essence of Salina Bookshelf ERP - a purpose-built publishing operations platform that eliminates spreadsheet chaos and unifies title management, inventory, orders, and accounting for small and midsize publishers. By speaking the language of publishing (ISBNs, contributors, BISAC, royalties, ONIX) and integrating critical services (Shopify, QuickBooks, EasyPost), Salina ERP enables publishers to scale their operations confidently without proportional overhead._

---

_Created through collaborative discovery between BMad and AI facilitator Mary._
_Version 1.0 - 2025-11-17_
