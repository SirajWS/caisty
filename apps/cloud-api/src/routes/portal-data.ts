import type { FastifyInstance, FastifyRequest } from "fastify";
import { db } from "../db/client.js";
import { licenses } from "../db/schema/licenses.js";
import { devices } from "../db/schema/devices.js";
import { invoices } from "../db/schema/invoices.js";
import { desc, eq } from "drizzle-orm";
import { verifyPortalToken } from "../lib/portalJwt.js";

interface PortalJwtPayload {
  customerId: string;
  orgId: string;
  iat: number;
  exp: number;
}

function getPortalAuth(request: FastifyRequest): PortalJwtPayload {
  const auth = request.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) throw new Error("Missing portal token");
  const token = auth.slice("Bearer ".length);
  return verifyPortalToken(token) as PortalJwtPayload;
}

export async function registerPortalDataRoutes(app: FastifyInstance) {
  // -------------------------------------------------------------------------
  // 1) PORTAL DEVICES – gruppiert nach Fingerprint
  // -------------------------------------------------------------------------
  app.get("/portal/devices", async (request, reply) => {
    let payload: PortalJwtPayload;
    try {
      payload = getPortalAuth(request);
    } catch {
      reply.code(401);
      return { message: "Invalid or missing portal token" };
    }

    const rows = await db
      .select({
        id: devices.id,
        name: devices.name,
        type: devices.type,
        status: devices.status,
        fingerprint: devices.fingerprint,
        createdAt: devices.createdAt,
        lastSeenAt: devices.lastSeenAt,
        lastHeartbeatAt: devices.lastHeartbeatAt,
        licenseKey: licenses.key,
        licensePlan: licenses.plan,
      })
      .from(devices)
      .leftJoin(licenses, eq(devices.licenseId, licenses.id))
      .where(eq(devices.customerId, payload.customerId))
      .orderBy(desc(devices.createdAt));

    const grouped = Object.values(
      rows.reduce((acc: Record<string, any>, row: any) => {
        const key = row.fingerprint || row.id;
        if (!acc[key]) {
          acc[key] = {
            fingerprint: row.fingerprint,
            name: row.name,
            type: row.type,
            status: row.status,
            createdAt: row.createdAt,
            lastSeenAt: row.lastSeenAt,
            lastHeartbeatAt: row.lastHeartbeatAt,
            licenseKeys: [],
          };
        }
        if (row.licenseKey) {
          acc[key].licenseKeys.push({
            key: row.licenseKey,
            plan: row.licensePlan,
          });
        }
        return acc;
      }, {} as Record<string, any>) as any[]
    );

    return grouped;
  });

  // -------------------------------------------------------------------------
  // 2) PORTAL LICENSES - entfernt, da jetzt in portal-licenses.ts
  // Die Route wurde nach portal-licenses.ts verschoben
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // 3) PORTAL INVOICES (unverändert)
  // -------------------------------------------------------------------------
  app.get("/portal/invoices", async (request, reply) => {
    let payload: PortalJwtPayload;
    try {
      payload = getPortalAuth(request);
    } catch {
      reply.code(401);
      return { message: "Invalid or missing portal token" };
    }

    try {
      const rows = await db
        .select({ inv: invoices })
        .from(invoices)
        .where(eq(invoices.customerId, payload.customerId))
        .orderBy(desc(invoices.createdAt));

      return rows.map((r: any) => {
        const inv = r.inv as any;
        if (!inv) {
          return null;
        }
        // amountCents zurückgeben, damit Frontend durch 100 teilen kann
        const amountCents = inv.amountCents ?? 0;
        return {
          id: String(inv.id),
          number: String(inv.number ?? ""),
          amountCents: Number(amountCents),
          currency: String(inv.currency ?? "EUR"),
          status: String(inv.status ?? "open"),
          periodStart: null, // periodFrom existiert nicht im Schema
          periodEnd: null, // periodTo existiert nicht im Schema
          createdAt: inv.createdAt ? new Date(inv.createdAt).toISOString() : new Date().toISOString(),
          dueAt: inv.dueAt ? new Date(inv.dueAt).toISOString() : null,
          plan: inv.planName ? String(inv.planName) : null, // Verwende planName aus Schema
        };
      }).filter((item) => item !== null);
    } catch (err: any) {
      request.log.error({ err, customerId: payload.customerId }, "Error loading portal invoices");
      reply.code(500);
      return {
        ok: false,
        error: "Failed to load invoices",
        message: err?.message || "Internal server error",
      };
    }
  });
}
