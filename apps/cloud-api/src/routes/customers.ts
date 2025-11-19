// src/routes/customers.ts
import type { FastifyInstance } from "fastify";
import { db } from "../db/client";
import { customers } from "../db/schema/customers";

export async function registerCustomersRoutes(app: FastifyInstance) {
  app.get("/customers", async (request, reply) => {
    try {
      // Erst versuchen wir echte DB-Daten zu holen
      const items = await db.select().from(customers).limit(50);

      app.log.info({ count: items.length }, "Loaded customers from DB");

      return {
        items,
        total: items.length,
        limit: 50,
        offset: 0
      };
    } catch (error) {
      // Fehler im Log sehen wir später, aber UI soll NICHT 500 zeigen
      app.log.error(
        {
          err: error instanceof Error ? error.message : String(error)
        },
        "DB error in GET /customers – falling back to stub data"
      );

      // Fallback: Stub-Daten, damit Admin-Web weiterarbeiten kann
      const now = new Date().toISOString();
      const items = [
        {
          id: "stub-1",
          email: "alice@example.com",
          name: "Alice GmbH",
          status: "active",
          createdAt: now
        },
        {
          id: "stub-2",
          email: "bob@example.com",
          name: "Bob OHG",
          status: "active",
          createdAt: now
        },
        {
          id: "stub-3",
          email: "charlie@example.com",
          name: "Charlie e.K.",
          status: "inactive",
          createdAt: now
        }
      ];

      return {
        items,
        total: items.length,
        limit: items.length,
        offset: 0,
        warning: "DB error – serving stub data (dev only)"
      };
    }
  });
}
