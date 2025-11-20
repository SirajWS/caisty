// apps/cloud-api/src/routes/customers.ts
import type { FastifyInstance } from "fastify";
import { db } from "../db/client";
import { customers } from "../db/schema/customers";
import { sql, eq } from "drizzle-orm";

type ListQuery = {
  limit?: number;
  offset?: number;
};

export async function registerCustomersRoutes(app: FastifyInstance) {
  // Liste aller Kunden
  app.get<{ Querystring: ListQuery }>("/customers", async (request) => {
    const limit = Math.min(request.query.limit ?? 50, 200);
    const offset = request.query.offset ?? 0;

    const items = await db
      .select()
      .from(customers)
      .limit(limit)
      .offset(offset)
      .orderBy(customers.createdAt);

    const [{ value: total }] = await db
      .select({ value: sql<number>`count(*)` })
      .from(customers);

    return {
      items,
      total,
      limit,
      offset,
    };
  });

  // 🔹 Einzelner Kunde (für Detailseite)
  app.get<{ Params: { id: string } }>(
    "/customers/:id",
    async (request, reply) => {
      const { id } = request.params;

      const [item] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, id))
        .limit(1);

      if (!item) {
        reply.code(404);
        return { error: "Customer not found" };
      }

      return { item };
    },
  );
}
