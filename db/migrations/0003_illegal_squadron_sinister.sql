CREATE TABLE "tenant_features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id_ref" uuid NOT NULL,
	"feature_key" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"metadata" text,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_features_tenant_id_feature_key_unique" UNIQUE("tenant_id","feature_key")
);
--> statement-breakpoint
ALTER TABLE "tenant_features" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tenant_features" ADD CONSTRAINT "tenant_features_tenant_id_ref_tenants_id_fk" FOREIGN KEY ("tenant_id_ref") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "tenant_features_tenant_isolation" ON "tenant_features" AS PERMISSIVE FOR ALL TO "authenticated" USING (
        CASE
          WHEN current_setting('app.current_tenant_id', true) = '' THEN false
          ELSE tenant_id = current_setting('app.current_tenant_id', true)::uuid
        END
      );