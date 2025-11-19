// apps/cloud-api/src/routes/payments.ts
import type { FastifyInstance } from "fastify";
import { db } from "../db/client";
import { payments } from "../db/schema/payments";

export async function registerPaymentsRoutes(app: FastifyInstance) {
  app.get("/payments", async (request, reply) => {
    const items = await db.select().from(payments);

    return {
      items,
      total: items.length,
      limit: items.length,
      offset: 0,
    };
  });
}
