import type { FastifyInstance, FastifyRequest } from "fastify";
import { db } from "../db/client.js";
import { licenses, devices, invoices } from "../db/schema/index.js";
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

    const rows = await db
      .select({ inv: invoices })
      .from(invoices)
      .where(eq(invoices.customerId, payload.customerId))
      .orderBy(desc(invoices.createdAt));

    return rows.map((r: any) => {
      const inv = r.inv as any;
      const amount = inv.amountCents ? inv.amountCents / 100 : inv.amount ?? 0;
      return {
        id: inv.id,
        number: inv.number,
        amount,
        currency: inv.currency ?? "TND",
        status: inv.status,
        periodFrom: inv.periodFrom ? new Date(inv.periodFrom).toISOString() : null,
        periodTo: inv.periodTo ? new Date(inv.periodTo).toISOString() : null,
        createdAt: new Date(inv.createdAt).toISOString(),
        downloadUrl: inv.pdfUrl ?? null,
      };
    });
  });
}
