// apps/cloud-api/src/db/schema/adminPasswordResets.ts
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { adminUsers } from "./adminUsers";

export const adminPasswordResets = pgTable("admin_password_resets", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  adminUserId: uuid("admin_user_id")
    .notNull()
    .references(() => adminUsers.id, { onDelete: "cascade" }),
  
  tokenHash: text("token_hash").notNull(), // SHA256 Hash des Tokens
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }), // Wann der Token verwendet wurde
  
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type AdminPasswordReset = InferSelectModel<typeof adminPasswordResets>;
export type NewAdminPasswordReset = InferInsertModel<typeof adminPasswordResets>;

