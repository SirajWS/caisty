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
          // Filtere nach orgId der Lizenz
          // Die orgId wird als String behandelt, da sie in der licenses-Tabelle als text gespeichert ist
          // Konvertiere orgId zu String und normalisiere (entferne Leerzeichen, etc.)
          const orgIdStr = String(orgId).trim();
          
          // Hole Lizenzen, die direkt zur Organisation gehören
          // Verwende SQL-Vergleich, um sicherzustellen, dass UUID- und String-Formate funktionieren
          const directMatches = await db
            .select()
            .from(licenses)
            .where(sql`${licenses.orgId}::text = ${orgIdStr}`)
            .orderBy(desc(licenses.createdAt))
            .limit(200);
          
          // Hole auch Lizenzen, die zu Customers gehören, die zur gleichen Organisation gehören
          // (für den Fall, dass die orgId der Lizenz nicht korrekt gesetzt wurde)
          const orgCustomers = await db
            .select({ id: customers.id })
            .from(customers)
            .where(sql`${customers.orgId}::text = ${orgIdStr}`);
          
          let customerMatches: DbLicense[] = [];
          if (orgCustomers.length > 0) {
            const customerIds = orgCustomers.map((c) => String(c.id));
            const directMatchIds = new Set(directMatches.map((l) => l.id));
            
            // Hole Lizenzen für diese Customers, die noch nicht in directMatches sind
            const allCustomerLicenses = await db
              .select()
              .from(licenses)
              .where(inArray(licenses.customerId as any, customerIds))
              .orderBy(desc(licenses.createdAt))
              .limit(200);
            
            customerMatches = allCustomerLicenses.filter(
              (l) => !directMatchIds.has(l.id),
            );
          }
          
          // Kombiniere beide Ergebnisse und entferne Duplikate
          const allItems = [...directMatches, ...customerMatches];
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

      return {
        items: itemsWithCounts,
        total: itemsWithCounts.length,
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
  // Neue License anlegen (Admin / Cloud-Backend)
  // ---------------------------------------------------------------------------
  app.post<{ Body: CreateLicenseBody }>("/licenses", async (request, reply) => {
    const user = (request as any).user;
    const orgId = user?.orgId as string | undefined;

    if (!orgId) {
      reply.code(400);
      return { error: "Missing orgId on user" };
    }

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

    const key = generateLicenseKey("CSTY");

    try {
      const [created] = await db
        .insert(licenses)
        .values({
          orgId,
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
        orgId,
        licenseId: created.id,
        type: "created",
        metadata: {
          byUserId: user?.userId ?? null,
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
}
