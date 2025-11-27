import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const supportMessages = pgTable("support_messages", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: text("org_id").notNull(),
  customerId: text("customer_id"),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
