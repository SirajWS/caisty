import type { FastifyInstance } from "fastify";
import { db } from "../db/client.js";
import { notifications } from "../db/schema/notifications.js";
import { and, desc, eq } from "drizzle-orm";

export default async function notificationsRoutes(app: FastifyInstance) {
  // Liste
  app.get("/notifications", async (request) => {
    const user = (request as any).user;
    const orgId = user?.orgId as string | undefined;

    const rows = await db
      .select()
      .from(notifications)
      .where(orgId ? eq(notifications.orgId, orgId) : undefined)
      .orderBy(desc(notifications.createdAt))
      .limit(200);

    return { items: rows };
  });

  // als gelesen markieren
  app.post<{ Params: { id: string } }>(
    "/notifications/:id/read",
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
}
