// apps/cloud-api/src/routes/customers.ts
import type { FastifyInstance } from "fastify";
import { sql, eq } from "drizzle-orm";

import { db } from "../db/client";
import { customers } from "../db/schema/customers";
import { devices } from "../db/schema/devices";

type ListQuery = {
  limit?: number;
  offset?: number;
};

type CreateCustomerBody = {
  name: string;
  email?: string | null;
};

export async function registerCustomersRoutes(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // Liste aller Kunden
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Neuen Customer anlegen
  // ---------------------------------------------------------------------------
  app.post<{ Body: CreateCustomerBody }>(
    "/customers",
    async (request, reply) => {
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
    },
  );

  // ---------------------------------------------------------------------------
  // Einzelner Kunde (Detailseite)
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Status ändern (active <-> inactive) – für Trash
  // ---------------------------------------------------------------------------
  app.patch<{ Params: { id: string }; Body: { status: string } }>(
    "/customers/:id/status",
    async (request, reply) => {
      const { id } = request.params;
      const { status } = request.body;

      if (!status || !["active", "inactive"].includes(status)) {
        reply.code(400);
        return { error: "Invalid status" };
      }

      try {
        const [updated] = await db
          .update(customers)
          .set({ status })
          .where(eq(customers.id, id))
          .returning();

        if (!updated) {
          reply.code(404);
          return { error: "Customer not found" };
        }

        return { item: updated };
      } catch (err) {
        console.error("Error updating customer status", err);
        reply.code(500);
        return { error: "Failed to update customer status" };
      }
    },
  );

  // ---------------------------------------------------------------------------
  // Endgültig löschen – nur für Trash (wir entkoppeln Devices vorher)
  // ---------------------------------------------------------------------------
  app.delete<{ Params: { id: string } }>(
    "/customers/:id",
    async (request, reply) => {
      const { id } = request.params;

      try {
        // Devices von diesem Kunden lösen
        await db
          .update(devices)
          .set({ customerId: null })
          .where(eq(devices.customerId, id));

        // Kunden löschen
        const [deleted] = await db
          .delete(customers)
          .where(eq(customers.id, id))
          .returning();

        if (!deleted) {
          reply.code(404);
          return { error: "Customer not found" };
        }

        return { ok: true };
      } catch (err) {
        console.error("Error deleting customer", err);
        reply.code(500);
        return { error: "Failed to delete customer" };
      }
    },
  );
}
