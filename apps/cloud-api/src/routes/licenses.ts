// apps/cloud-api/src/routes/licenses.ts
import type { FastifyInstance } from "fastify";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "../db/client.js";
import { licenses } from "../db/schema/licenses.js";
import { licenseEvents } from "../db/schema/licenseEvents.js";
import { devices } from "../db/schema/devices.js";
import { customers } from "../db/schema/customers.js";
import { generateLicenseKey } from "../lib/licenseKey.js";

type CreateLicenseBody = {
  customerId?: string | null;
  subscriptionId?: string | null;
  plan: string;
  maxDevices?: number | null;
  validFrom: string;
  validUntil: string;
};

type RevokeBody = {
  reason?: string;
};

type DbLicense = typeof licenses.$inferSelect;

/**
 * Berechnet den aktuellen Status einer Lizenz basierend auf validUntil.
 * Aktualisiert die Datenbank, wenn die Lizenz abgelaufen ist.
 */
async function calculateLicenseStatus(license: DbLicense): Promise<string> {
  const now = new Date();
  
  // Wenn bereits revoked oder blocked, Status beibehalten
  if (license.status === "revoked" || license.status === "blocked") {
    return license.status;
  }
  
  // Prüfe, ob die Lizenz abgelaufen ist
  if (license.validUntil && license.validUntil.getTime() < now.getTime()) {
    // Status in Datenbank aktualisieren, wenn noch nicht expired
    if (license.status !== "expired") {
      try {
        await db
          .update(licenses)
          .set({
            status: "expired",
            updatedAt: now,
          } as any)
          .where(eq(licenses.id, license.id));
      } catch (err) {
        console.error(`Error updating license ${license.id} to expired:`, err);
      }
    }
    return "expired";
  }
  
  // Prüfe, ob die Lizenz noch nicht gültig ist
  if (license.validFrom && license.validFrom.getTime() > now.getTime()) {
    return "inactive";
  }
  
  // Standard: Status aus Datenbank verwenden
  return license.status;
}

export async function registerLicensesRoutes(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // Liste aller Lizenzen der aktuellen Org
  // ---------------------------------------------------------------------------
  app.get<{ Querystring: { customerId?: string } }>(
    "/licenses",
    async (request, reply) => {
      const user = (request as any).user;
      const orgId = user?.orgId as string | undefined;
      const customerId = request.query.customerId as string | undefined;

      try {
        let items: DbLicense[];

        // Wenn customerId als Query-Parameter übergeben wird, filtere danach
        // WICHTIG: Wenn customerId übergeben wird, filtern wir NUR nach customerId,
        // nicht nach orgId, da die Lizenz bereits mit dem Customer verknüpft ist
        // und der Customer zur gleichen Organisation gehört wie der Admin-User
        if (customerId) {
          items = await db
            .select()
            .from(licenses)
            .where(eq(licenses.customerId as any, customerId))
            .orderBy(desc(licenses.createdAt))
            .limit(200);
        } else if (orgId) {
          // Vereinfachte Strategie: Hole ALLE Lizenzen von Customers dieser Organisation
          // Dies stellt sicher, dass PayPal-Lizenzen erscheinen, unabhängig von der orgId der Lizenz
          const orgIdStr = String(orgId).trim();
          
          try {
            // 1. Hole alle Customers dieser Organisation
            const orgCustomers = await db
              .select({ id: customers.id })
              .from(customers)
              .where(sql`${customers.orgId}::text = ${orgIdStr}`);
            
            const customerIds = orgCustomers.map((c) => String(c.id));
            
            console.log(`[licenses] orgId: ${orgIdStr}, found ${orgCustomers.length} customers`);
            
            // 2. Hole ALLE Lizenzen dieser Customers (unabhängig von der orgId der Lizenz)
            // Dies ist wichtig für PayPal-Lizenzen, die möglicherweise eine andere orgId haben
            let customerLicenses: DbLicense[] = [];
            if (customerIds.length > 0) {
              customerLicenses = await db
                .select()
                .from(licenses)
                .where(inArray(licenses.customerId as any, customerIds))
                .orderBy(desc(licenses.createdAt))
                .limit(200);
              
              console.log(`[licenses] customerLicenses: ${customerLicenses.length}`);
            }
            
            // 3. Hole auch Lizenzen, die direkt zur Organisation gehören (ohne Customer)
            const directLicenses = await db
              .select()
              .from(licenses)
              .where(sql`${licenses.orgId}::text = ${orgIdStr}`)
              .orderBy(desc(licenses.createdAt))
              .limit(200);
            
            console.log(`[licenses] directLicenses: ${directLicenses.length}`);
            
            // 4. Kombiniere beide Ergebnisse und entferne Duplikate
            const allItems = [...customerLicenses, ...directLicenses];
            const uniqueItems = new Map<string, DbLicense>();
            for (const item of allItems) {
              uniqueItems.set(item.id, item);
            }
            
            items = Array.from(uniqueItems.values())
              .sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
              })
              .slice(0, 200);
            
            console.log(`[licenses] final items count: ${items.length}`);
          } catch (queryErr) {
            console.error("[licenses] Error in query:", queryErr);
            throw queryErr;
          }
        } else {
          items = await db
            .select()
            .from(licenses)
            .orderBy(desc(licenses.createdAt))
            .limit(200);
        }

      // Devices pro License zählen
      let itemsWithCounts = items.map((lic: DbLicense) => ({
        ...lic,
        devicesCount: 0 as number,
      }));

      if (items.length > 0) {
        const licenseIds = items.map((lic: DbLicense) => lic.id);

        const counts = await db
          .select({
            licenseId: devices.licenseId,
            count: sql<number>`count(*)`,
          })
          .from(devices)
          .where(inArray(devices.licenseId, licenseIds))
          .groupBy(devices.licenseId);

        const countMap = new Map<string, number>();
        for (const row of counts) {
          if (row.licenseId) {
            countMap.set(row.licenseId, row.count);
          }
        }

        itemsWithCounts = items.map((lic: DbLicense) => ({
          ...lic,
          devicesCount: countMap.get(lic.id) ?? 0,
        }));
      }

      // Status für alle Lizenzen berechnen (prüft auf Ablauf)
      const itemsWithCorrectStatus = await Promise.all(
        itemsWithCounts.map(async (lic) => {
          const calculatedStatus = await calculateLicenseStatus(lic);
          return {
            ...lic,
            status: calculatedStatus,
          };
        })
      );

      return {
        items: itemsWithCorrectStatus,
        total: itemsWithCorrectStatus.length,
        limit: 200,
        offset: 0,
      };
    } catch (err) {
      console.error("Error loading licenses list", err);
      console.error("orgId:", orgId);
      console.error("customerId:", customerId);
      reply.code(500);
      return { error: "Failed to load licenses", details: err instanceof Error ? err.message : String(err) };
    }
  });

  // ---------------------------------------------------------------------------
  // Portal-Lizenzen (automatisch generiert durch Kundenportal)
  // ---------------------------------------------------------------------------
  app.get("/licenses/portal", async (request, reply) => {
    const user = (request as any).user;
    const isAdmin = !!(user?.adminUserId); // Admin-JWT hat adminUserId
    const orgId = user?.orgId as string | undefined;

    try {
      // Portal-Lizenzen: Zeige ALLE Lizenzen, die zu einem Customer gehören (unabhängig von orgId)
      // Das sind automatisch generierte Portal-Lizenzen (Trial, PayPal-Upgrades, etc.)
      // Admin-User können ALLE Portal-Lizenzen sehen, normale User nur ihre eigenen
      
      console.log(`[licenses/portal] Searching for portal licenses (isAdmin: ${isAdmin})`);
      
      // Hole ALLE Lizenzen, die zu einem Customer gehören (das sind Portal-Lizenzen)
      // Admin-User sehen alle, normale User nur die ihrer Org
      let portalLicenses;
      if (isAdmin) {
        // Admin: Alle Portal-Lizenzen (mit customerId)
        portalLicenses = await db
          .select()
          .from(licenses)
          .where(sql`${licenses.customerId} IS NOT NULL`)
          .orderBy(desc(licenses.createdAt))
          .limit(200);
      } else {
        // Normaler User: Nur Portal-Lizenzen seiner Org
        if (!orgId) {
          reply.code(400);
          return { error: "Missing orgId on user" };
        }
        portalLicenses = await db
          .select()
          .from(licenses)
          .where(
            and(
              sql`${licenses.customerId} IS NOT NULL`,
              eq(licenses.orgId, orgId)
            )
          )
          .orderBy(desc(licenses.createdAt))
          .limit(200);
      }
      
      console.log(`[licenses/portal] Found ${portalLicenses.length} portal licenses (all licenses with customerId)`);
      for (const lic of portalLicenses) {
        console.log(`[licenses/portal] License: ${lic.key}, plan=${lic.plan}, customerId=${lic.customerId}, orgId=${lic.orgId}, subscriptionId=${lic.subscriptionId}`);
      }
      
      if (portalLicenses.length === 0) {
        return {
          items: [],
          total: 0,
          limit: 200,
          offset: 0,
        };
      }

      // Devices pro License zählen
      let itemsWithCounts = portalLicenses.map((lic: DbLicense) => ({
        ...lic,
        devicesCount: 0 as number,
      }));

      if (portalLicenses.length > 0) {
        const licenseIdList = portalLicenses.map((lic: DbLicense) => lic.id);

        const counts = await db
          .select({
            licenseId: devices.licenseId,
            count: sql<number>`count(*)`,
          })
          .from(devices)
          .where(inArray(devices.licenseId, licenseIdList))
          .groupBy(devices.licenseId);

        const countMap = new Map<string, number>();
        for (const row of counts) {
          if (row.licenseId) {
            countMap.set(row.licenseId, row.count);
          }
        }

        itemsWithCounts = portalLicenses.map((lic: DbLicense) => ({
          ...lic,
          devicesCount: countMap.get(lic.id) ?? 0,
        }));
      }

      // Status für alle Portal-Lizenzen berechnen (prüft auf Ablauf)
      const itemsWithCorrectStatus = await Promise.all(
        itemsWithCounts.map(async (lic) => {
          const calculatedStatus = await calculateLicenseStatus(lic);
          return {
            ...lic,
            status: calculatedStatus,
          };
        })
      );

      return {
        items: itemsWithCorrectStatus,
        total: itemsWithCorrectStatus.length,
        limit: 200,
        offset: 0,
      };
    } catch (err) {
      console.error("Error loading portal licenses", err);
      reply.code(500);
      return {
        error: "Failed to load portal licenses",
        details: err instanceof Error ? err.message : String(err),
      };
    }
  });

  // ---------------------------------------------------------------------------
  // Neue License anlegen (Admin / Cloud-Backend)
  // ---------------------------------------------------------------------------
  app.post<{ Body: CreateLicenseBody }>("/licenses", async (request, reply) => {
    const user = (request as any).user;
    const isAdmin = !!(user?.adminUserId); // Admin-JWT hat adminUserId
    const orgId = user?.orgId as string | undefined;

    const body = request.body;

    if (!body.plan) {
      reply.code(400);
      return { error: "plan is required" };
    }

    const maxDevices = body.maxDevices ?? 1;

    const customerId =
      body.customerId && body.customerId.trim().length > 0
        ? body.customerId
        : null;

    // Bestimme orgId: Wenn Admin, hole orgId vom Customer (falls customerId vorhanden)
    let finalOrgId: string | null = null;
    
    if (isAdmin) {
      // Admin: orgId vom Customer holen
      if (customerId) {
        const [customer] = await db
          .select({ orgId: customers.orgId })
          .from(customers)
          .where(eq(customers.id, customerId))
          .limit(1);
        
        if (!customer) {
          reply.code(404);
          return { error: "Customer not found" };
        }
        
        if (!customer.orgId) {
          reply.code(400);
          return { error: "Customer has no orgId" };
        }
        
        finalOrgId = customer.orgId;
      } else {
        reply.code(400);
        return { error: "customerId is required when creating license as admin" };
      }
    } else {
      // Normaler User: orgId vom JWT
      if (!orgId) {
        reply.code(400);
        return { error: "Missing orgId on user" };
      }
      finalOrgId = orgId;
    }

    const key = generateLicenseKey("CSTY");

    try {
      const [created] = await db
        .insert(licenses)
        .values({
          orgId: finalOrgId,
          customerId,
          subscriptionId: body.subscriptionId ?? null,
          key,
          plan: body.plan,
          maxDevices,
          status: "active",
          validFrom: new Date(body.validFrom),
          validUntil: new Date(body.validUntil),
        })
        .returning();

      await db.insert(licenseEvents).values({
        orgId: finalOrgId,
        licenseId: created.id,
        type: "created",
        metadata: {
          byUserId: user?.userId ?? null,
          byAdminUserId: user?.adminUserId ?? null,
        },
      });

      reply.code(201);
      return { item: created };
    } catch (err) {
      console.error("Error creating license", err);
      reply.code(500);
      return { error: "Failed to create license" };
    }
  });

  // ---------------------------------------------------------------------------
  // Einzelne License holen
  // ---------------------------------------------------------------------------
  app.get<{ Params: { id: string } }>(
    "/licenses/:id",
    async (request, reply) => {
      const { id } = request.params;
      const user = (request as any).user;
      const orgId = user?.orgId as string | undefined;

      try {
        // Lizenz direkt nach ID laden (ID ist eindeutig)
        // Optional: Wenn orgId vorhanden ist, können wir prüfen, ob sie übereinstimmt,
        // aber wir geben die Lizenz trotzdem zurück, da die ID eindeutig ist
        const [item] = await db
          .select()
          .from(licenses)
          .where(eq(licenses.id, id))
          .limit(1);

        if (!item) {
          reply.code(404);
          return { error: "License not found" };
        }

        // Optional: Prüfe, ob die orgId übereinstimmt (für Sicherheit)
        // Aber wir geben die Lizenz trotzdem zurück, da Admin-User Zugriff haben sollten
        if (orgId && item.orgId !== orgId) {
          // Warnung loggen, aber Lizenz trotzdem zurückgeben
          console.warn(
            `License ${id} belongs to org ${item.orgId}, but user belongs to org ${orgId}`,
          );
        }

        return { item };
      } catch (err) {
        console.error("Error loading license", err);
        reply.code(500);
        return { error: "Failed to load license" };
      }
    },
  );

  // ---------------------------------------------------------------------------
  // Events zu einer License
  // ---------------------------------------------------------------------------
  app.get<{ Params: { id: string } }>(
    "/licenses/:id/events",
    async (request, reply) => {
      const { id } = request.params;
      const user = (request as any).user;
      const orgId = user?.orgId as string | undefined;

      try {
        // Events direkt nach licenseId laden (licenseId ist eindeutig)
        // Optional: Wenn orgId vorhanden ist, können wir prüfen, ob sie übereinstimmt,
        // aber wir geben die Events trotzdem zurück, da die licenseId eindeutig ist
        const rows = await db
          .select()
          .from(licenseEvents)
          .where(eq(licenseEvents.licenseId, id))
          .orderBy(desc(licenseEvents.createdAt))
          .limit(100);

        return {
          items: rows,
          total: rows.length,
          limit: 100,
          offset: 0,
        };
      } catch (err) {
        console.error("Error loading license events", err);
        reply.code(500);
        return { error: "Failed to load license events" };
      }
    },
  );

  // ---------------------------------------------------------------------------
  // License revoken
  // ---------------------------------------------------------------------------
  app.post<{ Params: { id: string }; Body: RevokeBody }>(
    "/licenses/:id/revoke",
    async (request, reply) => {
      const { id } = request.params;
      const { reason } = request.body ?? {};
      const user = (request as any).user;
      const orgId = user?.orgId as string | undefined;

      try {
        const [updated] = await db
          .update(licenses)
          .set({
            status: "revoked",
            updatedAt: new Date(),
          })
          .where(
            orgId
              ? and(eq(licenses.id, id), eq(licenses.orgId, orgId))
              : eq(licenses.id, id),
          )
          .returning();

        if (!updated) {
          reply.code(404);
          return { error: "License not found" };
        }

        await db.insert(licenseEvents).values({
          orgId: updated.orgId,
          licenseId: updated.id,
          type: "revoked",
          metadata: reason ? { reason } : null,
        });

        return { item: updated };
      } catch (err) {
        console.error("Error revoking license", err);
        reply.code(500);
        return { error: "Failed to revoke license" };
      }
    },
  );

  // ---------------------------------------------------------------------------
  // License endgültig löschen
  // ---------------------------------------------------------------------------
  app.delete<{ Params: { id: string } }>(
    "/licenses/:id",
    async (request, reply) => {
      const { id } = request.params;
      const user = (request as any).user;
      const orgId = user?.orgId as string | undefined;

      try {
        // Prüfe zuerst, ob die Lizenz existiert und zur Organisation gehört
        const [existing] = await db
          .select()
          .from(licenses)
          .where(eq(licenses.id, id))
          .limit(1);

        if (!existing) {
          reply.code(404);
          return { error: "License not found" };
        }

        // Optional: Prüfe orgId (aber erlaube Löschen auch wenn orgId nicht übereinstimmt für Admin)
        if (orgId && existing.orgId !== orgId) {
          console.warn(
            `License ${id} belongs to org ${existing.orgId}, but user belongs to org ${orgId}`,
          );
        }

        // Entferne die Verknüpfung von Devices zu dieser Lizenz
        await db
          .update(devices)
          .set({ licenseId: null })
          .where(eq(devices.licenseId, id));

        // Lösche alle Events dieser Lizenz
        await db
          .delete(licenseEvents)
          .where(eq(licenseEvents.licenseId, id));

        // Lösche die Lizenz
        const deleted = await db
          .delete(licenses)
          .where(eq(licenses.id, id))
          .returning();

        if (deleted.length === 0) {
          reply.code(404);
          return { error: "License not found" };
        }

        return { ok: true };
      } catch (err) {
        console.error("Error deleting license", err);
        reply.code(500);
        return { error: "Failed to delete license" };
      }
    },
  );
}
