// apps/api/src/routes/admin/customers.ts

import type { FastifyInstance, FastifyRequest } from "fastify";
import { db } from "../../db";
import { customers } from "../../db/schema";
import { eq } from "drizzle-orm";

type CustomerParams = {
  customerId: string;
};

export async function registerAdminCustomersRoutes(app: FastifyInstance) {
  // Liste aller Kunden – /api/customers
  app.get("/customers", async (_req, reply) => {
    const rows = await db.select().from(customers);

    return reply.send({
      items: rows,
      total: rows.length,
      limit: rows.length,
      offset: 0,
    });
  });

  // Detail eines Kunden – /api/customers/:customerId
  app.get(
    "/customers/:customerId",
    async (req: FastifyRequest<{ Params: CustomerParams }>, reply) => {
      const { customerId } = req.params;

      const result = await db
        .select()
        .from(customers)
        .where(eq(customers.id, customerId))
        .limit(1);

      if (!result[0]) {
        return reply.code(404).send({ error: "Customer not found" });
      }

      return reply.send({ item: result[0] });
    },
  );
}
