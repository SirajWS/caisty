// apps/cloud-api/src/db/schema/licenseEvents.ts
import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const licenseEvents = pgTable("license_events", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  orgId: text("org_id").notNull(),
  licenseId: text("license_id").notNull(),

  // z.B. "issued", "activated", "device_bound", "revoked", "heartbeat"
  type: text("type").notNull(),

  metadata: jsonb("metadata")
    .$type<Record<string, unknown>>()
    .default({}),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type LicenseEvent = typeof licenseEvents.$inferSelect;
export type NewLicenseEvent = typeof licenseEvents.$inferInsert;
