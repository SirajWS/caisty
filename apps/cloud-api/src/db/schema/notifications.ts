import { pgTable, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),

  orgId: text("org_id").notNull(),

  type: text("type").notNull(), 
  // z.B. "portal_signup", "portal_trial_created", "portal_support_message"

  title: text("title").notNull(),
  body: text("body"),

  customerId: text("customer_id"),
  licenseId: text("license_id"),

  data: jsonb("data"), // extra Infos (email, plan, etc.)

  isRead: boolean("is_read").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export type Notification = typeof notifications.$inferSelect;
