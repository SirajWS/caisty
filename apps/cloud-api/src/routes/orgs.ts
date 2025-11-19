// apps/cloud-api/src/routes/orgs.ts
import type { FastifyInstance } from "fastify";
import { db } from "../db/client";
import { orgs } from "../db/schema/orgs";

export async function registerOrgsRoutes(app: FastifyInstance) {
  app.get("/orgs", async () => {
    const items = await db.select().from(orgs).limit(50);

    return {
      items,
      total: items.length,
      limit: 50,
      offset: 0,
    };
  });
}
