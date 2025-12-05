// apps/cloud-api/src/db/schema/customerAuthProviders.ts
import { pgTable, uuid, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { customers } from "./customers";

export const customerAuthProviders = pgTable(
  "customer_auth_providers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    
    provider: text("provider").notNull(), // 'password' | 'google'
    
    // Bei Google: sub (Subject ID von Google)
    providerUserId: text("provider_user_id"),
    
    // E-Mail vom Provider (für Matching)
    providerEmail: text("provider_email"),
    
    // Zusätzliche Provider-Daten (z.B. Google Profile Picture)
    providerData: text("provider_data"), // JSON als String
    
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    // Eindeutige Kombination: Ein Provider-User kann nur einmal verknüpft sein
    uniqProviderUser: uniqueIndex("uniq_provider_user")
      .on(table.provider, table.providerUserId),
  })
);

export type CustomerAuthProvider = typeof customerAuthProviders.$inferSelect;
export type NewCustomerAuthProvider = typeof customerAuthProviders.$inferInsert;

