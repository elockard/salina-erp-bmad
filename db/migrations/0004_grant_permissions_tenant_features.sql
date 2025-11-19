-- Grant permissions on tenant_features table to authenticated role
-- This allows the RLS-protected queries to INSERT, UPDATE, DELETE data
-- Story 1.5: Build Tenant Provisioning Workflow

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE tenant_features TO authenticated;
