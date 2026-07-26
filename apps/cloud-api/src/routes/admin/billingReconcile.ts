import type { FastifyInstance } from "fastify";

import { reconcileStripePaidInvoice } from "../../lib/reconcileStripePaidInvoice.js";

/**
 * Admin-only Stripe invoice reconciliation (idempotent).
 * Default dryRun=true — never charges Stripe.
 */
export async function registerAdminBillingReconcileRoutes(app: FastifyInstance) {
  app.post<{
    Body: { stripeInvoiceId?: string; dryRun?: boolean };
  }>("/admin/billing/reconcile-stripe-invoice", async (request, reply) => {
    const user = (request as any).user;
    if (!user?.isAdmin && !user?.adminUserId) {
      reply.code(403);
      return { error: "admin_required" };
    }

    const stripeInvoiceId = String(request.body?.stripeInvoiceId ?? "").trim();
    if (!stripeInvoiceId) {
      reply.code(400);
      return { error: "stripeInvoiceId_required" };
    }

    // Default: dry run. Explicit dryRun:false required to apply.
    const dryRun = request.body?.dryRun !== false;

    try {
      const result = await reconcileStripePaidInvoice({
        stripeInvoiceId,
        dryRun,
      });
      return result;
    } catch (err: unknown) {
      request.log.error({ err, stripeInvoiceId }, "reconcile-stripe-invoice failed");
      reply.code(500);
      return {
        error: "reconcile_failed",
        message: err instanceof Error ? err.message : "Unknown error",
      };
    }
  });
}
