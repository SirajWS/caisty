import {
  pgTable,
  text,
  integer,
  timestamp,
  uuid,
  varchar,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    orgId: uuid("org_id").notNull(),
    customerId: uuid("customer_id").notNull(),
    subscriptionId: uuid("subscription_id").notNull(),

    provider: varchar("provider", { length: 20 }).notNull(), // paypal|stripe
    providerEnv: varchar("provider_env", { length: 10 }), // test|live (nullable for migration)
    providerPaymentId: text("provider_payment_id"),
    providerStatus: text("provider_status"),

    // legacy
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull(),
    status: text("status").notNull(),

    // ✅ neu (VAT split)
    amountNetCents: integer("amount_net_cents"),
    amountTaxCents: integer("amount_tax_cents"),
    amountGrossCents: integer("amount_gross_cents"),

    failureCode: text("failure_code"),
    failureMessage: text("failure_message"),

    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    uqProviderPayment: uniqueIndex("uq_payments_provider_env_payment_id").on(
      t.provider,
      t.providerEnv,
      t.providerPaymentId
    ),
  })
);
