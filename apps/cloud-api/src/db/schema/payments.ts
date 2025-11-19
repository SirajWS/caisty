// payments.ts
import { pgTable, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").notNull(),
  customerId: uuid("customer_id").notNull(),
  subscriptionId: uuid("subscription_id").notNull(),
  provider: text("provider").notNull(),
  providerPaymentId: text("provider_payment_id"),
  providerStatus: text("provider_status"),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
