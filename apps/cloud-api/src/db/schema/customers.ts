// apps/api/src/db/schema/customers.ts
import { pgTable, uuid, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
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

  // JSON-Profil, das vom POS kommt (Cloud Customer / Account)
  // Struktur ist bewusst flexibel gehalten.
  profile: jsonb("profile")
    .notNull()
    .default({}),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Praktische Typen
export type CustomerRow = typeof customers.$inferSelect;
export type NewCustomerRow = typeof customers.$inferInsert;
