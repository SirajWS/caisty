// apps/cloud-api/src/routes/admin-notifications.ts
import type { FastifyInstance } from "fastify";
import { db } from "../db/client.js";
import { notifications } from "../db/schema/notifications.js";
import { desc, eq } from "drizzle-orm";

export async function registerAdminNotificationsRoutes(app: FastifyInstance) {
  // Vollständige Liste für die Seite /notifications (aus DB)
  app.get("/admin/notifications", async (request) => {
    const limit = Number((request.query as any)?.limit) || 200;
    const offset = Number((request.query as any)?.offset) || 0;

    const items = await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    const total = await db
      .select({ count: notifications.id })
      .from(notifications);

    return {
      items,
      total: total.length,
      limit,
      offset,
    };
  });

  // Kurzliste für die Glocke (Dropdown) - nur ungelesene
  app.get("/admin/notifications/recent", async () => {
    const items = await db
      .select()
      .from(notifications)
      .where(eq(notifications.isRead, false))
      .orderBy(desc(notifications.createdAt))
      .limit(10);

    return { items };
  });

  // Notification als gelesen markieren
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
    }
  );
}
