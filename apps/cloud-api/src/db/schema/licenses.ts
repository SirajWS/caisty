import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const licenses = pgTable("licenses", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  orgId: text("org_id").notNull(),

  // customerId jetzt OPTIONAL (kein .notNull())
  customerId: text("customer_id"),

  // optional: an Subscription hängen
  subscriptionId: text("subscription_id"),

  // z.B. CSTY-ABCD-EFGH-IJKL
  key: text("key").notNull().unique(),

  // z.B. "starter", "pro", "enterprise"
  plan: text("plan").notNull(),

  maxDevices: integer("max_devices").notNull().default(1),

  status: text("status").notNull().default("active"),
  validFrom: timestamp("valid_from", { withTimezone: true })
    .notNull()
    .defaultNow(),
  validUntil: timestamp("valid_until", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type License = typeof licenses.$inferSelect;
export type NewLicense = typeof licenses.$inferInsert;
