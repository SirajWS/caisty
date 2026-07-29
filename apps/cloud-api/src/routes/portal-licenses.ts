// apps/cloud-api/src/routes/portal-licenses.ts
import type { FastifyInstance, FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";

import { db } from "../db/client.js";
import { licenses } from "../db/schema/licenses.js";
import { verifyPortalToken } from "../lib/portalJwt.js";

interface PortalJwtPayload {
  customerId: string;
  orgId: string;
  iat: number;
  exp: number;
}

function getPortalAuth(request: FastifyRequest): PortalJwtPayload {
  const auth = request.headers.authorization;

  if (!auth || !auth.startsWith("Bearer ")) {
    throw new Error("Missing portal token");
  }

  const token = auth.slice("Bearer ".length);
  return verifyPortalToken(token) as PortalJwtPayload;
}

type PortalLicenseDto = {
  id: string;
  key: string;
  plan: string;
  status: string;
  /** null = unlimited */
  maxDevices: number | null;
  unlimitedDevices: boolean;
  validUntil: string | null;
  createdAt: string;
};

export async function registerPortalLicensesRoutes(app: FastifyInstance) {
  app.get("/portal/licenses", async (request, reply) => {
    let payload: PortalJwtPayload;

    try {
      payload = getPortalAuth(request);
    } catch (err) {
      app.log.warn({ err }, "portal/licenses: invalid portal token");
      reply.code(401);
      return [];
    }

    const rows = await db
      .select()
      .from(licenses)
      .where(eq(licenses.customerId as any, payload.customerId as any));

    const result: PortalLicenseDto[] = rows.map((lic: any) => {
      // Explicit null from DB = unlimited; never coalesce null → 1
      const resolved: number | null =
        lic.maxDevices === null
          ? null
          : typeof lic.maxDevices === "number"
            ? lic.maxDevices
            : Number(lic.maxDevices) || 1;
      return {
        id: String(lic.id),
        key: String(lic.key),
        plan: String(lic.plan),
        status: String(lic.status),
        maxDevices: resolved,
        unlimitedDevices: resolved === null,
        validUntil: lic.validUntil
          ? new Date(lic.validUntil).toISOString()
          : null,
        createdAt: lic.createdAt
          ? new Date(lic.createdAt).toISOString()
          : new Date().toISOString(),
      };
    });

    return result;
  });
}
