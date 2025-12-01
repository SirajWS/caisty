// apps/api/src/services/invoiceService.ts

import { db } from "../db/client.js";
import { invoices } from "../db/schema/invoices.js";
import { customers } from "../db/schema/customers.js";
import { orgs } from "../db/schema/orgs.js";
import { eq } from "drizzle-orm";

export type InvoiceRecord = typeof invoices.$inferSelect;
export type CustomerRecord = typeof customers.$inferSelect;
export type OrgRecord = typeof orgs.$inferSelect;

export interface InvoiceWithCustomerAndOrg {
  invoice: InvoiceRecord;
  customer: CustomerRecord;
  org: OrgRecord | null;
}

/**
 * Lädt eine Invoice inkl. zugehörigem Customer (+ optional Org/Firma).
 */
export async function getInvoiceWithCustomerAndOrg(
  invoiceId: string,
): Promise<InvoiceWithCustomerAndOrg | null> {
  const rows = await db
    .select({
      invoice: invoices,
      customer: customers,
      org: orgs,
    })
    .from(invoices)
    .innerJoin(customers, eq(invoices.customerId, customers.id))
    .leftJoin(orgs, eq(customers.orgId, orgs.id))
    .where(eq(invoices.id, invoiceId))
    .limit(1);

  if (!rows[0]) return null;
  return rows[0];
}

/**
 * Admin-Liste: Invoices inkl. Customer-Name/Email.
 */
export async function listInvoicesWithCustomer() {
  const rows = await db
    .select({
      invoice: invoices,
      customer: customers,
    })
    .from(invoices)
    .innerJoin(customers, eq(invoices.customerId, customers.id));

  return rows.map((row) => ({
    ...row.invoice,
    customerId: row.customer.id,
    customerName: row.customer.name,
    customerEmail: row.customer.email,
  }));
}
