import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { orgs } from "./orgs";

export const billingCustomers = pgTable(
  "billing_customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),

    email: text("email"),
    provider: varchar("provider", { length: 20 }).notNull(), // 'paypal' | 'stripe'
    providerEnv: varchar("provider_env", { length: 10 }).notNull(), // 'test' | 'live'
    providerCustomerId: text("provider_customer_id").notNull(),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    uqProviderCustomer: uniqueIndex("uq_billing_customers_provider_env_customer").on(
      t.provider,
      t.providerEnv,
      t.providerCustomerId
    ),
    uqOrgProviderEnv: uniqueIndex("uq_billing_customers_org_provider_env").on(
      t.orgId,
      t.provider,
      t.providerEnv
    ),
  })
);

