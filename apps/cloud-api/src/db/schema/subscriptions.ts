import {
    pgTable,
    uuid,
    varchar,
    timestamp,
    integer,
  } from "drizzle-orm/pg-core";
  import { orgs } from "./orgs";
  import { customers } from "./customers";
  
  export const subscriptions = pgTable("subscriptions", {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    plan: varchar("plan", { length: 50 }).notNull(), // z.B. starter / pro
    status: varchar("status", { length: 50 }).notNull().default("active"), // active / canceled / trialing
    priceCents: integer("price_cents").notNull().default(0), // monatlicher Preis in Cent
    currency: varchar("currency", { length: 3 }).notNull().default("EUR"),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    currentPeriodEnd: timestamp("current_period_end"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  });
  