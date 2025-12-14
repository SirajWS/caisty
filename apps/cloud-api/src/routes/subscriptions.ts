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
    async (request, reply) => {
      try {
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

        // Safe date conversion helper
        const safeDate = (date: any): string | null => {
          if (!date) return null;
          try {
            const d = new Date(date);
            if (isNaN(d.getTime())) return null;
            return d.toISOString();
          } catch {
            return null;
          }
        };

        // Für jede Subscription die zugehörigen Invoices holen
        const items = await Promise.all(
          rows
            .filter((row: any) => row.sub && row.sub.id) // Filter invalid rows first
            .map(async (row: any) => {
              const sub = row.sub as any;
              const customer = row.customer as any;

              // Invoices für diese Subscription holen
              let invoiceRows: any[] = [];
              try {
                invoiceRows = await db
                  .select({ id: invoices.id, number: invoices.number })
                  .from(invoices)
                  .where(eq(invoices.subscriptionId, sub.id))
                  .limit(5); // Max 5 neueste Invoices
              } catch (invoiceErr: any) {
                request.log.warn({ err: invoiceErr, subscriptionId: sub.id }, "Error loading invoices for subscription");
                // Continue with empty invoices array
              }

              return {
                id: String(sub.id),
                customerId: sub.customerId ? String(sub.customerId) : null,
                customerName: customer?.name ? String(customer.name) : null,
                customerEmail: customer?.email ? String(customer.email) : null,
                customerStatus: customer?.status ? String(customer.status) : "active",
                plan: sub.plan ? String(sub.plan) : "",
                status: sub.status ? String(sub.status) : "",
                priceCents: Number(sub.priceCents ?? 0),
                currency: sub.currency ? String(sub.currency) : "EUR",
                startedAt: safeDate(sub.startedAt),
                currentPeriodEnd: safeDate(sub.currentPeriodEnd),
                createdAt: safeDate(sub.createdAt) || new Date().toISOString(),
                invoices: invoiceRows
                  .filter((inv: any) => inv && inv.id)
                  .map((inv: any) => ({
                    id: String(inv.id),
                    number: String(inv.number ?? ""),
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
      } catch (err: any) {
        request.log.error({ err, query: request.query }, "Error loading subscriptions");
        reply.code(500);
        return {
          ok: false,
          error: "Failed to load subscriptions",
          message: err?.message || "Internal server error",
        };
      }
    },
  );

  // DELETE /subscriptions/:id - Cleanup: Nur cancelled/failed Subscriptions löschen
  app.delete<{ Params: { id: string } }>(
    "/subscriptions/:id",
    async (request, reply) => {
      try {
        const { id } = request.params;

        // Subscription finden
        const [sub] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.id, id))
          .limit(1);

        if (!sub) {
          reply.code(404);
          return { ok: false, error: "Subscription not found" };
        }

        // Nur cancelled oder failed Status erlauben
        const allowedStatuses = ["cancelled", "canceled", "failed", "past_due", "unpaid"];
        const currentStatus = String(sub.status).toLowerCase();

        if (!allowedStatuses.includes(currentStatus)) {
          reply.code(400);
          return {
            ok: false,
            error: "Cannot delete subscription",
            message: `Subscriptions with status "${sub.status}" cannot be deleted. Only cancelled/failed subscriptions can be deleted.`,
            currentStatus: sub.status,
          };
        }

        // Prüfen ob es verknüpfte Invoices gibt (die nicht bezahlt sind)
        const relatedInvoices = await db
          .select({ id: invoices.id, status: invoices.status })
          .from(invoices)
          .where(eq(invoices.subscriptionId, id))
          .limit(10);

        const unpaidInvoices = relatedInvoices.filter(
          (inv: any) => inv.status !== "paid" && inv.status !== "canceled" && inv.status !== "cancelled"
        );

        if (unpaidInvoices.length > 0) {
          reply.code(400);
          return {
            ok: false,
            error: "Cannot delete subscription",
            message: `Subscription has ${unpaidInvoices.length} unpaid invoice(s). Please cancel or delete invoices first.`,
            unpaidInvoiceIds: unpaidInvoices.map((inv: any) => inv.id),
          };
        }

        // Subscription löschen
        await db.delete(subscriptions).where(eq(subscriptions.id, id));

        return {
          ok: true,
          message: `Subscription ${id} deleted successfully`,
          deletedSubscription: {
            id: String(sub.id),
            plan: String(sub.plan),
            status: String(sub.status),
          },
        };
      } catch (err: any) {
        request.log.error({ err, subscriptionId: request.params.id }, "Error deleting subscription");
        reply.code(500);
        return {
          ok: false,
          error: "Failed to delete subscription",
          message: err?.message || "Internal server error",
        };
      }
    },
  );
}
