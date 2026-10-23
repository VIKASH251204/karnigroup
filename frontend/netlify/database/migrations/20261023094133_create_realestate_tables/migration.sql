CREATE TABLE "commissions" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"sale_id" integer,
	"amount" numeric(18,2) NOT NULL,
	"rate" numeric(5,2) NOT NULL,
	"status" varchar(20) DEFAULT 'Pending' NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_at" timestamp with time zone,
	"approved_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY,
	"sale_id" integer NOT NULL,
	"amount" numeric(18,2) NOT NULL,
	"payment_type" varchar(20) DEFAULT 'Received' NOT NULL,
	"method" varchar(20) DEFAULT 'BankTransfer' NOT NULL,
	"status" varchar(20) DEFAULT 'Pending' NOT NULL,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" varchar(300),
	"verified_by_id" integer,
	"verified_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "persons" (
	"id" serial PRIMARY KEY,
	"full_name" varchar(120) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(150),
	"address" varchar(300),
	"id_proof_number" varchar(50),
	"status" varchar(20) DEFAULT 'Active' NOT NULL,
	"notes" varchar(500),
	"registered_by_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plots" (
	"id" serial PRIMARY KEY,
	"plot_no" varchar(30) NOT NULL UNIQUE,
	"project" varchar(100) NOT NULL,
	"block" varchar(50),
	"size_sq_ft" numeric(12,2) NOT NULL,
	"price" numeric(18,2) NOT NULL,
	"status" varchar(20) DEFAULT 'Available' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" serial PRIMARY KEY,
	"person_id" integer NOT NULL,
	"plot_id" integer NOT NULL,
	"deal_amount" numeric(18,2) NOT NULL,
	"sale_date" timestamp with time zone NOT NULL,
	"status" varchar(20) DEFAULT 'InProgress' NOT NULL,
	"registered_by_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_visit_photos" (
	"id" serial PRIMARY KEY,
	"site_visit_id" integer NOT NULL,
	"file_path" varchar(300) NOT NULL,
	"caption" varchar(200),
	"uploaded_by_id" integer NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_visits" (
	"id" serial PRIMARY KEY,
	"person_id" integer NOT NULL,
	"plot_id" integer,
	"visit_date" timestamp with time zone NOT NULL,
	"notes" varchar(500),
	"status" varchar(20) DEFAULT 'Completed' NOT NULL,
	"created_by_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"full_name" varchar(120) NOT NULL,
	"email" varchar(150) NOT NULL UNIQUE,
	"phone" varchar(20) DEFAULT '' NOT NULL,
	"password_hash" varchar(250) NOT NULL,
	"role" varchar(20) DEFAULT 'Associate' NOT NULL,
	"status" varchar(20) DEFAULT 'Active' NOT NULL,
	"parent_user_id" integer,
	"profile_photo" varchar(300),
	"designation" varchar(50),
	"commission_rate" numeric(5,2) DEFAULT '5' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "commissions_user_idx" ON "commissions" ("user_id");--> statement-breakpoint
CREATE INDEX "payments_sale_idx" ON "payments" ("sale_id");--> statement-breakpoint
CREATE INDEX "persons_phone_idx" ON "persons" ("phone");--> statement-breakpoint
CREATE INDEX "persons_registered_by_idx" ON "persons" ("registered_by_id");--> statement-breakpoint
CREATE INDEX "sales_registered_by_idx" ON "sales" ("registered_by_id");--> statement-breakpoint
CREATE INDEX "site_visit_photos_visit_idx" ON "site_visit_photos" ("site_visit_id");--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_sale_id_sales_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_approved_by_id_users_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_sale_id_sales_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_verified_by_id_users_id_fkey" FOREIGN KEY ("verified_by_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_registered_by_id_users_id_fkey" FOREIGN KEY ("registered_by_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_person_id_persons_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("id");--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_plot_id_plots_id_fkey" FOREIGN KEY ("plot_id") REFERENCES "plots"("id");--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_registered_by_id_users_id_fkey" FOREIGN KEY ("registered_by_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "site_visit_photos" ADD CONSTRAINT "site_visit_photos_site_visit_id_site_visits_id_fkey" FOREIGN KEY ("site_visit_id") REFERENCES "site_visits"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "site_visits" ADD CONSTRAINT "site_visits_person_id_persons_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("id");--> statement-breakpoint
ALTER TABLE "site_visits" ADD CONSTRAINT "site_visits_plot_id_plots_id_fkey" FOREIGN KEY ("plot_id") REFERENCES "plots"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "site_visits" ADD CONSTRAINT "site_visits_created_by_id_users_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_parent_user_id_users_id_fkey" FOREIGN KEY ("parent_user_id") REFERENCES "users"("id") ON DELETE SET NULL;