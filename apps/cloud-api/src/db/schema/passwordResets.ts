// apps/cloud-api/src/db/schema/passwordResets.ts
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { customers } from "./customers";

export const passwordResets = pgTable("portal_password_resets", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  
  // Token Hash (nicht das rohe Token!)
  tokenHash: text("token_hash").notNull(),
  
  // Ablaufzeitpunkt
  expiresAt: timestamp("expires_at").notNull(),
  
  // Wann wurde der Token verwendet (null = noch nicht verwendet)
  usedAt: timestamp("used_at"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PasswordReset = typeof passwordResets.$inferSelect;
export type NewPasswordReset = typeof passwordResets.$inferInsert;

