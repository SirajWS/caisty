import {
  boolean,
  integer,
  jsonb,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/** Global country rules — single source of truth for currency, fiscal, receipt mode. */
export const countryConfig = pgTable("country_config", {
  code: varchar("code", { length: 5 }).primaryKey(),
  nameDe: varchar("name_de", { length: 128 }).notNull(),
  nameEn: varchar("name_en", { length: 128 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  allowedCurrenciesJson: jsonb("allowed_currencies_json")
    .notNull()
    .$type<string[]>()
    .default(["EUR"]),
  fiscalRequired: boolean("fiscal_required").notNull().default(false),
  fiscalProvider: varchar("fiscal_provider", { length: 64 }),
  receiptMode: varchar("receipt_mode", { length: 32 }).notNull().default("standard"),
  fiscalSurchargeCents: integer("fiscal_surcharge_cents").notNull().default(0),
  posDownloadAllowed: boolean("pos_download_allowed").notNull().default(true),
  status: varchar("status", { length: 32 }).notNull().default("active"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CountryConfigRow = typeof countryConfig.$inferSelect;
export type CountryConfigInsert = typeof countryConfig.$inferInsert;
