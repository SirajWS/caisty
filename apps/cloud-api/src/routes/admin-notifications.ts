// apps/cloud-api/src/routes/admin-notifications.ts
import type { FastifyInstance } from "fastify";
import { listNotifications } from "../lib/admin-notifications-store.js";

export async function registerAdminNotificationsRoutes(app: FastifyInstance) {
  // Vollständige Liste für die Seite /notifications
  app.get("/admin/notifications", async () => {
    const items = listNotifications();
    return { items };
  });

  // Kurzliste für die Glocke (Dropdown)
  app.get("/admin/notifications/recent", async () => {
    const items = listNotifications(10);
    return { items };
  });
}
