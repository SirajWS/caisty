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

      request.log.info(
        { id, idLength: id?.length ?? 0 },
        "GET /customers/:id called",
      );

      const [item] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, id))
        .limit(1);

      if (!item) {
        request.log.warn({ id }, "Customer not found in GET /customers/:id");
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
      const rawStatus = request.body?.status;

      const normalizedStatus =
        typeof rawStatus === "string"
          ? rawStatus.trim().toLowerCase()
          : "";

      request.log.info(
        {
          id,
          idLength: id?.length ?? 0,
          rawStatus,
          normalizedStatus,
          route: "PATCH /customers/:id/status",
        },
        "Status update requested",
      );

      if (!normalizedStatus) {
        request.log.warn(
          { id, rawStatus },
          "Missing or empty status in body",
        );
        reply.code(400);
        return { error: "Status is required and must be a non-empty string" };
      }

      if (!["active", "inactive"].includes(normalizedStatus)) {
        request.log.warn(
          { id, normalizedStatus },
          "Invalid status value",
        );
        reply.code(400);
        return {
          error: "Invalid status",
          allowed: ["active", "inactive"],
        };
      }

      try {
        // 1) Existenz prüfen
        const [existing] = await db
          .select({ id: customers.id, status: customers.status })
          .from(customers)
          .where(eq(customers.id, id))
          .limit(1);

        if (!existing) {
          request.log.warn(
            { id },
            "Customer not found in database for status update",
          );
          reply.code(404);
          return { error: "Customer not found" };
        }

        request.log.info(
          {
            id,
            oldStatus: existing.status,
            newStatus: normalizedStatus,
          },
          "Updating customer status",
        );

        // 2) Update
        const [updated] = await db
          .update(customers)
          .set({ status: normalizedStatus })
          .where(eq(customers.id, id))
          .returning();

        if (!updated) {
          request.log.error(
            { id },
            "Update returned no rows (unexpected)",
          );
          reply.code(500);
          return { error: "Failed to update customer status" };
        }

        request.log.info(
          { id, newStatus: updated.status },
          "Customer status updated successfully",
        );

        return { item: updated };
      } catch (err) {
        request.log.error(
          { err, id, rawStatus, normalizedStatus },
          "Error updating customer status",
        );
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

      request.log.info(
        { id, idLength: id?.length ?? 0 },
        "DELETE /customers/:id called",
      );

      try {
        // Devices entkoppeln
        await db
          .update(devices)
          .set({ customerId: null })
          .where(eq(devices.customerId, id));

        const deleted = await db
          .delete(customers)
          .where(eq(customers.id, id))
          .returning();

        if (deleted.length === 0) {
          request.log.warn({ id }, "Customer not found in DELETE /customers/:id");
          reply.code(404);
          return { error: "Customer not found" };
        }

        request.log.info({ id }, "Customer deleted successfully");
        return { ok: true };
      } catch (err) {
        request.log.error({ err, id }, "Error deleting customer");
        reply.code(500);
        return { error: "Failed to delete customer" };
      }
    },
  );
}
