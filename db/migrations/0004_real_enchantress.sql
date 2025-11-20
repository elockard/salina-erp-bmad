CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"role" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"last_login" timestamp,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "users_tenant_isolation" ON "users" AS PERMISSIVE FOR ALL TO "authenticated" USING (
        CASE
          WHEN current_setting('app.current_tenant_id', true) = '' THEN false
          ELSE tenant_id = current_setting('app.current_tenant_id', true)::uuid
        END
      );