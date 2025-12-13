import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { invoices } from "./invoices";

export const invoiceLines = pgTable(
  "invoice_lines",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),

    description: text("description").notNull(),
    quantity: integer("quantity").notNull().default(1),

    unitAmountNetCents: integer("unit_amount_net_cents").notNull().default(0),
    amountNetCents: integer("amount_net_cents").notNull().default(0),

    // z.B. 19.00 für 19% (numeric ist gut für Steuersätze)
    taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).notNull().default("0"),
    amountTaxCents: integer("amount_tax_cents").notNull().default(0),
    amountGrossCents: integer("amount_gross_cents").notNull().default(0),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    idxInvoice: index("idx_invoice_lines_invoice_id").on(t.invoiceId),
  })
);

