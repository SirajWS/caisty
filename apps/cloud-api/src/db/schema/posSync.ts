import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { orgs } from "./orgs.js";
import { customers } from "./customers.js";
import { devices } from "./devices.js";

export const posSyncBatches = pgTable(
  "pos_sync_batches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    deviceId: uuid("device_id")
      .notNull()
      .references(() => devices.id, { onDelete: "cascade" }),
    posBatchId: uuid("pos_batch_id").notNull(),
    batchSequence: integer("batch_sequence").notNull().default(1),
    status: varchar("status", { length: 32 }).notNull().default("processing"),
    eventCount: integer("event_count").notNull().default(0),
    acceptedCount: integer("accepted_count").notNull().default(0),
    duplicateCount: integer("duplicate_count").notNull().default(0),
    failedCount: integer("failed_count").notNull().default(0),
    idempotencyKey: text("idempotency_key"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => ({
    uqOrgDevicePosBatch: uniqueIndex("uq_pos_sync_batches_org_device_pos_batch").on(
      t.orgId,
      t.deviceId,
      t.posBatchId,
    ),
    idxOrgCreated: index("idx_pos_sync_batches_org_created").on(
      t.orgId,
      t.createdAt,
    ),
    idxDevice: index("idx_pos_sync_batches_device").on(
      t.deviceId,
      t.createdAt,
    ),
  }),
);

export const posSyncEvents = pgTable(
  "pos_sync_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    syncEventId: uuid("sync_event_id").notNull(),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => posSyncBatches.id, { onDelete: "cascade" }),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    deviceId: uuid("device_id")
      .notNull()
      .references(() => devices.id, { onDelete: "cascade" }),
    eventType: varchar("event_type", { length: 32 }).notNull(),
    entityLocalId: text("entity_local_id"),
    status: varchar("status", { length: 32 }).notNull(),
    errorCode: varchar("error_code", { length: 64 }),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uqSyncEventId: uniqueIndex("uq_pos_sync_events_sync_event_id").on(
      t.syncEventId,
    ),
    idxBatch: index("idx_pos_sync_events_batch").on(t.batchId),
    idxOrgStatus: index("idx_pos_sync_events_org_status").on(
      t.orgId,
      t.status,
      t.createdAt,
    ),
  }),
);

export const posOrders = pgTable(
  "pos_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    deviceId: uuid("device_id")
      .notNull()
      .references(() => devices.id, { onDelete: "cascade" }),
    localOrderId: text("local_order_id").notNull(),
    status: varchar("status", { length: 32 }).notNull().default("closed"),
    totalCents: integer("total_cents").notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("EUR"),
    soldAt: timestamp("sold_at", { withTimezone: true }).notNull(),
    syncBatchId: uuid("sync_batch_id").references(() => posSyncBatches.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uqOrgDeviceLocal: uniqueIndex("uq_pos_orders_org_device_local").on(
      t.orgId,
      t.deviceId,
      t.localOrderId,
    ),
    idxOrgSoldAt: index("idx_pos_orders_org_sold_at").on(t.orgId, t.soldAt),
    idxOrgCustomerSoldAt: index("idx_pos_orders_org_customer_sold_at").on(
      t.orgId,
      t.customerId,
      t.soldAt,
    ),
  }),
);

export const posOrderLines = pgTable(
  "pos_order_lines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => posOrders.id, { onDelete: "cascade" }),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    lineIndex: integer("line_index").notNull(),
    productName: text("product_name"),
    sku: text("sku"),
    quantity: integer("quantity").notNull().default(1),
    unitPriceCents: integer("unit_price_cents").notNull(),
    lineTotalCents: integer("line_total_cents").notNull(),
    taxRateBps: integer("tax_rate_bps"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uqOrderLine: uniqueIndex("uq_pos_order_lines_order_line").on(
      t.orderId,
      t.lineIndex,
    ),
    idxOrg: index("idx_pos_order_lines_org").on(t.orgId),
  }),
);

export const posReceipts = pgTable(
  "pos_receipts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    deviceId: uuid("device_id")
      .notNull()
      .references(() => devices.id, { onDelete: "cascade" }),
    localReceiptId: text("local_receipt_id").notNull(),
    localOrderId: text("local_order_id"),
    receiptNumber: text("receipt_number"),
    netCents: integer("net_cents").notNull(),
    taxCents: integer("tax_cents").notNull().default(0),
    grossCents: integer("gross_cents").notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("EUR"),
    soldAt: timestamp("sold_at", { withTimezone: true }).notNull(),
    fiscalStatus: varchar("fiscal_status", { length: 32 })
      .notNull()
      .default("pending"),
    syncBatchId: uuid("sync_batch_id").references(() => posSyncBatches.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uqOrgDeviceLocal: uniqueIndex("uq_pos_receipts_org_device_local").on(
      t.orgId,
      t.deviceId,
      t.localReceiptId,
    ),
    idxOrgSoldAt: index("idx_pos_receipts_org_sold_at").on(t.orgId, t.soldAt),
    idxOrgCustomerSoldAt: index("idx_pos_receipts_org_customer_sold_at").on(
      t.orgId,
      t.customerId,
      t.soldAt,
    ),
  }),
);

export const posSalePayments = pgTable(
  "pos_sale_payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    deviceId: uuid("device_id")
      .notNull()
      .references(() => devices.id, { onDelete: "cascade" }),
    localPaymentId: text("local_payment_id").notNull(),
    localOrderId: text("local_order_id"),
    localReceiptId: text("local_receipt_id"),
    method: varchar("method", { length: 32 }).notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("EUR"),
    paidAt: timestamp("paid_at", { withTimezone: true }).notNull(),
    syncBatchId: uuid("sync_batch_id").references(() => posSyncBatches.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uqOrgDeviceLocal: uniqueIndex("uq_pos_sale_payments_org_device_local").on(
      t.orgId,
      t.deviceId,
      t.localPaymentId,
    ),
    idxOrgPaidAt: index("idx_pos_sale_payments_org_paid_at").on(
      t.orgId,
      t.paidAt,
    ),
  }),
);
