import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { orgs } from "./orgs.js";
import { customers } from "./customers.js";
import { devices } from "./devices.js";
import { posSyncBatches } from "./posSync.js";

export const posChannels = pgTable(
  "pos_channels",
  {
    id: uuid("id").notNull(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    sourceDeviceId: uuid("source_device_id").references(() => devices.id, {
      onDelete: "set null",
    }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    provider: text("provider"),
    mode: text("mode"),
    storeId: text("store_id"),
    statusMapping: jsonb("status_mapping").notNull().default({}),
    notes: text("notes"),
    logoDataUrl: text("logo_data_url"),
    configJson: jsonb("config_json").notNull().default({}),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    clientUpdatedAt: timestamp("client_updated_at", { withTimezone: true }).notNull(),
    syncBatchId: uuid("sync_batch_id").references(() => posSyncBatches.id, {
      onDelete: "set null",
    }),
    schemaVersion: integer("schema_version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.orgId, t.id] }),
    uqOrgSlugActive: uniqueIndex("uq_pos_channels_org_slug_active")
      .on(t.orgId, t.slug)
      .where(sql`${t.deletedAt} IS NULL`),
    idxOrgUpdated: index("idx_pos_channels_org_updated_id").on(
      t.orgId,
      t.updatedAt,
      t.id,
    ),
  }),
);
