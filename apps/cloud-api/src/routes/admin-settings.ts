// apps/cloud-api/src/routes/admin-settings.ts
import type { FastifyInstance } from "fastify";
import { db } from "../db/client.js";
import { adminUsers, adminPermissions } from "../db/schema/index.js";
import { eq } from "drizzle-orm";
import { requireSuperadmin, requireAdminAuth } from "./admin-auth.js";

export async function registerAdminSettingsRoutes(app: FastifyInstance) {
  // GET /admin/settings/users - Liste aller Admin-User (nur Superadmin)
  app.get("/admin/settings/users", async (request, reply) => {
    try {
      requireSuperadmin(request);

      const users = await db
        .select({
          id: adminUsers.id,
          email: adminUsers.email,
          name: adminUsers.name,
          role: adminUsers.role,
          isActive: adminUsers.isActive,
          createdAt: adminUsers.createdAt,
        })
        .from(adminUsers)
        .orderBy(adminUsers.createdAt);

      return {
        ok: true,
        users,
      };
    } catch (err: any) {
      if (err.message === "Unauthorized" || err.message.includes("Forbidden")) {
        reply.code(403);
        return { ok: false, error: "Nur Superadmin hat Zugriff auf diese Seite" };
      }
      app.log.error({ err }, "Error fetching admin users");
      reply.code(500);
      return { ok: false, error: "Fehler beim Laden der Benutzer" };
    }
  });

  // GET /admin/settings/permissions - Alle Permissions (nur Superadmin)
  app.get("/admin/settings/permissions", async (request, reply) => {
    try {
      requireSuperadmin(request);

      const permissions = await db
        .select({
          id: adminPermissions.id,
          adminUserId: adminPermissions.adminUserId,
          canManageCustomers: adminPermissions.canManageCustomers,
          canManageSubscriptions: adminPermissions.canManageSubscriptions,
          canManageInvoices: adminPermissions.canManageInvoices,
          canAccessTechnicalSettings: adminPermissions.canAccessTechnicalSettings,
        })
        .from(adminPermissions);

      return {
        ok: true,
        permissions,
      };
    } catch (err: any) {
      if (err.message === "Unauthorized" || err.message.includes("Forbidden")) {
        reply.code(403);
        return { ok: false, error: "Nur Superadmin hat Zugriff auf diese Seite" };
      }
      app.log.error({ err }, "Error fetching permissions");
      reply.code(500);
      return { ok: false, error: "Fehler beim Laden der Berechtigungen" };
    }
  });

  // PUT /admin/settings/permissions/:userId - Permissions für einen User aktualisieren (nur Superadmin)
  app.put("/admin/settings/permissions/:userId", async (request, reply) => {
    try {
      requireSuperadmin(request);

      const { userId } = request.params as { userId: string };
      const body = request.body as {
        canManageCustomers?: boolean;
        canManageSubscriptions?: boolean;
        canManageInvoices?: boolean;
        canAccessTechnicalSettings?: boolean;
      };

      // Prüfe, ob User existiert
      const [user] = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.id, userId))
        .limit(1);

      if (!user) {
        reply.code(404);
        return { ok: false, error: "Benutzer nicht gefunden" };
      }

      // Superadmin kann keine Permissions haben (hat immer alle Rechte)
      if (user.role === "superadmin") {
        reply.code(400);
        return { ok: false, error: "Superadmin hat immer alle Berechtigungen" };
      }

      // Permissions aktualisieren oder erstellen
      const [updated] = await db
        .insert(adminPermissions)
        .values({
          adminUserId: userId,
          canManageCustomers: body.canManageCustomers ?? false,
          canManageSubscriptions: body.canManageSubscriptions ?? false,
          canManageInvoices: body.canManageInvoices ?? false,
          canAccessTechnicalSettings: body.canAccessTechnicalSettings ?? false,
        })
        .onConflictDoUpdate({
          target: adminPermissions.adminUserId,
          set: {
            canManageCustomers: body.canManageCustomers ?? false,
            canManageSubscriptions: body.canManageSubscriptions ?? false,
            canManageInvoices: body.canManageInvoices ?? false,
            canAccessTechnicalSettings: body.canAccessTechnicalSettings ?? false,
            updatedAt: new Date(),
          },
        })
        .returning();

      return {
        ok: true,
        permissions: updated,
      };
    } catch (err: any) {
      if (err.message === "Unauthorized" || err.message.includes("Forbidden")) {
        reply.code(403);
        return { ok: false, error: "Nur Superadmin hat Zugriff auf diese Seite" };
      }
      app.log.error({ err }, "Error updating permissions");
      reply.code(500);
      return { ok: false, error: "Fehler beim Aktualisieren der Berechtigungen" };
    }
  });
}

