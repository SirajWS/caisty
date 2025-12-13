import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  varchar,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const webhooks = pgTable(
  "webhooks",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    orgId: uuid("org_id").notNull(),
    provider: varchar("provider", { length: 20 }).notNull(), // paypal|stripe

    // ✅ neu
    providerEnv: varchar("provider_env", { length: 10 }), // test|live
    eventId: text("event_id"), // unique per provider/env, wenn vorhanden

    eventType: text("event_type").notNull(),
    status: text("status").notNull(), // pending|ok|failed (oder euer aktueller)

    payload: jsonb("payload").notNull(),

    errorMessage: text("error_message"),

    processedAt: timestamp("processed_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    uqWebhookEvent: uniqueIndex("uq_webhooks_provider_env_event_id").on(
      t.provider,
      t.providerEnv,
      t.eventId
    ),
  })
);
