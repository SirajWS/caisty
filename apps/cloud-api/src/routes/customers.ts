// apps/cloud-api/src/routes/customers.ts
import type { FastifyInstance } from "fastify";
import { db } from "../db/client";
import { customers } from "../db/schema/customers";
import { sql, eq } from "drizzle-orm";

type ListQuery = {
  limit?: number;
  offset?: number;
};

// Body für neuen Customer
type CreateCustomerBody = {
  name: string;
  email?: string | null;
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

  // Neuen Customer anlegen (wird vom License-Formular genutzt)
  app.post<{ Body: CreateCustomerBody }>("/customers", async (request, reply) => {
    const user = (request as any).user;
    const orgId = user?.orgId;

    if (!orgId) {
      reply.code(401);
      return { error: "Missing orgId on user" };
    }

    const { name, email } = request.body;

    if (!name || !name.trim()) {
      reply.code(400);
      return { error: "name is required" };
    }

    try {
      const [created] = await db
        .insert(customers)
        .values({
          orgId,
          name: name.trim(),
          email: email?.trim() || null,
          status: "active",
        })
        .returning();

      reply.code(201);
      return { item: created };
    } catch (err) {
      console.error("Error creating customer", err);
      reply.code(500);
      return { error: "Failed to create customer" };
    }
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
