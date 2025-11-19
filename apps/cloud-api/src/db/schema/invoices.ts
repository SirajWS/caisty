import {
    pgTable,
    uuid,
    varchar,
    timestamp,
    integer,
  } from "drizzle-orm/pg-core";
  import { orgs } from "./orgs";
  import { customers } from "./customers";
  import { subscriptions } from "./subscriptions";
  
  export const invoices = pgTable("invoices", {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    subscriptionId: uuid("subscription_id").references(() => subscriptions.id, {
      onDelete: "set null",
    }),
    number: varchar("number", { length: 50 }).notNull().unique(), // INV-2025-0001
    amountCents: integer("amount_cents").notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("EUR"),
    status: varchar("status", { length: 50 })
      .notNull()
      .default("open"), // draft/open/paid/canceled
    issuedAt: timestamp("issued_at").notNull().defaultNow(),
    dueAt: timestamp("due_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  });
  