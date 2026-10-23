import { pgTable, serial, varchar, integer, numeric, timestamp, index, type AnyPgColumn } from "drizzle-orm/pg-core";

const money = (name: string) => numeric(name, { precision: 18, scale: 2, mode: "number" });
const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

export const users = pgTable("users", {
  id: serial().primaryKey(),
  identityId: varchar("identity_id", { length: 100 }).unique(),
  fullName: varchar("full_name", { length: 120 }).notNull(),
  email: varchar({ length: 150 }).notNull().unique(),
  phone: varchar({ length: 20 }).notNull().default(""),
  passwordHash: varchar("password_hash", { length: 250 }).notNull(),
  role: varchar({ length: 20 }).notNull().default("Associate"), // Admin | Associate
  status: varchar({ length: 20 }).notNull().default("Active"), // Active | Blocked
  parentUserId: integer("parent_user_id").references((): AnyPgColumn => users.id, { onDelete: "set null" }),
  profilePhoto: varchar("profile_photo", { length: 300 }),
  designation: varchar({ length: 50 }),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2, mode: "number" }).notNull().default(5),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const persons = pgTable("persons", {
  id: serial().primaryKey(),
  fullName: varchar("full_name", { length: 120 }).notNull(),
  phone: varchar({ length: 20 }).notNull(),
  email: varchar({ length: 150 }),
  address: varchar({ length: 300 }),
  idProofNumber: varchar("id_proof_number", { length: 50 }),
  status: varchar({ length: 20 }).notNull().default("Active"), // Active | Inactive
  notes: varchar({ length: 500 }),
  registeredById: integer("registered_by_id").notNull().references(() => users.id),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [index("persons_phone_idx").on(t.phone), index("persons_registered_by_idx").on(t.registeredById)]);

export const plots = pgTable("plots", {
  id: serial().primaryKey(),
  plotNo: varchar("plot_no", { length: 30 }).notNull().unique(),
  project: varchar({ length: 100 }).notNull(),
  block: varchar({ length: 50 }),
  sizeSqFt: numeric("size_sq_ft", { precision: 12, scale: 2, mode: "number" }).notNull(),
  price: money("price").notNull(),
  status: varchar({ length: 20 }).notNull().default("Available"), // Available | Sold | Blocked
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const sales = pgTable("sales", {
  id: serial().primaryKey(),
  personId: integer("person_id").notNull().references(() => persons.id),
  plotId: integer("plot_id").notNull().references(() => plots.id),
  dealAmount: money("deal_amount").notNull(),
  saleDate: ts("sale_date").notNull(),
  status: varchar({ length: 20 }).notNull().default("InProgress"), // InProgress | Completed | Cancelled
  registeredById: integer("registered_by_id").notNull().references(() => users.id),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [index("sales_registered_by_idx").on(t.registeredById)]);

export const payments = pgTable("payments", {
  id: serial().primaryKey(),
  saleId: integer("sale_id").notNull().references(() => sales.id, { onDelete: "cascade" }),
  amount: money("amount").notNull(),
  paymentType: varchar("payment_type", { length: 20 }).notNull().default("Received"), // Received | Advance
  method: varchar({ length: 20 }).notNull().default("BankTransfer"),
  status: varchar({ length: 20 }).notNull().default("Pending"), // Pending | Approved | Rejected
  paidAt: ts("paid_at").notNull().defaultNow(),
  notes: varchar({ length: 300 }),
  verifiedById: integer("verified_by_id").references(() => users.id, { onDelete: "set null" }),
  verifiedAt: ts("verified_at"),
}, (t) => [index("payments_sale_idx").on(t.saleId)]);

export const commissions = pgTable("commissions", {
  id: serial().primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  saleId: integer("sale_id").references(() => sales.id, { onDelete: "set null" }),
  amount: money("amount").notNull(),
  rate: numeric({ precision: 5, scale: 2, mode: "number" }).notNull(),
  status: varchar({ length: 20 }).notNull().default("Pending"), // Pending | Approved | Paid | Rejected
  requestedAt: ts("requested_at").notNull().defaultNow(),
  approvedAt: ts("approved_at"),
  approvedById: integer("approved_by_id").references(() => users.id, { onDelete: "set null" }),
}, (t) => [index("commissions_user_idx").on(t.userId)]);

export const siteVisits = pgTable("site_visits", {
  id: serial().primaryKey(),
  personId: integer("person_id").notNull().references(() => persons.id),
  plotId: integer("plot_id").references(() => plots.id, { onDelete: "set null" }),
  visitDate: ts("visit_date").notNull(),
  notes: varchar({ length: 500 }),
  status: varchar({ length: 20 }).notNull().default("Completed"), // Scheduled | Completed | Cancelled
  createdById: integer("created_by_id").notNull().references(() => users.id),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const siteVisitPhotos = pgTable("site_visit_photos", {
  id: serial().primaryKey(),
  siteVisitId: integer("site_visit_id").notNull().references(() => siteVisits.id, { onDelete: "cascade" }),
  filePath: varchar("file_path", { length: 300 }).notNull(),
  caption: varchar({ length: 200 }),
  uploadedById: integer("uploaded_by_id").notNull(),
  uploadedAt: ts("uploaded_at").notNull().defaultNow(),
}, (t) => [index("site_visit_photos_visit_idx").on(t.siteVisitId)]);

export type User = typeof users.$inferSelect;
export type Person = typeof persons.$inferSelect;
export type Plot = typeof plots.$inferSelect;
export type Sale = typeof sales.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Commission = typeof commissions.$inferSelect;
export type SiteVisit = typeof siteVisits.$inferSelect;
export type SiteVisitPhoto = typeof siteVisitPhotos.$inferSelect;
