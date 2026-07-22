// apps/cloud-api/src/db/schema/customers.ts
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  text,
} from "drizzle-orm/pg-core";
import { orgs } from "./orgs";

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),

  orgId: uuid("org_id").references(() => orgs.id, {
    onDelete: "set null",
  }),

  // Display-Name im Cloud-Admin (kann aus POS überschrieben werden)
  name: varchar("name", { length: 255 }).notNull(),

  // Primäre Kontakt-Mail (Cloud-Login / Billing)
  email: varchar("email", { length: 255 }).notNull(),

  status: varchar("status", { length: 50 }).notNull().default("active"),

  // 🔐 Portal-Login
  passwordHash: text("password_hash"),

  // Status im Portal (z.B. active, blocked, cancelled)
  portalStatus: varchar("portal_status", { length: 50 })
    .notNull()
    .default("active"),

  // JSON-Profil, das vom POS kommt (Cloud Customer / Account)
  // Struktur ist bewusst flexibel gehalten.
  profile: jsonb("profile").notNull().default({}),

  /** Stripe Customer ID (cus_...) after Checkout / Portal; used for Billing Portal sessions */
  stripeCustomerId: text("stripe_customer_id"),

  /** Set when the customer confirmed their email (null = must verify before password login). */
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Praktische Typen
export type CustomerRow = typeof customers.$inferSelect;
export type NewCustomerRow = typeof customers.$inferInsert;
