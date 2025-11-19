// apps/cloud-api/src/routes/webhooks.ts
import type { FastifyInstance } from "fastify";
import { db } from "../db/client";
import { webhooks } from "../db/schema/webhooks";

export async function registerWebhooksRoutes(app: FastifyInstance) {
  app.get("/webhooks", async (request, reply) => {
    const items = await db.select().from(webhooks);

    return {
      items,
      total: items.length,
      limit: items.length,
      offset: 0,
    };
  });
}
