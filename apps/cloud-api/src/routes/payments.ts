// apps/cloud-api/src/routes/payments.ts
import type { FastifyInstance } from "fastify";
import { db } from "../db/client.js";
import { payments } from "../db/schema/payments.js";
import { customers } from "../db/schema/customers.js";
import { eq, inArray } from "drizzle-orm";

export async function registerPaymentsRoutes(app: FastifyInstance) {
  app.get("/payments", async (request, reply) => {
    const items = await db.select().from(payments).orderBy(payments.createdAt);

    // Customer-Informationen für alle Payments holen
    const customerIds = items
      .map((p) => p.customerId)
      .filter((id): id is string => !!id);
    
    const customersMap = new Map<string, { name: string | null; email: string | null }>();
    if (customerIds.length > 0) {
      const uniqueCustomerIds = [...new Set(customerIds)];
      const customersList = await db
        .select({
          id: customers.id,
          name: customers.name,
          email: customers.email,
        })
        .from(customers)
        .where(inArray(customers.id, uniqueCustomerIds));

      // Map erstellen
      for (const customer of customersList) {
        customersMap.set(customer.id, {
          name: customer.name,
          email: customer.email,
        });
      }
    }

    // Items mit Customer-Informationen erweitern
    const itemsWithCustomers = items.map((item) => {
      const customer = item.customerId ? customersMap.get(item.customerId) : null;
      return {
        ...item,
        customerName: customer?.name || customer?.email || null,
      };
    });

    return {
      items: itemsWithCustomers,
      total: itemsWithCustomers.length,
      limit: itemsWithCustomers.length,
      offset: 0,
    };
  });
}
