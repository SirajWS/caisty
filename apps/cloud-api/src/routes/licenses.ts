// apps/cloud-api/src/routes/licenses.ts
import type { FastifyInstance } from "fastify";
import { db } from "../db/client";
import { licenses } from "../db/schema/licenses";
import { licenseEvents } from "../db/schema/licenseEvents";
import { devices } from "../db/schema/devices";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { generateLicenseKey } from "../lib/licenseKey";

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

export async function registerLicensesRoutes(app: FastifyInstance) {
  // Liste aller Lizenzen der aktuellen Org
  app.get("/licenses", async (request) => {
    const user = (request as any).user;
    const orgId = user?.orgId;

    // 1) Basis-Liste der Lizenzen laden
    const items = await db
      .select()
      .from(licenses)
      .where(orgId ? eq(licenses.orgId, orgId) : undefined)
      .orderBy(desc(licenses.createdAt))
      .limit(200);

    // 2) Devices pro License zählen
    let itemsWithCounts = items.map((lic) => ({
      ...lic,
      devicesCount: 0 as number,
    }));

    if (items.length > 0) {
      const licenseIds = items.map((lic) => lic.id);

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

      itemsWithCounts = items.map((lic) => ({
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
  });

  // Neue License anlegen
  app.post<{ Body: CreateLicenseBody }>("/licenses", async (request, reply) => {
    const user = (request as any).user;
    const orgId = user?.orgId;

    if (!orgId) {
      reply.code(400);
      return { error: "Missing orgId on user" };
    }

    const body = request.body;

    // Nur der Plan ist Pflicht – customerId ist optional
    if (!body.plan) {
      reply.code(400);
      return { error: "plan is required" };
    }

    const maxDevices = body.maxDevices ?? 1;

    // leere Strings -> null
    const customerId =
      body.customerId && body.customerId.trim().length > 0
        ? body.customerId
        : null;

    // License-Key generieren
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
          byUserId: user?.userId,
        },
      });

      reply.code(201);
      return { item: created };
    } catch (err: any) {
      console.error("Error creating license", err);
      reply.code(500);
      return { error: "Failed to create license" };
    }
  });

  // Einzelne License
  app.get<{ Params: { id: string } }>("/licenses/:id", async (request, reply) => {
    const { id } = request.params;
    const user = (request as any).user;
    const orgId = user?.orgId;

    const [item] = await db
      .select()
      .from(licenses)
      .where(
        and(
          eq(licenses.id, id),
          orgId ? eq(licenses.orgId, orgId) : undefined,
        ),
      )
      .limit(1);

    if (!item) {
      reply.code(404);
      return { error: "License not found" };
    }

    return { item };
  });

  // Events zu einer License
  app.get<{ Params: { id: string } }>(
    "/licenses/:id/events",
    async (request, reply) => {
      const { id } = request.params;
      const user = (request as any).user;
      const orgId = user?.orgId;

      const rows = await db
        .select()
        .from(licenseEvents)
        .where(
          and(
            eq(licenseEvents.licenseId, id),
            orgId ? eq(licenseEvents.orgId, orgId) : undefined,
          ),
        )
        .orderBy(desc(licenseEvents.createdAt))
        .limit(100);

      return {
        items: rows,
        total: rows.length,
        limit: 100,
        offset: 0,
      };
    },
  );

  // License revoken (nutzen wir auch als "Löschen" für generierte Keys)
  app.post<{ Params: { id: string }; Body: RevokeBody }>(
    "/licenses/:id/revoke",
    async (request, reply) => {
      const { id } = request.params;
      const { reason } = request.body ?? {};
      const user = (request as any).user;
      const orgId = user?.orgId;

      const [updated] = await db
        .update(licenses)
        .set({
          status: "revoked",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(licenses.id, id),
            orgId ? eq(licenses.orgId, orgId) : undefined,
          ),
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
    },
  );
}
