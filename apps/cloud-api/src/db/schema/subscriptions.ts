import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { orgs } from "./orgs";
import { customers } from "./customers";

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),

    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),

    plan: varchar("plan", { length: 50 }).notNull(), // starter / pro
    status: varchar("status", { length: 50 }).notNull().default("active"), // active/canceled/trialing

    priceCents: integer("price_cents").notNull().default(0),
    currency: varchar("currency", { length: 3 }).notNull().default("EUR"),

    // ✅ Provider Felder (neu)
    provider: varchar("provider", { length: 20 }), // 'paypal' | 'stripe' (nullable for migration)
    providerEnv: varchar("provider_env", { length: 10 }), // 'test' | 'live'
    providerCustomerId: text("provider_customer_id"),
    providerSubscriptionId: text("provider_subscription_id"),

    startedAt: timestamp("started_at").notNull().defaultNow(),
    currentPeriodStart: timestamp("current_period_start"),
    currentPeriodEnd: timestamp("current_period_end"),

    cancelAtPeriodEnd: integer("cancel_at_period_end").notNull().default(0), // 0/1 (boolean-like)
    canceledAt: timestamp("canceled_at"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    uqProviderSub: uniqueIndex("uq_subscriptions_provider_env_sub_id").on(
      t.provider,
      t.providerEnv,
      t.providerSubscriptionId
    ),
  })
);
