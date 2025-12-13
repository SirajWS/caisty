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
import { subscriptions } from "./subscriptions";

export const invoices = pgTable(
  "invoices",
  {
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

    // legacy
    amountCents: integer("amount_cents").notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("EUR"),

    // ✅ neu
    provider: varchar("provider", { length: 20 }), // paypal|stripe
    providerEnv: varchar("provider_env", { length: 10 }), // test|live
    providerInvoiceId: text("provider_invoice_id"),

    amountNetCents: integer("amount_net_cents"),
    amountTaxCents: integer("amount_tax_cents"),
    amountGrossCents: integer("amount_gross_cents"),

    pdfUrl: text("pdf_url"),
    paidAt: timestamp("paid_at"),

    status: varchar("status", { length: 50 }).notNull().default("open"), // draft/open/paid/canceled
    issuedAt: timestamp("issued_at").notNull().defaultNow(),
    dueAt: timestamp("due_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    uqProviderInvoice: uniqueIndex("uq_invoices_provider_env_invoice_id").on(
      t.provider,
      t.providerEnv,
      t.providerInvoiceId
    ),
  })
);
