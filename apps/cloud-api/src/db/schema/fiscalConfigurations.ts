import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { orgs } from "./orgs.js";

export const fiscalConfigurations = pgTable("fiscal_configurations", {
  id: uuid("id").primaryKey().defaultRandom(),

  orgId: uuid("org_id")
    .notNull()
    .unique()
    .references(() => orgs.id, { onDelete: "cascade" }),

  country: varchar("country", { length: 5 }),
  currency: varchar("currency", { length: 3 }).notNull().default("EUR"),
  fiscalRequired: boolean("fiscal_required").notNull().default(false),

  provider: varchar("provider", { length: 32 }).notNull().default("none"),
  providerType: varchar("provider_type", { length: 32 })
    .notNull()
    .default("none"),
  providerName: varchar("provider_name", { length: 128 }),

  fiscalStatus: varchar("fiscal_status", { length: 32 })
    .notNull()
    .default("not_required"),
  fiscalEnvironment: varchar("fiscal_environment", { length: 32 })
    .notNull()
    .default("not_configured"),
  receiptMode: varchar("receipt_mode", { length: 32 })
    .notNull()
    .default("standard"),

  fiscalProfileKey: varchar("fiscal_profile_key", { length: 64 })
    .notNull()
    .default("generic_standard"),

  supportedExportsJson: jsonb("supported_exports_json")
    .notNull()
    .default([]),

  posDownloadAllowed: boolean("pos_download_allowed").notNull().default(true),
  posConfigurationStatus: varchar("pos_configuration_status", { length: 32 })
    .notNull()
    .default("not_ready"),

  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type FiscalConfigurationRow = typeof fiscalConfigurations.$inferSelect;
export type NewFiscalConfigurationRow = typeof fiscalConfigurations.$inferInsert;
