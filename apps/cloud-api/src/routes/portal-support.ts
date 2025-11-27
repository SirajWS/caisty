// apps/cloud-api/src/routes/portal-support.ts
import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";

import { addSupportNotification } from "../lib/admin-notifications-store.js";
import { db } from "../db/client";
import { customers } from "../db/schema";

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

/** JWT-Payload ohne Signaturprüfung dekodieren */
function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1];

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "===".slice((normalized.length + 3) % 4);

    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Holt ggf. Name/E-Mail aus der DB
async function findCustomerFromDb(id: string) {
  if (!id || id === "unknown") return null;

  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
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
      const payload = decodeJwtPayload(token);
      if (payload) {
        id =
          payload.customerId ??
          payload.sub ??
          payload.id ??
          "unknown";

        name =
          payload.customerName ??
          payload.name ??
          payload.companyName ??
          undefined;

        email =
          payload.email ??
          payload.customerEmail ??
          undefined;
      }
    }
  }

  // Falls wir nur die ID haben, Name/E-Mail aus der DB nachziehen
  if (id !== "unknown" && (!name || !email)) {
    try {
      const row = await findCustomerFromDb(id);
      if (row) {
        if (!name) name = row.name ?? name;
        if (!email) email = row.email ?? email;
      }
    } catch (err) {
      console.error("Failed to load customer for support message", err);
    }
  }

  return { id, name, email };
}

export async function registerPortalSupportRoutes(app: FastifyInstance) {
  // -------------------------------------------------------------------------
  // Portal-API – Kunde schickt & sieht seine Nachrichten
  // -------------------------------------------------------------------------

  // Neue Support-Nachricht
  app.post<{ Body: CreateBody }>(
    "/portal/support-messages",
    async (request) => {
      const { subject, message } = request.body;
      const customer = await getPortalCustomerContext(request);
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

      SUPPORT_MESSAGES.push(stored);

      // Admin-Notification inkl. supportMessageId erzeugen
      addSupportNotification({
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        subject,
        message,
        supportMessageId: stored.id,
      });

      const {
        customerId: _cid,
        customerName: _cn,
        customerEmail: _ce,
        ...publicMsg
      } = stored;
      return publicMsg;
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
