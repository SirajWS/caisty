// apps/api/src/routes/admin/invoices.ts

import type { FastifyInstance } from "fastify";
import { listInvoicesWithCustomer } from "../../services/invoiceService";

export async function registerAdminInvoicesRoutes(app: FastifyInstance) {
  // Pfad passt zu deinem Frontend: /api/invoices
  app.get("/invoices", async (_req, reply) => {
    const rows = await listInvoicesWithCustomer();

    const items = rows.map((inv: any) => ({
      id: inv.id,
      number: inv.number,
      status: inv.status,
      amountCents: inv.amountCents,
      currency: inv.currency,
      issuedAt: inv.createdAt, // für AdminInvoicesPage.tsx
      dueAt: inv.dueAt,
      customerId: inv.customerId,
      customerName: inv.customerName,
      customerEmail: inv.customerEmail,
    }));

    return reply.send({
      items,
      total: items.length,
      limit: items.length,
      offset: 0,
    });
  });
}
