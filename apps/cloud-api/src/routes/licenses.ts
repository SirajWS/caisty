// apps/cloud-api/src/routes/licenses.ts
import type { FastifyInstance } from "fastify";
import { db } from "../db/client";
import { licenses } from "../db/schema/licenses";
import { licenseEvents } from "../db/schema/licenseEvents";
import { generateLicenseKey } from "../lib/licenseKey";
import { eq, and, desc } from "drizzle-orm";

type CreateLicenseBody = {
  customerId: string;
  subscriptionId?: string | null;
  plan: string;           // z.B. "starter" | "pro"
  maxDevices: number;
  validFrom: string;      // ISO-String
  validUntil: string;     // ISO-String
};

export async function registerLicensesRoutes(app: FastifyInstance) {
  // Hilfsfunktion, um orgId aus dem Token zu holen
  function getOrgId(request: any): string | null {
    const user = request.user as { orgId?: string } | undefined;
    return user?.orgId ?? null;
  }

  // 🔹 Liste aller Licenses der Organisation
  app.get("/licenses", async (request) => {
    const orgId = getOrgId(request as any);
    if (!orgId) {
      return { items: [], total: 0, limit: 0, offset: 0 };
    }

    const items = await db
      .select()
      .from(licenses)
      .where(eq(licenses.orgId, orgId));

    return {
      items,
      total: items.length,
      limit: items.length,
      offset: 0,
    };
  });

  // 🔹 Einzelne License per ID holen
  app.get<{ Params: { id: string } }>("/licenses/:id", async (request, reply) => {
    const orgId = getOrgId(request as any);
    const { id } = request.params;

    if (!orgId) {
      reply.code(400);
      return { item: null, error: "Missing orgId in token" };
    }

    const [item] = await db
      .select()
      .from(licenses)
      .where(and(eq(licenses.orgId, orgId), eq(licenses.id, id)))
      .limit(1);

    if (!item) {
      reply.code(404);
      return { item: null };
    }

    return { item };
  });

  // 🔹 Events zu einer License
  app.get<{ Params: { id: string } }>(
    "/licenses/:id/events",
    async (request, reply) => {
      const orgId = getOrgId(request as any);
      const { id } = request.params;

      if (!orgId) {
        reply.code(400);
        return { items: [], total: 0, limit: 0, offset: 0 };
      }

      const items = await db
        .select()
        .from(licenseEvents)
        .where(and(eq(licenseEvents.orgId, orgId), eq(licenseEvents.licenseId, id)))
        .orderBy(desc(licenseEvents.createdAt))
        .limit(100);

      return {
        items,
        total: items.length,
        limit: items.length,
        offset: 0,
      };
    },
  );

  // 🔹 License anlegen
  app.post<{ Body: CreateLicenseBody }>("/licenses", async (request, reply) => {
    const orgId = getOrgId(request as any);

    if (!orgId) {
      reply.code(400);
      return { error: "Missing orgId in token" };
    }

    const {
      customerId,
      subscriptionId,
      plan,
      maxDevices,
      validFrom,
      validUntil,
    } = request.body;

    const key = generateLicenseKey();

    const [license] = await db
      .insert(licenses)
      .values({
        orgId,
        customerId,
        subscriptionId: subscriptionId ?? null,
        key,
        plan,
        maxDevices,
        status: "active",
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
      })
      .returning();

    // Event "created" loggen
    await db.insert(licenseEvents).values({
      orgId,
      licenseId: license.id,
      type: "created",
      metadata: {},
    });

    reply.code(201);
    return { item: license };
  });
}
