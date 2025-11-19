// apps/cloud-api/src/routes/subscriptions.ts
import type { FastifyInstance } from "fastify";
import { db } from "../db/client";
import { subscriptions } from "../db/schema/subscriptions";

export async function registerSubscriptionsRoutes(app: FastifyInstance) {
  app.get("/subscriptions", async () => {
    const items = await db.select().from(subscriptions).limit(50);

    return {
      items,
      total: items.length,
      limit: 50,
      offset: 0,
    };
  });
}
