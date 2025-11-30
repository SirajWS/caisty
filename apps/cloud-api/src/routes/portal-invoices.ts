// apps/cloud-api/src/routes/portal-invoices.ts
import type { FastifyInstance, FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";

import { db } from "../db/client.js";
import { invoices } from "../db/schema/invoices.js";
import { customers } from "../db/schema/customers.js";
import { subscriptions } from "../db/schema/subscriptions.js";
import { orgs } from "../db/schema/orgs.js";
import { verifyPortalToken } from "../lib/portalJwt.js";

interface PortalJwtPayload {
  customerId: string;
  orgId: string;
  iat: number;
  exp: number;
}

function getPortalAuth(request: FastifyRequest): PortalJwtPayload {
  const auth = request.headers.authorization;

  if (!auth || !auth.startsWith("Bearer ")) {
    throw new Error("Missing portal token");
  }

  const token = auth.slice("Bearer ".length);
  return verifyPortalToken(token) as PortalJwtPayload;
}

export async function registerPortalInvoiceRoutes(app: FastifyInstance) {
  // GET /portal/invoices/:id - Detail als JSON
  app.get<{ Params: { id: string } }>(
    "/portal/invoices/:id",
    async (request, reply) => {
      let payload: PortalJwtPayload;

      try {
        payload = getPortalAuth(request);
      } catch (err) {
        app.log.warn({ err }, "portal/invoices/:id: invalid portal token");
        reply.code(401);
        return { ok: false, message: "Invalid or missing portal token" };
      }

      const { id } = request.params;

      // Invoice mit Customer und Org laden
      const [row] = await db
        .select({
          inv: invoices,
          customer: customers,
          org: orgs,
          sub: subscriptions,
        })
        .from(invoices)
        .leftJoin(customers, eq(invoices.customerId, customers.id))
        .leftJoin(orgs, eq(customers.orgId, orgs.id))
        .leftJoin(subscriptions, eq(invoices.subscriptionId, subscriptions.id))
        .where(eq(invoices.id, id))
        .limit(1);

      if (!row || !row.inv) {
        reply.code(404);
        return { ok: false, message: "Invoice not found" };
      }

      const inv = row.inv as any;
      const customer = row.customer as any;
      const org = row.org as any;
      const sub = row.sub as any;

      // Sicherstellen, dass Invoice zum eingeloggten Customer gehört
      if (inv.customerId !== payload.customerId) {
        reply.code(403);
        return { ok: false, message: "Forbidden" };
      }

      return {
        ok: true,
        invoice: {
          id: String(inv.id),
          number: String(inv.number),
          status: String(inv.status),
          amountCents: Number(inv.amountCents),
          currency: String(inv.currency ?? "EUR"),
          createdAt: inv.createdAt ? new Date(inv.createdAt).toISOString() : new Date().toISOString(),
          dueAt: inv.dueAt ? new Date(inv.dueAt).toISOString() : null,
          periodStart: null, // invoices Tabelle hat kein periodFrom/periodStart
          periodEnd: null, // invoices Tabelle hat kein periodTo/periodEnd
          plan: sub?.plan ? String(sub.plan) : null,
        },
        customer: customer
          ? {
              id: String(customer.id),
              name: String(customer.name),
              email: String(customer.email),
            }
          : null,
        org: org
          ? {
              id: String(org.id),
              name: String(org.name),
              address: null,
              vatId: null,
            }
          : null,
      };
    },
  );

  // GET /portal/invoices/:id/html - HTML-Ansicht (vereinfacht)
  app.get<{ Params: { id: string } }>(
    "/portal/invoices/:id/html",
    async (request, reply) => {
      let payload: PortalJwtPayload;

      try {
        payload = getPortalAuth(request);
      } catch (err) {
        reply.code(401).type("text/plain").send("Unauthorized");
        return;
      }

      const { id } = request.params;

      const [row] = await db
        .select({
          inv: invoices,
          customer: customers,
        })
        .from(invoices)
        .leftJoin(customers, eq(invoices.customerId, customers.id))
        .where(eq(invoices.id, id))
        .limit(1);

      if (!row || !row.inv) {
        reply.code(404).type("text/plain").send("Invoice not found");
        return;
      }

      const inv = row.inv as any;

      if (inv.customerId !== payload.customerId) {
        reply.code(403).type("text/plain").send("Forbidden");
        return;
      }

      // Einfaches HTML (später kann renderInvoiceHtml verwendet werden)
      const amount = Number(inv.amountCents) / 100;
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Rechnung ${inv.number}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { color: #333; }
    .invoice-header { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .invoice-details { margin: 20px 0; }
    .invoice-details table { width: 100%; border-collapse: collapse; }
    .invoice-details td { padding: 8px; border-bottom: 1px solid #ddd; }
    .amount { font-size: 24px; font-weight: bold; color: #2563eb; }
  </style>
</head>
<body>
  <div class="invoice-header">
    <div>
      <h1>Rechnung ${inv.number}</h1>
      <p>Status: ${inv.status}</p>
    </div>
    <div>
      <p>Ausgestellt: ${inv.createdAt ? new Date(inv.createdAt).toLocaleDateString("de-DE") : "—"}</p>
      <p>Fällig: ${inv.dueAt ? new Date(inv.dueAt).toLocaleDateString("de-DE") : "—"}</p>
    </div>
  </div>
  <div class="invoice-details">
    <table>
      <tr><td>Betrag:</td><td class="amount">${amount.toFixed(2)} ${inv.currency ?? "EUR"}</td></tr>
    </table>
  </div>
</body>
</html>`;

      reply.type("text/html").send(html);
    },
  );
}

