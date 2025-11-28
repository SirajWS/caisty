// apps/api/src/routes/portal/trialLicense.ts
import type { FastifyInstance } from "fastify";
import { and, eq, ne } from "drizzle-orm";

import { db } from "../../db/client";
import { licenses } from "../../db/schema";
import { createLicenseKey } from "../../lib/licenseKey";

const TRIAL_DAYS = 3;

export async function portalTrialLicenseRoutes(app: FastifyInstance) {
  // Hier unbedingt die Portal-Auth nutzen – so wie bei /portal/me etc.
  app.post(
    "/portal/trial-license",
    { preHandler: [app.authenticatePortal] },
    async (request, reply) => {
      const user = request.user as
        | { orgId?: string; customerId?: string }
        | undefined;

      // → Genau hier kam deine Meldung her: orgId / customerId fehlen
      if (!user?.orgId || !user.customerId) {
        return reply.status(400).send({
          ok: false,
          reason: "missing_org_or_customer",
          message:
            "Für die Testlizenz werden Konto-Informationen (orgId, customerId) benötigt.",
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
          message: "Für dieses Konto wurde bereits eine Testlizenz angelegt.",
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
          message:
            "Für dieses Konto existiert bereits ein aktiver, bezahlter Plan.",
        });
      }

      // 3) Trial-Lizenz anlegen (3 Tage, 1 Gerät)
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
    },
  );
}
