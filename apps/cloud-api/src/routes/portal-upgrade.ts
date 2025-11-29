// apps/cloud-api/src/routes/portal-upgrade.ts
import type { FastifyInstance, FastifyRequest } from "fastify";
import { addDays, addMonths } from "date-fns";
import { eq } from "drizzle-orm";

import { db } from "../db/client.js";
import { customers } from "../db/schema/customers.js";
import { subscriptions } from "../db/schema/subscriptions.js";
import { invoices } from "../db/schema/invoices.js";
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

const PUBLIC_API_BASE_URL =
  process.env.PUBLIC_API_BASE_URL ?? "http://127.0.0.1:3333";

const PORTAL_BASE_URL =
  process.env.PORTAL_BASE_URL ?? "http://127.0.0.1:5153";

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

async function capturePaypalOrder(orderId: string): Promise<boolean> {
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

      const pricing = PLAN_PRICING[plan];
      const now = new Date();

      try {
        // 1) Subscription – nur Felder verwenden, die es sicher gibt
        const monthlyPriceCents = Math.round(pricing.monthlyAmount * 100);
        const currentPeriodEnd = addMonths(now, 1);

        const [sub] = await db
          .insert(subscriptions)
          .values({
            orgId: customer.orgId,
            customerId,
            plan,
            status: "active",
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
          // wir lassen redirectUrl undefined → Frontend schickt Nutzer zu /portal/invoices
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
        await db
          .update(invoices as any)
          .set({ status: "paid" } as any)
          .where(eq(invoices.id as any, invoiceId as any));

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

    const location = `${PORTAL_BASE_URL}/portal/upgrade/result?status=cancelled${
      invoiceId ? `&invoiceId=${encodeURIComponent(invoiceId)}` : ""
    }`;
    reply.redirect(location);
  });
}
