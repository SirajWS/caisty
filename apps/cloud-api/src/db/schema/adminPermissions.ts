// apps/cloud-api/src/db/schema/adminPermissions.ts
import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { adminUsers } from "./adminUsers";

export const adminPermissions = pgTable("admin_permissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  adminUserId: uuid("admin_user_id")
    .notNull()
    .references(() => adminUsers.id, { onDelete: "cascade" })
    .unique(), // Ein Permission-Set pro User
  
  canManageCustomers: boolean("can_manage_customers").notNull().default(false),
  canManageSubscriptions: boolean("can_manage_subscriptions").notNull().default(false),
  canManageInvoices: boolean("can_manage_invoices").notNull().default(false),
  canAccessTechnicalSettings: boolean("can_access_technical_settings").notNull().default(false),
  
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type AdminPermission = InferSelectModel<typeof adminPermissions>;
export type NewAdminPermission = InferInsertModel<typeof adminPermissions>;

