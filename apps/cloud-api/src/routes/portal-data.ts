// apps/cloud-api/src/routes/portal-data.ts
import type { FastifyInstance, FastifyRequest } from "fastify";
import { db } from "../db/client";
import { licenses, devices, invoices } from "../db/schema";
import { desc, eq } from "drizzle-orm";
import { verifyPortalToken } from "../lib/portalJwt";

// Payload-Struktur deines Portal-JWT
interface PortalJwtPayload {
  customerId: string;
  orgId: string;
  iat: number;
  exp: number;
}

// Helper: Portal-Token aus dem Header lesen + verifizieren
function getPortalAuth(request: FastifyRequest): PortalJwtPayload {
  const auth = request.headers.authorization;

  if (!auth || !auth.startsWith("Bearer ")) {
    throw new Error("Missing portal token");
  }

  const token = auth.slice("Bearer ".length);
  return verifyPortalToken(token) as PortalJwtPayload;
}

export async function registerPortalDataRoutes(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // 1) LIZENZEN DES PORTAL-KUNDEN
  //    -> Frontend: fetchPortalLicenses()
  // ---------------------------------------------------------------------------
  app.get("/portal/licenses", async (request, reply) => {
    let payload: PortalJwtPayload;

    try {
      payload = getPortalAuth(request);
    } catch (err) {
      app.log.warn({ err }, "portal/licenses: invalid portal token");
      reply.code(401);
      return { message: "Invalid or missing portal token" };
    }

    // Wichtig: nur nach customerId filtern – orgId kann im aktuellen Setup
    // von License und Customer abweichen (Admin-Org vs. Portal-Org).
    const rows = await db
      .select({
        id: licenses.id,
        key: licenses.key,
        plan: licenses.plan,
        status: licenses.status,
        maxDevices: licenses.maxDevices,
        validUntil: licenses.validUntil,
        createdAt: licenses.createdAt,
        // optional: validFrom, falls vorhanden
        validFrom: licenses.validFrom,
      })
      .from(licenses)
      .where(eq(licenses.customerId, payload.customerId))
      .orderBy(desc(licenses.createdAt));

    return rows.map((row) => ({
      id: row.id,
      key: row.key,
      plan: row.plan,
      status: row.status,
      maxDevices: row.maxDevices,
      validUntil: row.validUntil
        ? row.validUntil.toISOString()
        : null,
      createdAt: row.createdAt.toISOString(),
      // falls validFrom existiert, mappen – Frontend ignoriert das aktuell
      validFrom: row.validFrom ? row.validFrom.toISOString() : null,
    }));
  });

  // ---------------------------------------------------------------------------
  // 2) DEVICES DES PORTAL-KUNDEN
  //    -> Frontend: fetchPortalDevices()
  // ---------------------------------------------------------------------------
  app.get("/portal/devices", async (request, reply) => {
    let payload: PortalJwtPayload;

    try {
      payload = getPortalAuth(request);
    } catch (err) {
      app.log.warn({ err }, "portal/devices: invalid portal token");
      reply.code(401);
      return { message: "Invalid or missing portal token" };
    }

    // Wir holen das komplette Device-Objekt und mappen danach in ein
    // Portal-kompatibles Format. So sind wir tolerant gegenüber
    // kleineren Schema-Unterschieden (deviceId / fingerprint, lastSeenAt / lastHeartbeatAt).
    const rows = await db
      .select({
        device: devices,
        licenseKey: licenses.key,
      })
      .from(devices)
      .leftJoin(licenses, eq(devices.licenseId, licenses.id))
      .where(eq(devices.customerId, payload.customerId))
      .orderBy(desc(devices.createdAt));

    return rows.map((row) => {
      const dev: any = row.device;

      const lastSeen =
        dev.lastSeenAt ??
        dev.lastHeartbeatAt ??
        null;

      const deviceId =
        dev.deviceId ??
        dev.fingerprint ??
        dev.id;

      const status: string =
        dev.status ??
        (lastSeen ? "online" : "never_seen");

      return {
        id: dev.id,
        name: dev.name,
        deviceId,
        lastSeenAt: lastSeen
          ? new Date(lastSeen).toISOString()
          : null,
        status,
        licenseKey: row.licenseKey ?? null,
      };
    });
  });

  // ---------------------------------------------------------------------------
  // 3) INVOICES DES PORTAL-KUNDEN
  //    -> Frontend: fetchPortalInvoices()
  // ---------------------------------------------------------------------------
  app.get("/portal/invoices", async (request, reply) => {
    let payload: PortalJwtPayload;

    try {
      payload = getPortalAuth(request);
    } catch (err) {
      app.log.warn({ err }, "portal/invoices: invalid portal token");
      reply.code(401);
      return { message: "Invalid or missing portal token" };
    }

    const rows = await db
      .select({
        inv: invoices,
      })
      .from(invoices)
      .where(eq(invoices.customerId, payload.customerId))
      .orderBy(desc(invoices.createdAt));

    return rows.map((row) => {
      const inv: any = row.inv;

      // amountCents → Betrag (z. B. TND/EUR) – 100 durch 100 teilen, falls vorhanden
      const amountCents: number | undefined = inv.amountCents;
      const amount =
        typeof amountCents === "number"
          ? amountCents / 100
          : inv.amount ?? 0;

      const issued =
        inv.issuedAt ??
        inv.periodFrom ??
        null;
      const due =
        inv.dueAt ??
        inv.periodTo ??
        null;

      return {
        id: inv.id,
        number: inv.number,
        amount,
        currency: inv.currency ?? "TND",
        status: inv.status as string,
        periodFrom: issued ? new Date(issued).toISOString() : null,
        periodTo: due ? new Date(due).toISOString() : null,
        createdAt: new Date(inv.createdAt).toISOString(),
        downloadUrl: inv.pdfUrl ?? null,
      };
    });
  });
}
