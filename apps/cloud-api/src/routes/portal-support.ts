// apps/cloud-api/src/routes/portal-support.ts
import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";

import { notificationService } from "../billing/NotificationService.js";
import { verifyPortalToken } from "../lib/portalJwt.js";
import { db } from "../db/client.js";
import { customers } from "../db/schema/customers.js";

type CreateBody = {
  subject: string;
  message: string;
};

type PortalSupportMessage = {
  id: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "closed" | string;
  createdAt: string;
  replyText: string | null;
  repliedAt: string | null;
};

type StoredSupportMessage = PortalSupportMessage & {
  customerId: string;
  customerName?: string;
  customerEmail?: string;
};

const SUPPORT_MESSAGES: StoredSupportMessage[] = [];

// Holt ggf. Name/E-Mail / orgId aus der DB
async function findCustomerFromDb(id: string) {
  if (!id || id === "unknown") return null;

  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      orgId: customers.orgId,
    })
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1);

  if (rows.length === 0) return null;
  return rows[0];
}

// Versucht, aus dem Request den Portal-Kunden zu ziehen
async function getPortalCustomerContext(request: any) {
  const r: any = request;

  let id = "unknown" as string;
  let orgId: string | null = null;
  let name: string | undefined;
  let email: string | undefined;

  const c =
    r.portalCustomer ||
    r.customer ||
    r.user ||
    r.authUser ||
    null;

  if (c) {
    id =
      c.id ??
      c.customerId ??
      c.portalCustomerId ??
      c.accountId ??
      "unknown";

    orgId = c.orgId ?? c.org_id ?? null;

    name =
      c.name ??
      c.customerName ??
      c.companyName ??
      undefined;

    email =
      c.email ??
      c.customerEmail ??
      undefined;
  } else {
    const auth = request.headers?.authorization;
    if (typeof auth === "string" && auth.startsWith("Bearer ")) {
      const token = auth.slice(7).trim();
      try {
        const payload = verifyPortalToken(token);
        id = payload.customerId ?? "unknown";
        orgId = payload.orgId ?? null;
      } catch {
        id = "unknown";
        orgId = null;
      }
    }
  }

  // Name/E-Mail/orgId aus der DB nachziehen wenn nötig
  if (id !== "unknown") {
    try {
      const row = await findCustomerFromDb(id);
      if (row) {
        if (!name) name = row.name ?? name;
        if (!email) email = row.email ?? email;
        if (!orgId && row.orgId) orgId = String(row.orgId);
      }
    } catch (err) {
      console.error("Failed to load customer for support message", err);
    }
  }

  return { id, name, email, orgId };
}

export async function registerPortalSupportRoutes(app: FastifyInstance) {
  // -------------------------------------------------------------------------
  // Portal-API – Kunde schickt & sieht seine Nachrichten
  // -------------------------------------------------------------------------

  // Neue Support-Nachricht
  app.post<{ Body: CreateBody }>(
    "/portal/support-messages",
    async (request, reply) => {
      const subject = String(request.body?.subject ?? "").trim();
      const message = String(request.body?.message ?? "").trim();
      if (!subject || !message) {
        reply.code(400);
        return {
          ok: false,
          error: "Betreff und Nachricht sind erforderlich.",
        };
      }

      const customer = await getPortalCustomerContext(request);
      if (customer.id === "unknown") {
        reply.code(401);
        return { ok: false, error: "Nicht angemeldet." };
      }

      const orgId = customer.orgId;
      if (!orgId) {
        reply.code(422);
        return {
          ok: false,
          code: "MISSING_ORG",
          error:
            "Dein Konto ist keiner Organisation zugeordnet. Bitte kontaktiere support@caisty.com.",
        };
      }

      const now = new Date().toISOString();
      const stored: StoredSupportMessage = {
        id: randomUUID(),
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        subject,
        message,
        status: "open",
        createdAt: now,
        replyText: null,
        repliedAt: null,
      };

      try {
        await notificationService.notifySupportMessage({
          orgId,
          customerId: customer.id,
          customerName: customer.name,
          customerEmail: customer.email ?? "",
          subject,
          message,
          supportMessageId: stored.id,
        });
      } catch (err) {
        request.log.error({ err }, "portal support: notification insert failed");
        reply.code(500);
        return {
          ok: false,
          error:
            "Die Nachricht konnte gerade nicht gesendet werden. Bitte versuche es später erneut.",
        };
      }

      SUPPORT_MESSAGES.push(stored);

      const {
        customerId: _cid,
        customerName: _cn,
        customerEmail: _ce,
        ...publicMsg
      } = stored;
      return { ok: true, item: publicMsg };
    },
  );

  // Liste Support-Nachrichten für den eingeloggten Kunden
  app.get("/portal/support-messages", async (request) => {
    const customer = await getPortalCustomerContext(request);

    const items = SUPPORT_MESSAGES
      .filter((m) => m.customerId === customer.id)
      .map(
        ({
          customerId: _cid,
          customerName: _cn,
          customerEmail: _ce,
          ...rest
        }) => rest,
      )
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    return { items };
  });

  // -------------------------------------------------------------------------
  // Admin-API – Support-Messages ansehen & beantworten
  // -------------------------------------------------------------------------

  // Alle Support-Anfragen (für zukünftige Admin-Ansicht)
  app.get("/admin/support-messages", async () => {
    const items = SUPPORT_MESSAGES.slice().sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    );
    return { items };
  });

  // Details einer Anfrage
  app.get<{ Params: { id: string } }>(
    "/admin/support-messages/:id",
    async (request, reply) => {
      const { id } = request.params;
      const msg = SUPPORT_MESSAGES.find((m) => m.id === id);
      if (!msg) {
        reply.code(404);
        return { error: "Support message not found" };
      }
      return msg;
    },
  );

  // Antwort speichern
  app.post<{
    Params: { id: string };
    Body: { replyText: string; status?: string };
  }>("/admin/support-messages/:id/reply", async (request, reply) => {
    const { id } = request.params;
    const { replyText, status } = request.body;
    const msg = SUPPORT_MESSAGES.find((m) => m.id === id);
    if (!msg) {
      reply.code(404);
      return { error: "Support message not found" };
    }

    msg.replyText = replyText;
    msg.repliedAt = new Date().toISOString();
    msg.status = status || "answered";

    return msg;
  });
}
