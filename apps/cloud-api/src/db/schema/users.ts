// apps/cloud-api/src/db/schema/users.ts
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { orgs } from "./orgs";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),

  orgId: uuid("org_id")
    .notNull()
    .references(() => orgs.id, { onDelete: "cascade" }),

  email: text("email").notNull().unique(),

  // Kommt in Schritt 2 für Login richtig zum Einsatz (bcrypt etc.)
  passwordHash: text("password_hash").notNull(),

  // Rollen: owner = Super-Admin der Org, admin = “normaler” Admin
  role: text("role")
    .notNull()
    .$type<"owner" | "admin">()
    .default("admin"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
