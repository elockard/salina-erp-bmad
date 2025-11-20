-- Grant permissions to authenticated role for RLS to work properly
-- The authenticated role needs table-level permissions before RLS policies can filter rows

-- Grant all permissions on users table to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;

-- Grant all permissions on tenants table to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON tenants TO authenticated;

-- Grant all permissions on tenant_features table to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_features TO authenticated;
