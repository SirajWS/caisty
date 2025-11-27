// apps/api/src/routes/selfService/trial.ts
import type { FastifyInstance } from "fastify";
import { and, eq, ne } from "drizzle-orm";

import { db } from "../../db/client";   // ⬅️ HIER angepasst
import { licenses } from "../../db/schema";
import { createLicenseKey } from "../../lib/licenseKey";

const TRIAL_DAYS = 3;

export async function selfServiceTrialRoutes(app: FastifyInstance) {
  app.post("/self-service/trial", async (request, reply) => {
    const user = request.user as
      | { orgId?: string; customerId?: string }
      | undefined;

    if (!user?.orgId || !user.customerId) {
      return reply.status(401).send({
        ok: false,
        reason: "unauthenticated",
        message: "Not authenticated.",
      });
    }

    const orgId = user.orgId!;
    const customerId = user.customerId!;

    // 1) Hat Kunde schon eine Trial-Lizenz?
    const existingTrial = await db
      .select({ id: licenses.id })
      .from(licenses)
      .where(
        and(eq(licenses.customerId, customerId), eq(licenses.plan, "trial")),
      )
      .limit(1);

    if (existingTrial.length > 0) {
      return reply.status(409).send({
        ok: false,
        reason: "trial_already_used",
        message: "Trial already used for this account.",
      });
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
      return reply.status(409).send({
        ok: false,
        reason: "active_plan_exists",
        message: "There is already an active paid license for this account.",
      });
    }

    // 3) Trial-Lizenz anlegen
    const now = new Date();
    const validFrom = now;
    const validUntil = new Date(
      now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000,
    );

    const [license] = await db
      .insert(licenses)
      .values({
        orgId,
        customerId,
        key: createLicenseKey(),
        plan: "trial",
        status: "active",
        maxDevices: 1,
        validFrom,
        validUntil,
      })
      .returning();

    return reply.send({
      ok: true,
      license,
    });
  });
}
