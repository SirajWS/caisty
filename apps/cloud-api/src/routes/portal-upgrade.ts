// apps/cloud-api/src/routes/portal-upgrade.ts
import type { FastifyInstance, FastifyRequest } from "fastify";
import { addDays, addMonths } from "date-fns";
import { and, eq, ne } from "drizzle-orm";

import { db } from "../db/client.js";
import { customers } from "../db/schema/customers.js";
import { subscriptions } from "../db/schema/subscriptions.js";
import { invoices } from "../db/schema/invoices.js";
import { licenses } from "../db/schema/licenses.js";
import { licenseEvents } from "../db/schema/licenseEvents.js";
import { notifications } from "../db/schema/notifications.js";
import { verifyPortalToken } from "../lib/portalJwt.js";
import { generateLicenseKey } from "../lib/licenseKey.js";
import { getPlanPrice, type Currency } from "../config/pricing.js";

// Node-Fetch Alias (damit TypeScript nicht meckert)
const nodeFetch: any = (globalThis as any).fetch;

// ---------------- Portal JWT ----------------

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

// ---------------- Billing Service ----------------

import { billingService } from "../billing/billingServiceInstance.js";

// Hier läuft die Cloud-API (Fastify)
const PUBLIC_API_BASE_URL =
  process.env.PUBLIC_API_BASE_URL ?? "http://127.0.0.1:3333";

// Hier läuft das Portal (Vite dev oder später das echte Frontend)
// z.B. DEV: http://localhost:5175 (caisty-site, nicht cloud-admin!)
const PORTAL_BASE_URL =
  process.env.PORTAL_BASE_URL ?? "http://localhost:5175";

// ---------------- Typen & Pricing ----------------

type StartUpgradeBody = {
  plan: "starter" | "pro";
};

type StartUpgradeResponse = {
  ok: boolean;
  reason?:
    | "unauthorized"
    | "invalid_plan"
    | "customer_not_found"
    | "missing_org"
    | "active_plan_exists"
    | "internal_error";
  message?: string;
  subscription?: {
    id: string;
    plan: string;
    status: string;
  };
  invoice?: {
    id: string;
    number: string;
    amount: number;
    currency: string;
    status: string;
    issuedAt: string;
    dueAt: string;
  };
  // PayPal-spezifisch
  redirectUrl?: string;
  paypalOrderId?: string;
  // nur fürs Debug im Dev-Modus
  details?: string;
};

type PlanPricing = {
  monthlyAmount: number;
  description: string;
};

// Preise aus zentraler Konfiguration (EUR als Standard, kann später erweitert werden)
function getPlanPricing(plan: "starter" | "pro", currency: Currency = "EUR"): PlanPricing {
  const monthlyAmount = getPlanPrice(plan, currency, "monthly");
  return {
    monthlyAmount,
    description: plan === "starter" 
      ? "Starter – 1 aktives POS-Gerät"
      : "Pro – bis zu 3 aktive POS-Geräte",
  };
}

// sehr einfache, aber robuste Invoice-Nummern-Generierung
async function generateInvoiceNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const rand = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
  return `INV-${year}-${rand}`;
}

// ---------------- Route-Registrierung ----------------

export async function registerPortalUpgradeRoutes(app: FastifyInstance) {
  // POST /portal/upgrade/start
  app.post<{ Body: StartUpgradeBody; Reply: StartUpgradeResponse }>(
    "/portal/upgrade/start",
    async (request, reply) => {
      let payload: PortalJwtPayload;

      try {
        payload = getPortalAuth(request);
      } catch (err) {
        app.log.warn({ err }, "portal/upgrade: invalid portal token");
        reply.code(401);
        return {
          ok: false,
          reason: "unauthorized",
          message: "Invalid or missing portal token",
        };
      }

      const { plan } = request.body;

      if (plan !== "starter" && plan !== "pro") {
        reply.code(400);
        return {
          ok: false,
          reason: "invalid_plan",
          message: "Ungültiger Plan. Erlaubt: starter, pro.",
        };
      }

      const customerId = payload.customerId;

      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, customerId))
        .limit(1);

      if (!customer) {
        reply.code(404);
        return {
          ok: false,
          reason: "customer_not_found",
          message: "Portal-Kunde wurde nicht gefunden.",
        };
      }

      if (!customer.orgId) {
        app.log.error(
          { customerId: customer.id },
          "Customer has no orgId - cannot create subscription",
        );
        reply.code(400);
        return {
          ok: false,
          reason: "missing_org",
          message: "Kunde ist keiner Organisation zugeordnet.",
        };
      }

      // --- Check: Gibt es schon eine aktive Subscription? ---
      try {
        const [existingActive] = await db
          .select()
          .from(subscriptions)
          .where(
            and(
              eq(subscriptions.customerId, customerId),
              eq(subscriptions.status as any, "active"),
            ),
          )
          .limit(1);

        if (existingActive) {
          reply.code(400);
          return {
            ok: false,
            reason: "active_plan_exists",
            message:
              "Für dieses Konto existiert bereits ein aktiver Starter/Pro-Plan.",
          };
        }
      } catch (err) {
        app.log.error(
          { err, customerId },
          "Failed to check existing active subscriptions",
        );
      }

      // --- Aufräumen: alte pending-Subscriptions + offene Invoices schließen ---
      try {
        // alle "pending" Subscriptions dieses Kunden auf "cancelled"
        await db
          .update(subscriptions as any)
          .set({ status: "cancelled" } as any)
          .where(
            and(
              eq(subscriptions.customerId as any, customerId as any),
              eq(subscriptions.status as any, "pending"),
            ),
          );

        // alle offenen Invoices dieses Kunden auf "canceled"
        await db
          .update(invoices as any)
          .set({ status: "canceled" } as any)
          .where(
            and(
              eq(invoices.customerId as any, customerId as any),
              eq(invoices.status as any, "open"),
            ),
          );
      } catch (err) {
        app.log.error(
          { err, customerId },
          "Failed to cleanup pending subscriptions/invoices before new upgrade",
        );
      }

      // Bestimme Währung basierend auf Customer oder Standard EUR
      // TODO: Später kann die Währung aus Customer-Daten oder Request kommen
      const currency: Currency = "EUR"; // Standard, kann später erweitert werden
      const pricing = getPlanPricing(plan, currency);
      const now = new Date();

      try {
        // 1) Subscription – erstmal pending
        const monthlyPriceCents = Math.round(pricing.monthlyAmount * 100);
        const currentPeriodEnd = addMonths(now, 1);

        const [sub] = await db
          .insert(subscriptions)
          .values({
            orgId: customer.orgId,
            customerId,
            plan,
            status: "pending", // <--- wichtig
            priceCents: monthlyPriceCents,
            currency: currency,
            startedAt: now,
            currentPeriodEnd,
          } as any)
          .returning();

        if (!sub || !sub.id) {
          throw new Error("Failed to create subscription - no ID returned");
        }

        // Notification für neue Subscription
        await db.insert(notifications).values({
          orgId: customer.orgId,
          type: "portal_subscription_created",
          title: "Neue Subscription erstellt",
          body: `Kunde ${customer.name || customer.email || customerId} hat eine ${plan}-Subscription gestartet`,
          customerId,
          data: {
            subscriptionId: sub.id,
            plan,
            priceCents: monthlyPriceCents,
            currency,
          },
        });

        // 2) Invoice
        const amountCents = monthlyPriceCents;
        const invoiceNumber = await generateInvoiceNumber();
        const issuedAt = now;
        const dueAt = addDays(now, 14);

        const [inv] = await db
          .insert(invoices)
          .values({
            orgId: customer.orgId,
            customerId,
            subscriptionId: sub.id,
            number: invoiceNumber,
            amountCents,
            currency: currency,
            status: "open",
            issuedAt,
            dueAt,
          } as any)
          .returning();

        if (!inv || !inv.id) {
          throw new Error("Failed to create invoice - no ID returned");
        }

        // 3) Checkout via BillingService (Fehler hier brechen das Upgrade NICHT ab)
        const returnUrl = `${PUBLIC_API_BASE_URL}/portal/upgrade/paypal-return?invoiceId=${encodeURIComponent(
          String(inv.id),
        )}`;
        const cancelUrl = `${PUBLIC_API_BASE_URL}/portal/upgrade/paypal-cancel?invoiceId=${encodeURIComponent(
          String(inv.id),
        )}`;

        let redirectUrl: string | undefined;
        let paypalOrderId: string | undefined;

        try {
          const checkoutResult = await billingService.checkout({
            provider: "paypal",
            planId: `${plan}_monthly`,
            returnUrl,
            cancelUrl,
            currency,
          });

          redirectUrl = checkoutResult.checkoutUrl;
          // paypalOrderId wird später aus Webhook kommen
        } catch (err) {
          app.log.error({ err }, "Billing checkout failed");
          // redirectUrl bleibt undefined → Frontend kann zu /portal/invoices schicken
        }

        return reply.send({
          ok: true,
          subscription: {
            id: String(sub.id),
            plan: String(sub.plan),
            status: String(sub.status),
          },
          invoice: {
            id: String(inv.id),
            number: String(inv.number),
            amount: pricing.monthlyAmount,
            currency: String(inv.currency ?? "EUR"),
            status: String(inv.status),
            issuedAt: issuedAt.toISOString(),
            dueAt: dueAt.toISOString(),
          },
          redirectUrl,
          paypalOrderId,
        });
      } catch (err: any) {
        const errorMessage =
          err?.message || err?.toString() || "Unknown error";
        const errorStack = err?.stack;

        app.log.error(
          {
            err,
            errorMessage,
            errorStack,
            customerId,
            plan,
            customerOrgId: customer.orgId,
          },
          "portal/upgrade/start failed – DB insert or other internal error",
        );

        reply.code(500);
        return {
          ok: false,
          reason: "internal_error",
          message: "Upgrade konnte nicht gestartet werden.",
          details: errorMessage,
        };
      }
    },
  );

  // GET /portal/upgrade/paypal-return
  app.get("/portal/upgrade/paypal-return", async (request, reply) => {
    const query = request.query as any;
    const invoiceId = query.invoiceId as string | undefined;
    const token = query.token as string | undefined; // PayPal-Order-ID

    if (!invoiceId || !token) {
      reply.code(400).send("Missing invoiceId or token");
      return;
    }

    try {
      const ok = await capturePaypalOrder(token);
      if (ok) {
        // 1) Invoice auf "paid"
        await db
          .update(invoices as any)
          .set({ status: "paid" } as any)
          .where(eq(invoices.id as any, invoiceId as any));

        // 2) Invoice + Subscription + Customer aus DB holen
        const [inv] = await db
          .select()
          .from(invoices)
          .where(eq(invoices.id as any, invoiceId as any))
          .limit(1);

        if (inv && inv.subscriptionId) {
          const [sub] = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.id as any, inv.subscriptionId as any))
            .limit(1);

          // Customer für Notifications holen
          let customerName = "Unbekannter Kunde";
          if (inv.customerId) {
            const [customer] = await db
              .select()
              .from(customers)
              .where(eq(customers.id as any, inv.customerId as any))
              .limit(1);
            if (customer) {
              customerName = customer.name || customer.email || inv.customerId;
            }
          }

          // 2.1 Subscription von "pending" auf "active"
          if (sub && sub.status !== "active") {
            await db
              .update(subscriptions as any)
              .set({ status: "active" } as any)
              .where(eq(subscriptions.id as any, sub.id as any));
          }

          // 3) Lizenz anlegen, falls noch keine bezahlte Non-Trial-Lizenz existiert
          if (inv.customerId && inv.orgId) {
            const [existingPaidLicense] = await db
              .select()
              .from(licenses)
              .where(
                and(
                  eq(licenses.customerId as any, inv.customerId as any),
                  ne(licenses.plan as any, "trial"),
                  eq(licenses.status as any, "active"),
                ),
              )
              .limit(1);

            if (!existingPaidLicense) {
              const now = new Date();
              const validFrom = now;
              const validUntil = addMonths(now, 1);
              const maxDevices =
                sub && sub.plan === "starter"
                  ? 1
                  : sub && sub.plan === "pro"
                  ? 3
                  : 1;

              const licenseKey = generateLicenseKey("CSTY");

              const [createdLicense] = await db
                .insert(licenses)
                .values({
                  orgId: String(inv.orgId), // Konvertiere zu String, da licenses.orgId als text gespeichert ist
                  customerId: inv.customerId ? String(inv.customerId) : null,
                  subscriptionId: inv.subscriptionId ? String(inv.subscriptionId) : null,
                  plan: sub?.plan ?? "starter",
                  status: "active",
                  key: licenseKey,
                  maxDevices,
                  validFrom,
                  validUntil,
                } as any)
                .returning();

              // License Event protokollieren
              if (createdLicense) {
                await db.insert(licenseEvents).values({
                  orgId: String(inv.orgId), // Konvertiere zu String für Konsistenz
                  licenseId: createdLicense.id,
                  type: "created",
                  metadata: {
                    source: "portal_payment",
                    invoiceId: String(inv.id),
                    subscriptionId: inv.subscriptionId ? String(inv.subscriptionId) : null,
                  },
                });

                // Notification für erfolgreiche Zahlung und Lizenz-Erstellung
                await db.insert(notifications).values({
                  orgId: String(inv.orgId),
                  type: "portal_payment_success",
                  title: "Zahlung erfolgreich - Lizenz erstellt",
                  body: `${customerName} hat erfolgreich für ${sub?.plan ?? "starter"}-Plan gezahlt. Lizenz ${createdLicense.key} wurde erstellt.`,
                  customerId: inv.customerId ? String(inv.customerId) : null,
                  licenseId: createdLicense.id,
                  data: {
                    invoiceId: String(inv.id),
                    subscriptionId: inv.subscriptionId ? String(inv.subscriptionId) : null,
                    plan: sub?.plan ?? "starter",
                    licenseKey: createdLicense.key,
                    amountCents: inv.amountCents,
                    currency: inv.currency,
                  },
                });
              }

              // Trial-Lizenz optional auf "revoked" setzen
              await db
                .update(licenses as any)
                .set({ status: "revoked" } as any)
                .where(
                  and(
                    eq(licenses.customerId as any, inv.customerId as any),
                    eq(licenses.plan as any, "trial"),
                    eq(licenses.status as any, "active"),
                  ),
                );
            }
          }

          // 4) Aufräumen: alle anderen Subscriptions/Invoices des Kunden bereinigen
          if (inv.customerId) {
            // andere Subscriptions (nicht die gerade aktivierte) auf "cancelled",
            // sofern sie nicht "active" sind
            await db
              .update(subscriptions as any)
              .set({ status: "cancelled" } as any)
              .where(
                and(
                  eq(subscriptions.customerId as any, inv.customerId as any),
                  ne(subscriptions.id as any, inv.subscriptionId as any),
                  ne(subscriptions.status as any, "active"),
                ),
              );

            // andere Invoices (nicht diese) auf "canceled", sofern sie nicht "paid" sind
            await db
              .update(invoices as any)
              .set({ status: "canceled" } as any)
              .where(
                and(
                  eq(invoices.customerId as any, inv.customerId as any),
                  ne(invoices.id as any, inv.id as any),
                  ne(invoices.status as any, "paid"),
                ),
              );
          }
        }

        const location = `${PORTAL_BASE_URL}/portal/upgrade/result?status=success&invoiceId=${encodeURIComponent(
          invoiceId,
        )}`;
        reply.redirect(location);
        return;
      }

      const location = `${PORTAL_BASE_URL}/portal/upgrade/result?status=failed&invoiceId=${encodeURIComponent(
        invoiceId,
      )}`;
      reply.redirect(location);
    } catch (err) {
      app.log.error({ err }, "paypal-return failed");
      const location = `${PORTAL_BASE_URL}/portal/upgrade/result?status=failed&invoiceId=${encodeURIComponent(
        invoiceId,
      )}`;
      reply.redirect(location);
    }
  });

  // GET /portal/upgrade/paypal-cancel
  app.get("/portal/upgrade/paypal-cancel", async (request, reply) => {
    const query = request.query as any;
    const invoiceId = query.invoiceId as string | undefined;

    if (invoiceId) {
      try {
        // Invoice auf "canceled"
        const [inv] = await db
          .update(invoices as any)
          .set({ status: "canceled" } as any)
          .where(eq(invoices.id as any, invoiceId as any))
          .returning();

        // zugehörige Subscription (falls vorhanden) auf "cancelled"
        if (inv && inv.subscriptionId) {
          await db
            .update(subscriptions as any)
            .set({ status: "cancelled" } as any)
            .where(eq(subscriptions.id as any, inv.subscriptionId as any));
        }
      } catch (err) {
        app.log.error({ err, invoiceId }, "paypal-cancel cleanup failed");
      }
    }

    const location = `${PORTAL_BASE_URL}/portal/upgrade/result?status=cancelled${
      invoiceId ? `&invoiceId=${encodeURIComponent(invoiceId)}` : ""
    }`;
    reply.redirect(location);
  });
}
