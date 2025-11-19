ALTER POLICY "tenants_tenant_isolation" ON "tenants" TO authenticated USING (
        CASE
          WHEN current_setting('app.current_tenant_id', true) = '' THEN false
          ELSE tenant_id = current_setting('app.current_tenant_id', true)::uuid
        END
      );