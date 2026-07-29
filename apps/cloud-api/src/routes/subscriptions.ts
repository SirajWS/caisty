// apps/cloud-api/src/routes/subscriptions.ts
import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { subscriptions } from "../db/schema/subscriptions.js";
import { customers } from "../db/schema/customers.js";
import { invoices } from "../db/schema/invoices.js";
import type { Currency } from "../config/pricing.js";
import { grossPlanAmountCents, PORTAL_CHECKOUT_VAT_RATE } from "../config/pricing.js";
import {
  catalogNetTaxGrossCents,
  isNetOnlyStripeAmountCents,
} from "../lib/vatAmountBreakdown.js";
import {
  formatBillingPeriodLabel,
  formatPlanTierLabel,
  type BillingPeriod,
} from "../lib/billingPeriod.js";
import { inferPaidBillingPeriodFromPriceCents } from "../lib/inferPaidBillingPeriodFromPriceCents.js";

function resolveSubscriptionInterval(
  billingPeriod: string | null | undefined,
  plan: string,
  currency: string,
  priceCents: number,
): BillingPeriod | null {
  if (billingPeriod === "monthly" || billingPeriod === "yearly") {
    return billingPeriod;
  }
  const tier = plan.toLowerCase();
  if (tier !== "starter" && tier !== "pro") return null;
  return inferPaidBillingPeriodFromPriceCents(
    tier as "starter" | "pro",
    (currency === "TND" ? "TND" : "EUR") as Currency,
    priceCents,
  );
}

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

              const cur = (sub.currency === "TND" ? "TND" : "EUR") as Currency;
              const interval = resolveSubscriptionInterval(
                sub.billingPeriod,
                String(sub.plan ?? ""),
                String(sub.currency ?? "EUR"),
                Number(sub.priceCents ?? 0),
              );
              const tier = String(sub.plan ?? "").toLowerCase();
              const storedPriceCents = Number(sub.priceCents ?? 0);
              let netPriceCents: number | null = null;
              let taxPriceCents: number | null = null;
              let grossPriceCents = storedPriceCents;

              if (
                interval &&
                (tier === "starter" || tier === "pro" || tier === "business")
              ) {
                const plan = tier as "starter" | "pro" | "business";
                if (
                  (tier === "starter" || tier === "pro") &&
                  isNetOnlyStripeAmountCents(
                    storedPriceCents,
                    tier,
                    cur,
                    interval,
                  )
                ) {
                  const corrected = catalogNetTaxGrossCents(
                    plan,
                    cur,
                    interval,
                  );
                  netPriceCents = corrected.netCents;
                  taxPriceCents = corrected.taxCents;
                  grossPriceCents = corrected.grossCents;
                } else if (
                  Math.abs(
                    storedPriceCents -
                      (grossPlanAmountCents(plan, cur, interval) ?? -999999),
                  ) <= 2
                ) {
                  const corrected = catalogNetTaxGrossCents(
                    plan,
                    cur,
                    interval,
                  );
                  netPriceCents = corrected.netCents;
                  taxPriceCents = corrected.taxCents;
                  grossPriceCents = storedPriceCents;
                } else {
                  netPriceCents = Math.round(
                    storedPriceCents / (1 + PORTAL_CHECKOUT_VAT_RATE),
                  );
                  taxPriceCents = storedPriceCents - netPriceCents;
                  grossPriceCents = storedPriceCents;
                }
              }

              return {
                id: String(sub.id),
                customerId: sub.customerId ? String(sub.customerId) : null,
                customerName: customer?.name ? String(customer.name) : null,
                customerEmail: customer?.email ? String(customer.email) : null,
                customerStatus: customer?.status ? String(customer.status) : "active",
                plan: formatPlanTierLabel(sub.plan),
                planTier: sub.plan ? String(sub.plan) : "",
                status: sub.status ? String(sub.status) : "",
                priceCents: grossPriceCents,
                grossPriceCents,
                netPriceCents,
                taxPriceCents,
                currency: sub.currency ? String(sub.currency) : "EUR",
                interval,
                intervalLabel: formatBillingPeriodLabel(interval, "de"),
                startedAt: safeDate(sub.startedAt),
                validUntil: safeDate(sub.currentPeriodEnd),
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
