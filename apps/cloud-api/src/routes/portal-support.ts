// apps/cloud-api/src/routes/portal-support.ts
import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";

import { notificationService } from "../billing/NotificationService.js";
import { verifyPortalToken } from "../lib/portalJwt.js";
import { db } from "../db/client.js";
import { customers } from "../db/schema/customers.js";
import { invoices } from "../db/schema/invoices.js";
import { licenses } from "../db/schema/licenses.js";
import { supportMessages } from "../db/schema/supportMessages.js";

type CreateBody = {
  subject: string;
  message: string;
};

type OrgIdSource = "jwt" | "customer" | "latestInvoice" | "license" | "none";

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

/** DB column `support_messages.org_id` is NOT NULL — use when no real org was resolved. */
const NO_ORG_SENTINEL = "__no_org__";

const SUPPORT_MESSAGES: StoredSupportMessage[] = [];

function trimOrg(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

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
    .where(eq(customers.id, id as any))
    .limit(1);

  if (rows.length === 0) return null;
  return rows[0];
}

// Versucht, aus dem Request den Portal-Kunden zu ziehen; orgId nach Priorität a) JWT b) Customer c) Rechnung d) Lizenz
async function getPortalCustomerContext(request: any): Promise<{
  id: string;
  name?: string;
  email?: string;
  orgId: string | null;
  orgIdSource: OrgIdSource;
}> {
  const r: any = request;

  let id = "unknown" as string;
  let jwtOrgId: string | null = null;
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

    jwtOrgId = trimOrg(c.orgId ?? c.org_id);

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
        jwtOrgId = trimOrg(payload.orgId);
      } catch {
        id = "unknown";
        jwtOrgId = null;
      }
    }
  }

  let row: Awaited<ReturnType<typeof findCustomerFromDb>> = null;
  if (id !== "unknown") {
    try {
      row = await findCustomerFromDb(id);
      if (row) {
        if (!name) name = row.name ?? name;
        if (!email) email = row.email ?? email;
      }
    } catch (err) {
      console.error("Failed to load customer for support message", err);
    }
  }

  let orgId: string | null = null;
  let orgIdSource: OrgIdSource = "none";

  const fromJwt = jwtOrgId;
  if (fromJwt) {
    orgId = fromJwt;
    orgIdSource = "jwt";
  } else if (row?.orgId) {
    const o = trimOrg(row.orgId);
    if (o) {
      orgId = o;
      orgIdSource = "customer";
    }
  }

  if (id !== "unknown" && !orgId) {
    try {
      const [inv] = await db
        .select({ orgId: invoices.orgId })
        .from(invoices)
        .where(eq(invoices.customerId, id as any))
        .orderBy(desc(invoices.createdAt))
        .limit(1);
      const o = trimOrg(inv?.orgId);
      if (o) {
        orgId = o;
        orgIdSource = "latestInvoice";
      }
    } catch (err) {
      console.error("Failed to resolve org from invoices for support", err);
    }
  }

  if (id !== "unknown" && !orgId) {
    try {
      const [lic] = await db
        .select({ orgId: licenses.orgId })
        .from(licenses)
        .where(eq(licenses.customerId, String(id)))
        .orderBy(desc(licenses.createdAt))
        .limit(1);
      const o = trimOrg(lic?.orgId);
      if (o) {
        orgId = o;
        orgIdSource = "license";
      }
    } catch (err) {
      console.error("Failed to resolve org from licenses for support", err);
    }
  }

  return { id, name, email, orgId, orgIdSource };
}

function dbRowToStored(
  row: typeof supportMessages.$inferSelect,
  overlay?: StoredSupportMessage | undefined,
): StoredSupportMessage {
  const createdAt =
    row.createdAt instanceof Date
      ? row.createdAt.toISOString()
      : String(row.createdAt);
  const base: StoredSupportMessage = {
    id: row.id,
    customerId: row.customerId ?? "",
    customerEmail: row.email,
    subject: row.subject,
    message: row.message,
    status: "open",
    createdAt,
    replyText: null,
    repliedAt: null,
  };
  if (overlay) {
    base.status = overlay.status;
    base.replyText = overlay.replyText;
    base.repliedAt = overlay.repliedAt;
    base.customerName = overlay.customerName;
  }
  return base;
}

async function listMergedForCustomer(customerId: string): Promise<PortalSupportMessage[]> {
  let dbRows: (typeof supportMessages.$inferSelect)[] = [];
  try {
    dbRows = await db
      .select()
      .from(supportMessages)
      .where(eq(supportMessages.customerId, String(customerId)))
      .orderBy(desc(supportMessages.createdAt));
  } catch (err) {
    console.error("listMergedForCustomer: db read failed", err);
  }

  const byId = new Map<string, StoredSupportMessage>();

  for (const row of dbRows) {
    const overlay = SUPPORT_MESSAGES.find((m) => m.id === row.id);
    byId.set(row.id, dbRowToStored(row, overlay));
  }

  for (const m of SUPPORT_MESSAGES) {
    if (m.customerId !== customerId) continue;
    if (!byId.has(m.id)) {
      byId.set(m.id, m);
    }
  }

  const items = [...byId.values()]
    .map(({ customerId: _c, customerName: _n, customerEmail: _e, ...rest }) => rest)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return items;
}

async function listMergedForAdmin(): Promise<StoredSupportMessage[]> {
  let dbRows: (typeof supportMessages.$inferSelect)[] = [];
  try {
    dbRows = await db.select().from(supportMessages).orderBy(desc(supportMessages.createdAt));
  } catch (err) {
    console.error("listMergedForAdmin: db read failed", err);
  }

  const byId = new Map<string, StoredSupportMessage>();

  for (const row of dbRows) {
    const overlay = SUPPORT_MESSAGES.find((m) => m.id === row.id);
    byId.set(row.id, dbRowToStored(row, overlay));
  }

  for (const m of SUPPORT_MESSAGES) {
    if (!byId.has(m.id)) {
      byId.set(m.id, m);
    }
  }

  return [...byId.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

async function findMergedById(id: string): Promise<StoredSupportMessage | null> {
  const mem = SUPPORT_MESSAGES.find((m) => m.id === id);
  if (mem) return mem;

  try {
    const [row] = await db.select().from(supportMessages).where(eq(supportMessages.id, id)).limit(1);
    if (!row) return null;
    return dbRowToStored(row);
  } catch (err) {
    console.error("findMergedById: db read failed", err);
    return null;
  }
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

      const resolvedOrgId =
        customer.orgId && String(customer.orgId).trim().length > 0
          ? String(customer.orgId).trim()
          : null;
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

      // 1) In-Memory zuerst — ab hier gilt die Nachricht als gespeichert; Folgefehler dürfen die Antwort nicht kaputt machen
      SUPPORT_MESSAGES.push(stored);

      let notificationCreated = false;
      let notificationError: string | null = null;

      const runAfterSave = async () => {
        // 2) DB (optional; Fehler nur loggen)
        const dbOrgId = resolvedOrgId ?? NO_ORG_SENTINEL;
        const dbEmail = (customer.email ?? "").trim() || "portal+unknown@caisty.invalid";
        try {
          await db.insert(supportMessages).values({
            id: stored.id,
            orgId: dbOrgId,
            customerId: String(customer.id),
            email: dbEmail,
            subject,
            message,
          });
        } catch (err) {
          request.log.warn({ err, id: stored.id }, "support message: DB insert failed (in-memory copy exists)");
        }

        // 3) Notification nur bei gültiger orgId
        if (resolvedOrgId) {
          try {
            const notifRow = await notificationService.notifySupportMessage({
              orgId: resolvedOrgId,
              customerId: customer.id,
              customerName: customer.name,
              customerEmail: customer.email ?? "",
              subject,
              message,
              supportMessageId: stored.id,
            });
            notificationCreated = !!notifRow;
          } catch (err) {
            notificationError =
              err instanceof Error ? err.message : typeof err === "string" ? err : "unknown_error";
            request.log.error(
              {
                err,
                customerId: customer.id,
                resolvedOrgId,
                orgIdSource: customer.orgIdSource,
                supportMessageId: stored.id,
              },
              "portal support: notification insert failed (message was still saved)",
            );
          }
        } else {
          request.log.warn(
            {
              customerId: customer.id,
              resolvedOrgId: null,
              orgIdSource: customer.orgIdSource,
              supportMessageId: stored.id,
            },
            "Support message created without notification because orgId is missing",
          );
        }
      };

      try {
        await runAfterSave();
      } catch (err) {
        notificationError =
          err instanceof Error ? err.message : typeof err === "string" ? err : "unexpected_after_save";
        request.log.error(
          {
            err,
            customerId: customer.id,
            supportMessageId: stored.id,
            resolvedOrgId: resolvedOrgId ?? null,
            orgIdSource: customer.orgIdSource,
          },
          "portal support: unexpected error after in-memory save (continuing with 201)",
        );
      }

      try {
        request.log.info(
          {
            supportMessageId: stored.id,
            customerId: customer.id,
            resolvedOrgId: resolvedOrgId ?? null,
            orgIdSource: customer.orgIdSource,
            notificationCreated,
            notificationError,
          },
          "portal support: POST complete",
        );
      } catch (logErr) {
        request.log.warn({ logErr }, "portal support: summary log failed (ignored)");
      }

      // Explizit serialisierbare Payload — kein implizites Return, das serialisieren könnte
      const publicItem: PortalSupportMessage = {
        id: stored.id,
        subject: stored.subject,
        message: stored.message,
        status: stored.status,
        createdAt: stored.createdAt,
        replyText: stored.replyText,
        repliedAt: stored.repliedAt,
      };

      return reply.code(201).send({
        ok: true,
        item: publicItem,
        meta: {
          notificationCreated,
          notificationSkipped: !resolvedOrgId,
          ...(notificationError ? { notificationError } : {}),
        },
      });
    },
  );

  // Liste Support-Nachrichten für den eingeloggten Kunden
  app.get("/portal/support-messages", async (request) => {
    const customer = await getPortalCustomerContext(request);

    const items = await listMergedForCustomer(customer.id);
    return { items };
  });

  // -------------------------------------------------------------------------
  // Admin-API – Support-Messages ansehen & beantworten
  // -------------------------------------------------------------------------

  // Alle Support-Anfragen (für zukünftige Admin-Ansicht)
  app.get("/admin/support-messages", async () => {
    const items = await listMergedForAdmin();
    return { items };
  });

  // Details einer Anfrage
  app.get<{ Params: { id: string } }>(
    "/admin/support-messages/:id",
    async (request, reply) => {
      const { id } = request.params;
      const msg = await findMergedById(id);
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
    let msg = SUPPORT_MESSAGES.find((m) => m.id === id);
    if (!msg) {
      const loaded = await findMergedById(id);
      if (!loaded) {
        reply.code(404);
        return { error: "Support message not found" };
      }
      SUPPORT_MESSAGES.push(loaded);
      msg = loaded;
    }

    msg.replyText = replyText;
    msg.repliedAt = new Date().toISOString();
    msg.status = status || "answered";

    return msg;
  });
}
