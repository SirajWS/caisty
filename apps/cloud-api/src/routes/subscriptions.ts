// apps/cloud-api/src/routes/subscriptions.ts
import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { subscriptions } from "../db/schema/subscriptions.js";
import { customers } from "../db/schema/customers.js";
import { invoices } from "../db/schema/invoices.js";

export async function registerSubscriptionsRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { limit?: number; offset?: number } }>(
    "/subscriptions",
    async (request) => {
      const limit = request.query.limit ?? 50;
      const offset = request.query.offset ?? 0;

      const rows = await db
        .select({
          sub: subscriptions,
          customer: customers,
        })
        .from(subscriptions)
        .leftJoin(customers, eq(subscriptions.customerId, customers.id))
        .limit(limit)
        .offset(offset);

      // Für jede Subscription die zugehörigen Invoices holen
      const items = await Promise.all(
        rows.map(async (row: any) => {
          const sub = row.sub as any;
          const customer = row.customer as any;

          // Invoices für diese Subscription holen
          const invoiceRows = await db
            .select({ id: invoices.id, number: invoices.number })
            .from(invoices)
            .where(eq(invoices.subscriptionId, sub.id))
            .limit(5); // Max 5 neueste Invoices

          return {
            id: String(sub.id),
            customerId: String(sub.customerId),
            customerName: customer ? String(customer.name) : null,
            customerEmail: customer ? String(customer.email) : null,
            customerStatus: customer ? String(customer.status ?? "active") : null,
            plan: String(sub.plan),
            status: String(sub.status),
            priceCents: Number(sub.priceCents ?? 0),
            currency: String(sub.currency ?? "EUR"),
            startedAt: sub.startedAt ? new Date(sub.startedAt).toISOString() : null,
            currentPeriodEnd: sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toISOString() : null,
            createdAt: sub.createdAt ? new Date(sub.createdAt).toISOString() : new Date().toISOString(),
            invoices: invoiceRows.map((inv: any) => ({
              id: String(inv.id),
              number: String(inv.number),
            })),
          };
        }),
      );

      return {
        items,
        total: items.length,
        limit,
        offset,
      };
    },
  );
}
