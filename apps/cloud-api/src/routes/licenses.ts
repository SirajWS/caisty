// apps/cloud-api/src/routes/licenses.ts
import type { FastifyInstance } from "fastify";
import { db } from "../db/client";
import { licenses } from "../db/schema/licenses";
import { licenseEvents } from "../db/schema/licenseEvents";
import { and, desc, eq } from "drizzle-orm";

type CreateLicenseBody = {
  customerId: string;
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

    const items = await db
      .select()
      .from(licenses)
      .where(orgId ? eq(licenses.orgId, orgId) : undefined)
      .orderBy(desc(licenses.createdAt))
      .limit(200);

    return {
      items,
      total: items.length,
      limit: 200,
      offset: 0,
    };
  });

  // Neue License anlegen
  app.post<{ Body: CreateLicenseBody }>("/licenses", async (request, reply) => {
    const user = (request as any).user;
    const orgId = user?.orgId;

    const body = request.body;

    if (!orgId) {
      reply.code(400);
      return { error: "Missing orgId on user" };
    }

    if (!body.customerId || !body.plan) {
      reply.code(400);
      return {
        error: "customerId and plan are required",
      };
    }

    const maxDevices = body.maxDevices ?? 1;

    const [created] = await db
      .insert(licenses)
      .values({
        orgId,
        customerId: body.customerId,
        subscriptionId: body.subscriptionId ?? null,
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

  // License revoken
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
