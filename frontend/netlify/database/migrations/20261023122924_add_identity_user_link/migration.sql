ALTER TABLE "users" ADD COLUMN "identity_id" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_identity_id_key" UNIQUE("identity_id");