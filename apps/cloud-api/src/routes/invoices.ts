// apps/cloud-api/src/routes/invoices.ts
import type { FastifyInstance } from "fastify";
import { db } from "../db/client";
import { invoices } from "../db/schema/invoices";

export async function registerInvoicesRoutes(app: FastifyInstance) {
  app.get("/invoices", async () => {
    const items = await db.select().from(invoices).limit(50);

    return {
      items,
      total: items.length,
      limit: 50,
      offset: 0,
    };
  });
}
