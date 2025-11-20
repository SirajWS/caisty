// apps/cloud-api/src/routes/licenses.ts
import type { FastifyInstance } from "fastify";
import { db } from "../db/client";
import { licenses, type NewLicense } from "../db/schema/licenses";
import { licenseEvents } from "../db/schema/licenseEvents";
import { and, desc, eq, sql } from "drizzle-orm";
import { generateLicenseKey } from "../lib/licenseKey";

type JwtUser = {
  orgId?: string;
  userId?: string;
  role?: string;
};

function getOrgIdFromRequest(request: any): string {
  const user = request.user as JwtUser | undefined;
  if (!user?.orgId) {
    throw new Error("Missing orgId on JWT payload");
  }
  return user.orgId;
}

type CreateLicenseBody = {
  customerId: string;
  subscriptionId?: string | null;
  plan: string;
  maxDevices?: number;
  validFrom?: string | null;
  validUntil?: string | null;
};

type UpdateLicenseBody = {
  status?: string;
  maxDevices?: number;
  validUntil?: string | null;
};

export async function registerLicensesRoutes(app: FastifyInstance) {
  // Liste aller Lizenzen für die Org
  app.get("/licenses", async (request) => {
    const orgId = getOrgIdFromRequest(request);
    const limit = 50;
    const offset = 0;

    const items = await db
      .select()
      .from(licenses)
      .where(eq(licenses.orgId, orgId))
      .orderBy(desc(licenses.createdAt))
      .limit(limit)
      .offset(offset);

    const [countRow] = await db
      .select({ value: sql<number>`count(*)` })
      .from(licenses)
      .where(eq(licenses.orgId, orgId));

    return {
      items,
      total: countRow?.value ?? items.length,
      limit,
      offset,
    };
  });

  // Einzelne Lizenz (für Detail-View später)
  app.get<{
    Params: { id: string };
  }>("/licenses/:id", async (request, reply) => {
    const orgId = getOrgIdFromRequest(request);
    const { id } = request.params;

    const [license] = await db
      .select()
      .from(licenses)
      .where(and(eq(licenses.orgId, orgId), eq(licenses.id, id)))
      .limit(1);

    if (!license) {
      reply.code(404);
      return { error: "License not found" };
    }

    return { item: license };
  });

  // Neue Lizenz anlegen
  app.post<{
    Body: CreateLicenseBody;
  }>("/licenses", async (request, reply) => {
    const orgId = getOrgIdFromRequest(request);
    const body = request.body;

    if (!body.customerId || !body.plan) {
      reply.code(400);
      return { error: "customerId and plan are required" };
    }

    const now = new Date();
    const key = generateLicenseKey("CSTY");

    const insertData: NewLicense = {
      orgId,
      customerId: body.customerId,
      subscriptionId: body.subscriptionId ?? null,
      key,
      plan: body.plan,
      maxDevices: body.maxDevices ?? 1,
      status: "active",
      validFrom: body.validFrom ? new Date(body.validFrom) : now,
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
      // createdAt/updatedAt kommen über Default
    } as NewLicense;

    const [created] = await db.insert(licenses).values(insertData).returning();

    await db.insert(licenseEvents).values({
      orgId,
      licenseId: created.id,
      type: "issued",
      metadata: {
        plan: created.plan,
        maxDevices: created.maxDevices,
      },
    });

    reply.code(201);
    return { item: created };
  });

  // Lizenz updaten (Status, maxDevices, validUntil)
  app.patch<{
    Params: { id: string };
    Body: UpdateLicenseBody;
  }>("/licenses/:id", async (request, reply) => {
    const orgId = getOrgIdFromRequest(request);
    const { id } = request.params;
    const body = request.body;

    const updateData: Partial<NewLicense> = {};
    const changedFields: string[] = [];

    if (body.status) {
      (updateData as any).status = body.status;
      changedFields.push("status");
    }
    if (typeof body.maxDevices === "number") {
      (updateData as any).maxDevices = body.maxDevices;
      changedFields.push("maxDevices");
    }
    if (body.validUntil !== undefined) {
      (updateData as any).validUntil =
        body.validUntil === null ? null : new Date(body.validUntil);
      changedFields.push("validUntil");
    }

    (updateData as any).updatedAt = new Date();

    if (changedFields.length === 0) {
      return { warning: "Nothing to update" };
    }

    const [updated] = await db
      .update(licenses)
      .set(updateData)
      .where(and(eq(licenses.orgId, orgId), eq(licenses.id, id)))
      .returning();

    if (!updated) {
      reply.code(404);
      return { error: "License not found" };
    }

    await db.insert(licenseEvents).values({
      orgId,
      licenseId: updated.id,
      type: "updated",
      metadata: {
        fields: changedFields,
      },
    });

    return { item: updated };
  });
}
