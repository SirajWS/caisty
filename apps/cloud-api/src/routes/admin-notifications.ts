import type { FastifyInstance } from "fastify";
import { db } from "../db/client.js";
import { notifications } from "../db/schema/notifications.js";
import { customers } from "../db/schema/customers.js";
import { desc, eq, sql } from "drizzle-orm";
import { resolveNotificationTarget } from "../lib/notificationTarget.js";

function mapNotificationRow(row: {
  notification: typeof notifications.$inferSelect;
  customerName: string | null;
  customerEmail: string | null;
}) {
  const n = row.notification;
  const data =
    n.data && typeof n.data === "object"
      ? (n.data as Record<string, unknown>)
      : null;
  const target = resolveNotificationTarget({
    type: n.type,
    customerId: n.customerId,
    licenseId: n.licenseId,
    data,
  });

  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    customerId: n.customerId,
    licenseId: n.licenseId,
    customerName:
      row.customerName ??
      (typeof data?.customerName === "string" ? data.customerName : null),
    customerEmail:
      row.customerEmail ??
      (typeof data?.customerEmail === "string" ? data.customerEmail : null),
    data: n.data,
    isRead: n.isRead,
    createdAt: n.createdAt?.toISOString?.() ?? String(n.createdAt),
    actionHref: target.href,
    actionLabel: target.label,
    category: target.category,
  };
}

export async function registerAdminNotificationsRoutes(app: FastifyInstance) {
  app.get("/admin/notifications", async (request) => {
    const limit = Number((request.query as { limit?: string })?.limit) || 200;
    const offset = Number((request.query as { offset?: string })?.offset) || 0;

    const rows = await db
      .select({
        notification: notifications,
        customerName: customers.name,
        customerEmail: customers.email,
      })
      .from(notifications)
      .leftJoin(
        customers,
        sql`${customers.id}::text = ${notifications.customerId}`,
      )
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications);

    return {
      items: rows.map(mapNotificationRow),
      total: countRow?.count ?? rows.length,
      limit,
      offset,
    };
  });

  app.get("/admin/notifications/recent", async () => {
    const rows = await db
      .select({
        notification: notifications,
        customerName: customers.name,
        customerEmail: customers.email,
      })
      .from(notifications)
      .leftJoin(
        customers,
        sql`${customers.id}::text = ${notifications.customerId}`,
      )
      .where(eq(notifications.isRead, false))
      .orderBy(desc(notifications.createdAt))
      .limit(10);

    return { items: rows.map(mapNotificationRow) };
  });

  app.post<{ Params: { id: string } }>(
    "/admin/notifications/:id/read",
    async (request) => {
      const { id } = request.params;
      const [row] = await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, id))
        .returning();
      return { item: row };
    },
  );

  app.post("/admin/notifications/read-all", async () => {
    const updated = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.isRead, false))
      .returning({ id: notifications.id });
    return { ok: true, count: updated.length };
  });
}
