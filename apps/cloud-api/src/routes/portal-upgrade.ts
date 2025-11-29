// apps/cloud-api/src/routes/portal-upgrade.ts
import type { FastifyInstance, FastifyRequest } from "fastify";
import { addDays, addMonths } from "date-fns";
import { and, eq, ne } from "drizzle-orm";

import { db } from "../db/client.js";
import { customers } from "../db/schema/customers.js";
import { subscriptions } from "../db/schema/subscriptions.js";
import { invoices } from "../db/schema/invoices.js";
import { licenses } from "../db/schema/licenses.js";
import { verifyPortalToken } from "../lib/portalJwt.js";

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

// ---------------- PayPal Helper ----------------

const PAYPAL_BASE_URL =
  process.env.PAYPAL_BASE_URL ?? "https://api-m.sandbox.paypal.com";

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID ?? "";
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET ?? "";

// Hier läuft die Cloud-API (Fastify)
const PUBLIC_API_BASE_URL =
  process.env.PUBLIC_API_BASE_URL ?? "http://127.0.0.1:3333";

// Hier läuft das Portal (Vite dev oder später das echte Frontend)
// z.B. DEV: http://localhost:5173
const PORTAL_BASE_URL =
  process.env.PORTAL_BASE_URL ?? "http://http://localhost:5173";

async function getPaypalAccessToken(): Promise<string> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET not configured");
  }

  const res = await nodeFetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(
          `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`,
          "utf8",
        ).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(
      `PayPal token request failed: ${res.status} ${res.statusText} – ${txt}`,
    );
  }

  const data = (await res.json()) as { access_token: string };
  if (!data.access_token) {
    throw new Error("PayPal token missing in response");
  }
  return data.access_token;
}

type PaypalOrderResult = {
  id: string;
  approvalUrl: string;
};

async function createPaypalOrder(opts: {
  amount: number; // EUR, z.B. 0.01
  currency: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<PaypalOrderResult> {
  const accessToken = await getPaypalAccessToken();

  const res = await nodeFetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: opts.currency,
            value: opts.amount.toFixed(2),
          },
          description: opts.description,
        },
      ],
      application_context: {
        return_url: opts.returnUrl,
        cancel_url: opts.cancelUrl,
      },
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(
      `PayPal order create failed: ${res.status} ${res.statusText} – ${txt}`,
    );
  }

  const data = (await res.json()) as any;

  const approvalLink = (data.links || []).find(
    (l: any) => l.rel === "approve",
  );

  if (!data.id || !approvalLink?.href) {
    throw new Error("PayPal order missing id or approval link");
  }

  return {
    id: String(data.id),
    approvalUrl: String(approvalLink.href),
  };
}

// *** DEV-Bypass: ermöglicht lokale Tests ohne echtes PayPal-Capture ***
async function capturePaypalOrder(orderId: string): Promise<boolean> {
  // Wenn wir von außen ein Token wie DEV_OK schicken, einfach "success"
  if (orderId.startsWith("DEV_")) {
    return true;
  }

  const accessToken = await getPaypalAccessToken();

  const res = await nodeFetch(
    `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(
      `PayPal capture failed: ${res.status} ${res.statusText} – ${txt}`,
    );
  }

  const data = (await res.json()) as any;
  return data.status === "COMPLETED";
}

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
  monthlyAmount: number; // EUR
  description: string;
};

// aktuell 0,01 € zum Testen
const PLAN_PRICING: Record<"starter" | "pro", PlanPricing> = {
  starter: {
    monthlyAmount: 0.01,
    description: "Starter – 1 aktives POS-Gerät",
  },
  pro: {
    monthlyAmount: 0.01,
    description: "Pro – bis zu 3 aktive POS-Geräte",
  },
};

// sehr einfache, aber robuste Invoice-Nummern-Generierung
async function generateInvoiceNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const rand = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
  return `INV-${year}-${rand}`;
}

// sehr einfache License-Key-Generierung (kannst du später ersetzen)
function generateLicenseKey(): string {
  const now = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `LIC-${now}-${rand}`;
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

      const pricing = PLAN_PRICING[plan];
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
            currency: "EUR",
            startedAt: now,
            currentPeriodEnd,
          } as any)
          .returning();

        if (!sub || !sub.id) {
          throw new Error("Failed to create subscription - no ID returned");
        }

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
            currency: "EUR",
            status: "open",
            issuedAt,
            dueAt,
          } as any)
          .returning();

        if (!inv || !inv.id) {
          throw new Error("Failed to create invoice - no ID returned");
        }

        // 3) PayPal-Order (Fehler hier brechen das Upgrade NICHT ab)
        const returnUrl = `${PUBLIC_API_BASE_URL}/portal/upgrade/paypal-return?invoiceId=${encodeURIComponent(
          String(inv.id),
        )}`;
        const cancelUrl = `${PUBLIC_API_BASE_URL}/portal/upgrade/paypal-cancel?invoiceId=${encodeURIComponent(
          String(inv.id),
        )}`;

        let redirectUrl: string | undefined;
        let paypalOrderId: string | undefined;

        try {
          const order = await createPaypalOrder({
            amount: pricing.monthlyAmount,
            currency: "EUR",
            description: pricing.description,
            returnUrl,
            cancelUrl,
          });
          redirectUrl = order.approvalUrl;
          paypalOrderId = order.id;
        } catch (err) {
          app.log.error({ err }, "PayPal order creation failed");
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

        // 2) Invoice + Subscription aus DB holen
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
              const validUntil = addMonths(now, 1);
              const maxDevices =
                sub && sub.plan === "starter"
                  ? 1
                  : sub && sub.plan === "pro"
                  ? 3
                  : 1;

              const licenseKey = generateLicenseKey();

              await db
                .insert(licenses)
                .values({
                  orgId: inv.orgId,
                  customerId: inv.customerId,
                  plan: sub?.plan ?? "starter",
                  status: "active",
                  key: licenseKey,
                  maxDevices,
                  validUntil,
                } as any)
                .returning();

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
