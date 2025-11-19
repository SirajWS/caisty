// webhooks.ts
import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";

export const webhooks = pgTable("webhooks", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").notNull(),
  provider: text("provider").notNull(),
  eventType: text("event_type").notNull(),
  status: text("status").notNull(),
  payload: jsonb("payload").notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});
