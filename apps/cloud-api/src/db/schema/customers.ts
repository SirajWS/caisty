import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { orgs } from "./orgs";

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .references(() => orgs.id, { onDelete: "set null" }), // darf erstmal null sein
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
