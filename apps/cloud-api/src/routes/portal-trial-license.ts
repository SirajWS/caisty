// apps/cloud-api/src/routes/portal-trial-license.ts
import type { FastifyInstance, FastifyRequest } from "fastify";
import { and, eq, ne } from "drizzle-orm";

import { db } from "../db/client.js";
import { licenses } from "../db/schema/licenses.js";
import { licenseEvents } from "../db/schema/licenseEvents.js";
import { notificationService } from "../billing/NotificationService.js";
import { generateLicenseKey } from "../lib/licenseKey.js";
import { verifyPortalToken } from "../lib/portalJwt.js";

const TRIAL_DAYS = Number(process.env.TRIAL_DAYS || "3");

type PortalJwtPayload = {
  orgId?: string;
  customerId?: string;
  // ggf. weitere Felder
  [key: string]: any;
};

function getPortalAuth(request: FastifyRequest): PortalJwtPayload {
  const auth = request.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    throw new Error("Missing portal token");
  }
  const token = auth.slice("Bearer ".length);
  return verifyPortalToken(token) as PortalJwtPayload;
}

export async function registerPortalTrialLicenseRoutes(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // Einmalige Trial-Lizenz aus dem Kundenportal anlegen
  // POST /portal/trial-license
  // ---------------------------------------------------------------------------
  app.post("/portal/trial-license", async (request, reply) => {
    let payload: PortalJwtPayload;

    // Portal-JWT prüfen
    try {
      payload = getPortalAuth(request);
    } catch (err) {
      reply.code(401);
      return {
        ok: false,
        reason: "unauthenticated",
        message: "Missing or invalid portal token.",
      };
    }

    const orgId = payload.orgId;
    const customerId = payload.customerId;

    if (!orgId || !customerId) {
      reply.code(400);
      return {
        ok: false,
        reason: "missing_customer",
        message:
          "Für die Testlizenz werden Konto-Informationen (orgId, customerId) benötigt.",
      };
    }

    try {
      // 1) Hat dieses Konto schon eine Trial-Lizenz?
      const existingTrial = await db
        .select({ id: licenses.id })
        .from(licenses)
        .where(
          and(
            eq(licenses.orgId, orgId),
            eq(licenses.customerId, customerId),
            eq(licenses.plan, "trial"),
          ),
        )
        .limit(1);

      if (existingTrial.length > 0) {
        reply.code(409);
        return {
          ok: false,
          reason: "trial_already_used",
          message: "Für dieses Konto wurde bereits eine Testlizenz angelegt.",
        };
      }

      // 2) Hat Kunde bereits einen aktiven bezahlten Plan?
      const existingPaid = await db
        .select({ id: licenses.id })
        .from(licenses)
        .where(
          and(
            eq(licenses.customerId, customerId),
            eq(licenses.status, "active"),
            ne(licenses.plan, "trial"),
          ),
        )
        .limit(1);

      if (existingPaid.length > 0) {
        reply.code(409);
        return {
          ok: false,
          reason: "active_plan_exists",
          message:
            "Für dieses Konto existiert bereits ein aktiver, bezahlter Plan.",
        };
      }

      // 3) Trial-Lizenz anlegen
      const now = new Date();
      const validFrom = now;
      const validUntil = new Date(
        now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000,
      );

      const key = generateLicenseKey("CSTY");

      const [created] = await db
        .insert(licenses)
        .values({
          orgId,
          customerId,
          subscriptionId: null,
          key,
          plan: "trial",
          maxDevices: 1,
          status: "active",
          validFrom,
          validUntil,
        })
        .returning();

      // Event protokollieren
      await db.insert(licenseEvents).values({
        orgId,
        licenseId: created.id,
        type: "created",
        metadata: {
          source: "portal_trial",
          customerId,
        },
      });

      // Customer-Name für Notification holen
      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, customerId))
        .limit(1);

      // Notification für Admin
      await notificationService.notifyTrialLicenseCreated({
        orgId,
        customerId,
        customerName: customer?.name || customer?.email || undefined,
        licenseId: created.id,
        licenseKey: created.key,
      });

      reply.code(201);
      return {
        ok: true,
        license: created,
      };
    } catch (err) {
      request.log.error({ err }, "Error creating portal trial license");
      reply.code(500);
      return {
        ok: false,
        message: "Testlizenz konnte nicht erstellt werden.",
      };
    }
  });
}
