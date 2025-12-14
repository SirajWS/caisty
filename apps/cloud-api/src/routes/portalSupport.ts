// apps/cloud-api/src/routes/portalSupport.ts
import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { customers } from "../db/schema/customers.js";
import { notificationService } from "../billing/NotificationService.js";

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
};

const SUPPORT_MESSAGES: StoredSupportMessage[] = [];

// Versucht, aus dem Request den Portal-Kunden zu ziehen
function getPortalCustomerContext(request: any) {
  const r: any = request;
  const c =
    r.portalCustomer ||
    r.customer ||
    r.user ||
    r.authUser ||
    null;

  if (!c) {
    return { id: "unknown", name: undefined, email: undefined };
  }

  return {
    id: c.id ?? "unknown",
    name: c.name ?? c.companyName ?? undefined,
    email: c.email ?? undefined,
  };
}

export async function registerPortalSupportRoutes(app: FastifyInstance) {
  // Neue Support-Nachricht
  app.post<{ Body: CreateBody }>("/portal/support-messages", async (request) => {
    const { subject, message } = request.body;
    const customer = getPortalCustomerContext(request);
    const now = new Date().toISOString();

    const stored: StoredSupportMessage = {
      id: randomUUID(),
      customerId: customer.id,
      subject,
      message,
      status: "open",
      createdAt: now,
      replyText: null,
      repliedAt: null,
    };

    SUPPORT_MESSAGES.push(stored);

    // ⬅️ Admin-Notification erzeugen (in DB speichern)
    if (customer.id !== "unknown") {
      // Versuche Customer aus DB zu holen für orgId
      const [dbCustomer] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, customer.id))
        .limit(1);
      
      if (dbCustomer?.orgId) {
        await notificationService.notifySupportMessage({
          orgId: dbCustomer.orgId,
          customerId: customer.id,
          customerName: customer.name,
          customerEmail: customer.email,
          subject,
          message,
          supportMessageId: stored.id,
        });
      }
    }

    const { customerId: _ignore, ...publicMsg } = stored;
    return publicMsg;
  });

  // Liste Support-Nachrichten für den eingeloggten Kunden
  app.get("/portal/support-messages", async (request) => {
    const customer = getPortalCustomerContext(request);

    const items = SUPPORT_MESSAGES
      .filter((m) => m.customerId === customer.id)
      .map(({ customerId: _ignore, ...rest }) => rest)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    return { items };
  });
}
