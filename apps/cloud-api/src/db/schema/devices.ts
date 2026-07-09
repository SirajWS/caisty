import { pgTable, uuid, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { orgs } from "./orgs";
import { customers } from "./customers";

export const devices = pgTable("devices", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => orgs.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),
  name: varchar("name", { length: 255 }).notNull(), // z.B. Kasse 1
  type: varchar("type", { length: 50 }).notNull().default("pos"), // pos / kiosk / etc.
  status: varchar("status", { length: 50 }).notNull().default("active"),
  lastSeenAt: timestamp("last_seen_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // 🔽 neue Spalten für M5
  licenseId: text("license_id"),
  fingerprint: text("fingerprint"),
  lastHeartbeatAt: timestamp("last_heartbeat_at", { withTimezone: true }),
  appVersion: varchar("app_version", { length: 64 }),
  lastSalesSyncAt: timestamp("last_sales_sync_at", { withTimezone: true }),
  offlineQueueCount: integer("offline_queue_count").notNull().default(0),
  releasedAt: timestamp("released_at", { withTimezone: true }),
});
