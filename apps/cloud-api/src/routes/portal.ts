// apps/cloud-api/src/routes/portal.ts
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { and, desc, eq, sql, isNotNull } from "drizzle-orm";

import { db } from "../db/client";
import { licenses, devices, invoices } from "../db/schema";
import { verifyPortalToken } from "../lib/portalJwt";

type PortalJwtPayload = {
  customerId: string;
  orgId: string;
  iat: number;
  exp: number;
};

async function requirePortalUser(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<PortalJwtPayload | null> {
  const auth = request.headers.authorization;

  if (!auth || !auth.startsWith("Bearer ")) {
    reply.code(401);
    await reply.send({ error: "missing_authorization" });
    return null;
  }

  const token = auth.slice("Bearer ".length);

  try {
    return verifyPortalToken(token) as PortalJwtPayload;
  } catch (err) {
    request.log.warn({ err }, "Invalid portal token");
    reply.code(401);
    await reply.send({ error: "invalid_token" });
    return null;
  }
}

export async function registerPortalRoutes(app: FastifyInstance) {
  //
  // GET /portal/licenses
  // -> Lizenzen für den eingeloggten Customer
  //
  app.get("/portal/licenses", async (request, reply) => {
    const payload = await requirePortalUser(request, reply);
    if (!payload) return;

    // Hole ALLE Lizenzen dieses Customers, unabhängig von der orgId der Lizenz
    // Dies ist wichtig für Upgrade-Lizenzen, die möglicherweise eine andere orgId haben
    const rows = await db
      .select({
        id: licenses.id,
        key: licenses.key,
        plan: licenses.plan,
        status: licenses.status,
        maxDevices: licenses.maxDevices,
        validFrom: licenses.validFrom,
        validUntil: licenses.validUntil,
        createdAt: licenses.createdAt,
      })
      .from(licenses)
      .where(eq(licenses.customerId, payload.customerId))
      .orderBy(desc(licenses.createdAt));

    // Geräte-Anzahl pro License (für usedDevices)
    const deviceCounts = await db
      .select({
        licenseId: devices.licenseId,
        cnt: sql<number>`count(*)`,
      })
      .from(devices)
      .where(
        and(
          eq(devices.orgId, payload.orgId),
          eq(devices.customerId, payload.customerId),
          isNotNull(devices.licenseId)
        )
      )
      .groupBy(devices.licenseId);

    const countMap = new Map<string, number>();
    for (const row of deviceCounts) {
      if (row.licenseId) {
        countMap.set(row.licenseId, row.cnt);
      }
    }

    // Status für alle Lizenzen berechnen (prüft auf Ablauf)
    const now = new Date();
    const result = await Promise.all(
      rows.map(async (lic: any) => {
        let calculatedStatus = lic.status;
        
        // Prüfe, ob die Lizenz abgelaufen ist
        if (lic.validUntil && lic.validUntil.getTime() < now.getTime()) {
          // Status in Datenbank aktualisieren, wenn noch nicht expired
          if (lic.status !== "expired") {
            try {
              await db
                .update(licenses)
                .set({
                  status: "expired",
                  updatedAt: now,
                } as any)
                .where(eq(licenses.id, lic.id));
            } catch (err) {
              console.error(`Error updating license ${lic.id} to expired:`, err);
            }
          }
          calculatedStatus = "expired";
        } else if (lic.validFrom && lic.validFrom.getTime() > now.getTime()) {
          calculatedStatus = "inactive";
        }
        
        return {
          id: lic.id,
          key: lic.key,
          plan: lic.plan, // "starter" | "pro"
          status: calculatedStatus, // "active" | "revoked" | "expired" | ...
          maxDevices: lic.maxDevices,
          usedDevices: countMap.get(lic.id) ?? 0,
          validFrom: lic.validFrom.toISOString(),
          validUntil: lic.validUntil.toISOString(),
          createdAt: lic.createdAt.toISOString(),
        };
      })
    );

    return result;
  });

  //
  // GET /portal/devices
  // -> Alle Geräte für den Customer
  //
  app.get("/portal/devices", async (request, reply) => {
    const payload = await requirePortalUser(request, reply);
    if (!payload) return;

    const rows = await db
      .select({
        id: devices.id,
        name: devices.name,
        deviceId: devices.deviceId,
        lastSeenAt: devices.lastSeenAt,
        createdAt: devices.createdAt,
        licenseKey: licenses.key,
      })
      .from(devices)
      .leftJoin(licenses, eq(devices.licenseId, licenses.id))
      .where(
        and(
          eq(devices.orgId, payload.orgId),
          eq(devices.customerId, payload.customerId)
        )
      )
      .orderBy(desc(devices.createdAt));

    const now = Date.now();

    const result = rows.map((row) => {
      let status: "online" | "offline" | "never_seen" = "never_seen";

      if (row.lastSeenAt) {
        const diffMinutes =
          (now - row.lastSeenAt.getTime()) / (1000 * 60);
        status = diffMinutes <= 5 ? "online" : "offline";
      }

      return {
        id: row.id,
        name: row.name,
        deviceId: row.deviceId,
        lastSeenAt: row.lastSeenAt
          ? row.lastSeenAt.toISOString()
          : null,
        status,
        licenseKey: row.licenseKey ?? null,
      };
    });

    return result;
  });

  //
  // GET /portal/invoices
  // -> Rechnungen des Customers
  //
  app.get("/portal/invoices", async (request, reply) => {
    const payload = await requirePortalUser(request, reply);
    if (!payload) return;

    const rows = await db
      .select({
        id: invoices.id,
        number: invoices.number,
        amount: invoices.amount,
        currency: invoices.currency,
        status: invoices.status,
        periodFrom: invoices.periodFrom,
        periodTo: invoices.periodTo,
        createdAt: invoices.createdAt,
        downloadUrl: invoices.pdfUrl,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.orgId, payload.orgId),
          eq(invoices.customerId, payload.customerId)
        )
      )
      .orderBy(desc(invoices.createdAt));

    const result = rows.map((inv) => ({
      id: inv.id,
      number: inv.number,
      amount: inv.amount,
      currency: inv.currency,
      status: inv.status as "open" | "paid" | "overdue" | "failed",
      periodFrom: inv.periodFrom
        ? inv.periodFrom.toISOString()
        : null,
      periodTo: inv.periodTo ? inv.periodTo.toISOString() : null,
      createdAt: inv.createdAt.toISOString(),
      downloadUrl: inv.downloadUrl ?? null,
    }));

    return result;
  });
}
