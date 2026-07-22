import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";
import { orgs } from "./orgs";

export const businessProfiles = pgTable("business_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),

  orgId: uuid("org_id")
    .notNull()
    .unique()
    .references(() => orgs.id, { onDelete: "cascade" }),

  companyName: varchar("company_name", { length: 255 }),
  legalName: varchar("legal_name", { length: 255 }),
  country: varchar("country", { length: 5 }),
  currency: varchar("currency", { length: 3 }).notNull().default("EUR"),
  defaultLanguage: varchar("default_language", { length: 10 })
    .notNull()
    .default("en"),

  businessAddressJson: jsonb("business_address_json")
    .notNull()
    .default({}),

  vatId: varchar("vat_id", { length: 64 }),
  taxId: varchar("tax_id", { length: 64 }),

  fiscalStatus: varchar("fiscal_status", { length: 32 })
    .notNull()
    .default("not_required"),
  fiscalProvider: varchar("fiscal_provider", { length: 64 })
    .notNull()
    .default("none"),
  fiscalEnvironment: varchar("fiscal_environment", { length: 32 })
    .notNull()
    .default("not_configured"),

  complianceStatus: varchar("compliance_status", { length: 32 })
    .notNull()
    .default("incomplete"),
  posConfigurationStatus: varchar("pos_configuration_status", { length: 32 })
    .notNull()
    .default("not_ready"),

  configVersion: integer("config_version").notNull().default(1),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type BusinessProfileRow = typeof businessProfiles.$inferSelect;
export type NewBusinessProfileRow = typeof businessProfiles.$inferInsert;
