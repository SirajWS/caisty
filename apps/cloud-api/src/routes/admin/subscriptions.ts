// apps/api/src/routes/admin/subscriptions.ts

import type { FastifyInstance } from "fastify";
import { db } from "../../db";
import { subscriptions, customers } from "../../db/schema";
import { eq } from "drizzle-orm";

export async function registerAdminSubscriptionsRoutes(
  app: FastifyInstance,
) {
  // Pfad: /api/subscriptions
  app.get("/subscriptions", async (_req, reply) => {
    const rows = await db
      .select({
        subscription: subscriptions,
        customer: customers,
      })
      .from(subscriptions)
      .innerJoin(customers, eq(subscriptions.customerId, customers.id));

    const items = rows.map((row) => ({
      id: row.subscription.id,
      customerId: row.customer.id,
      customerName: row.customer.name,
      customerEmail: row.customer.email,
      plan: row.subscription.plan,
      status: row.subscription.status,
      priceCents: row.subscription.priceCents,
      currency: row.subscription.currency,
      interval: row.subscription.interval,
      startedAt: row.subscription.startedAt,
      validUntil: row.subscription.validUntil,
    }));

    return reply.send({
      items,
      total: items.length,
      limit: items.length,
      offset: 0,
    });
  });
}
