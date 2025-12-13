# 💳 Payment-Architektur Implementierung - Detaillierte Anleitung

## 🎯 Ziel

Saubere, auditierbare Payment-Architektur mit PayPal + Stripe, die:
- Provider-agnostisch ist
- Idempotency unterstützt
- Test/Live trennt
- Vollständig auditierbar ist

---

## 📋 Phase 1: DB-Schema Erweiterung (Tag 1)

### Schritt 1.1: Neue Tabellen erstellen

#### `apps/cloud-api/src/db/schema/billingCustomers.ts`

```typescript
import { pgTable, uuid, varchar, text, timestamp, unique } from "drizzle-orm/pg-core";
import { orgs } from "./orgs.js";

export const billingCustomers = pgTable(
  "billing_customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 50 }).notNull().$type<"stripe" | "paypal">(),
    providerEnv: varchar("provider_env", { length: 50 }).notNull().$type<"test" | "live">(),
    providerCustomerId: varchar("provider_customer_id", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    uniqueProviderCustomer: unique().on(
      table.provider,
      table.providerEnv,
      table.providerCustomerId
    ),
  })
);
```

#### `apps/cloud-api/src/db/schema/invoiceLines.ts`

```typescript
import { pgTable, uuid, varchar, integer, text } from "drizzle-orm/pg-core";
import { invoices } from "./invoices.js";

export const invoiceLines = pgTable("invoice_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitAmountNet: integer("unit_amount_net").notNull(), // in cents
  amountNet: integer("amount_net").notNull(), // in cents
  taxRate: integer("tax_rate").notNull().default(19), // 19 = 19%
  amountTax: integer("amount_tax").notNull(), // in cents
  amountGross: integer("amount_gross").notNull(), // in cents
});
```

#### `apps/cloud-api/src/db/schema/idempotencyKeys.ts`

```typescript
import { pgTable, uuid, varchar, text, timestamp, jsonb, unique } from "drizzle-orm/pg-core";
import { orgs } from "./orgs.js";

export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: varchar("key", { length: 255 }).notNull().unique(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    scope: varchar("scope", { length: 100 }).notNull(), // z.B. "create_checkout", "cancel_subscription"
    requestHash: text("request_hash").notNull(), // SHA256 des Request-Bodies
    responseJson: jsonb("response_json"), // Cached Response
    createdAt: timestamp("created_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at").notNull(), // z.B. 24h später
  },
  (table) => ({
    uniqueKey: unique().on(table.key),
  })
);
```

### Schritt 1.2: Bestehende Tabellen erweitern

#### `apps/cloud-api/src/db/schema/subscriptions.ts` (ERWEITERN)

**Hinzufügen:**
```typescript
provider: varchar("provider", { length: 50 }).$type<"stripe" | "paypal">(),
providerEnv: varchar("provider_env", { length: 50 }).$type<"test" | "live">(),
providerSubscriptionId: varchar("provider_subscription_id", { length: 255 }),
cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
canceledAt: timestamp("canceled_at"),
```

**Unique Constraint hinzufügen:**
```typescript
uniqueProviderSubscription: unique().on(
  table.provider,
  table.providerEnv,
  table.providerSubscriptionId
),
```

#### `apps/cloud-api/src/db/schema/payments.ts` (ERWEITERN)

**Hinzufügen:**
```typescript
providerEnv: varchar("provider_env", { length: 50 }).$type<"test" | "live">(),
amountNet: integer("amount_net"), // in cents
amountTax: integer("amount_tax"), // in cents
failureCode: varchar("failure_code", { length: 100 }),
failureMessage: text("failure_message"),
```

**Unique Constraint hinzufügen:**
```typescript
uniqueProviderPayment: unique().on(
  table.provider,
  table.providerEnv,
  table.providerPaymentId
),
```

#### `apps/cloud-api/src/db/schema/invoices.ts` (ERWEITERN)

**Hinzufügen:**
```typescript
provider: varchar("provider", { length: 50 }).$type<"stripe" | "paypal">(),
providerEnv: varchar("provider_env", { length: 50 }).$type<"test" | "live">(),
providerInvoiceId: varchar("provider_invoice_id", { length: 255 }),
amountNet: integer("amount_net"), // in cents
amountTax: integer("amount_tax"), // in cents
pdfUrl: text("pdf_url"),
paidAt: timestamp("paid_at"),
```

**Unique Constraint hinzufügen:**
```typescript
uniqueProviderInvoice: unique().on(
  table.provider,
  table.providerEnv,
  table.providerInvoiceId
),
```

#### `apps/cloud-api/src/db/schema/webhooks.ts` → `webhookEvents.ts` (UMBENENNEN & ERWEITERN)

**Umbenennen zu `webhookEvents.ts` und erweitern:**
```typescript
import { pgTable, uuid, varchar, text, timestamp, jsonb, unique } from "drizzle-orm/pg-core";
import { orgs } from "./orgs.js";

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 50 }).notNull().$type<"stripe" | "paypal">(),
    providerEnv: varchar("provider_env", { length: 50 }).notNull().$type<"test" | "live">(),
    eventId: varchar("event_id", { length: 255 }).notNull(), // Provider-spezifische Event-ID
    eventType: varchar("event_type", { length: 100 }).notNull(),
    payloadJson: jsonb("payload_json").notNull(),
    receivedAt: timestamp("received_at").notNull().defaultNow(),
    processedAt: timestamp("processed_at"),
    processStatus: varchar("process_status", { length: 50 })
      .notNull()
      .default("pending")
      .$type<"pending" | "ok" | "failed">(),
    error: text("error"),
  },
  (table) => ({
    uniqueProviderEvent: unique().on(
      table.provider,
      table.providerEnv,
      table.eventId
    ),
  })
);
```

### Schritt 1.3: Schema Index aktualisieren

**`apps/cloud-api/src/db/schema/index.ts`**

Alle neuen Tabellen exportieren:
```typescript
export * from "./billingCustomers.js";
export * from "./invoiceLines.js";
export * from "./idempotencyKeys.js";
export * from "./webhookEvents.js"; // statt webhooks
```

### Schritt 1.4: Migration generieren

```bash
cd apps/cloud-api
pnpm drizzle-kit generate
```

**Prüfen:** `apps/cloud-api/drizzle/009_payment_architecture.sql` sollte erstellt werden.

**Migration ausführen:**
```bash
# Prüfen
psql $DATABASE_URL -f drizzle/009_payment_architecture.sql --dry-run

# Ausführen
psql $DATABASE_URL -f drizzle/009_payment_architecture.sql
```

---

## 📋 Phase 2: Provider Interface & Billing Service (Tag 2)

### Schritt 2.1: Provider Interface

#### `apps/cloud-api/src/billing/providers/PaymentProvider.ts`

```typescript
export interface CreateCheckoutInput {
  orgId: string;
  customerId: string;
  email: string;
  planId: "starter" | "pro";
  billingPeriod: "monthly" | "yearly";
  amountNet: number; // in cents
  amountTax: number; // in cents
  amountGross: number; // in cents
  currency: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutResult {
  redirectUrl: string;
  providerRef: string; // z.B. Stripe Session ID oder PayPal Order ID
}

export interface CreateSubscriptionInput {
  orgId: string;
  billingCustomerId: string;
  planId: "starter" | "pro";
  billingPeriod: "monthly" | "yearly";
  amountNet: number;
  amountTax: number;
  amountGross: number;
  currency: string;
}

export interface SubscriptionResult {
  providerSubscriptionId: string;
}

export interface VerifiedEvent {
  id: string;
  type: string;
  data: any;
  provider: "stripe" | "paypal";
  env: "test" | "live";
}

export interface PaymentProvider {
  name: "stripe" | "paypal";
  env: "test" | "live";

  createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutResult>;
  createSubscription?(input: CreateSubscriptionInput): Promise<SubscriptionResult>;
  cancelSubscription(providerSubscriptionId: string): Promise<void>;
  parseAndVerifyWebhook(
    rawBody: Buffer,
    headers: Record<string, string>
  ): Promise<VerifiedEvent>;
}
```

### Schritt 2.2: PayPal Provider (Refactoring)

#### `apps/cloud-api/src/billing/providers/PayPalProvider.ts`

```typescript
import type { PaymentProvider, CreateCheckoutInput, CheckoutResult, VerifiedEvent } from "./PaymentProvider.js";

const PAYPAL_BASE_URL_TEST = "https://api-m.sandbox.paypal.com";
const PAYPAL_BASE_URL_LIVE = "https://api-m.paypal.com";

export class PayPalProvider implements PaymentProvider {
  name = "paypal" as const;
  env: "test" | "live";
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;

  constructor(env: "test" | "live") {
    this.env = env;
    this.clientId = env === "test" 
      ? process.env.PAYPAL_CLIENT_ID_TEST || process.env.PAYPAL_CLIENT_ID || ""
      : process.env.PAYPAL_CLIENT_ID_LIVE || "";
    this.clientSecret = env === "test"
      ? process.env.PAYPAL_CLIENT_SECRET_TEST || process.env.PAYPAL_CLIENT_SECRET || ""
      : process.env.PAYPAL_CLIENT_SECRET_LIVE || "";
    this.baseUrl = env === "test" ? PAYPAL_BASE_URL_TEST : PAYPAL_BASE_URL_LIVE;
  }

  private async getAccessToken(): Promise<string> {
    const res = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`PayPal token failed: ${res.status} ${txt}`);
    }

    const data = await res.json() as { access_token: string };
    return data.access_token;
  }

  async createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutResult> {
    const accessToken = await this.getAccessToken();
    const amount = (input.amountGross / 100).toFixed(2);

    const res = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
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
              currency_code: input.currency,
              value: amount,
            },
            description: `${input.planId} - ${input.billingPeriod}`,
          },
        ],
        application_context: {
          return_url: input.successUrl,
          cancel_url: input.cancelUrl,
        },
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`PayPal order failed: ${res.status} ${txt}`);
    }

    const data = await res.json() as any;
    const approvalLink = (data.links || []).find((l: any) => l.rel === "approve");

    if (!data.id || !approvalLink?.href) {
      throw new Error("PayPal order missing id or approval link");
    }

    return {
      redirectUrl: approvalLink.href,
      providerRef: String(data.id),
    };
  }

  async cancelSubscription(providerSubscriptionId: string): Promise<void> {
    // PayPal Subscriptions API - später implementieren
    throw new Error("PayPal subscription cancellation not yet implemented");
  }

  async parseAndVerifyWebhook(
    rawBody: Buffer,
    headers: Record<string, string>
  ): Promise<VerifiedEvent> {
    // TODO: Echte Signatur-Verifikation implementieren
    const body = JSON.parse(rawBody.toString());
    
    return {
      id: body.id || body.event_id || "",
      type: body.event_type || body.type || "",
      data: body,
      provider: "paypal",
      env: this.env,
    };
  }
}
```

### Schritt 2.3: Stripe Provider (Neu)

#### `apps/cloud-api/src/billing/providers/StripeProvider.ts`

```typescript
import Stripe from "stripe";
import type { PaymentProvider, CreateCheckoutInput, CheckoutResult, VerifiedEvent } from "./PaymentProvider.js";

export class StripeProvider implements PaymentProvider {
  name = "stripe" as const;
  env: "test" | "live";
  private stripe: Stripe;

  constructor(env: "test" | "live") {
    this.env = env;
    const secretKey = env === "test"
      ? process.env.STRIPE_SECRET_KEY_TEST || ""
      : process.env.STRIPE_SECRET_KEY_LIVE || "";
    
    if (!secretKey) {
      throw new Error(`Stripe ${env} secret key not configured`);
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: "2024-11-20.acacia",
    });
  }

  async createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutResult> {
    // 1. Customer erstellen oder finden
    const customer = await this.stripe.customers.create({
      email: input.email,
      metadata: {
        orgId: input.orgId,
        customerId: input.customerId,
      },
    });

    // 2. Checkout Session erstellen
    const session = await this.stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: input.currency.toLowerCase(),
            product_data: {
              name: `${input.planId} Plan`,
              description: `${input.planId} - ${input.billingPeriod}`,
            },
            unit_amount: input.amountGross, // in cents
            recurring: {
              interval: input.billingPeriod === "monthly" ? "month" : "year",
            },
          },
          quantity: 1,
        },
      ],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      billing_address_collection: "required",
      metadata: {
        orgId: input.orgId,
        customerId: input.customerId,
        planId: input.planId,
        billingPeriod: input.billingPeriod,
      },
    });

    if (!session.url) {
      throw new Error("Stripe session missing URL");
    }

    return {
      redirectUrl: session.url,
      providerRef: session.id,
    };
  }

  async cancelSubscription(providerSubscriptionId: string): Promise<void> {
    await this.stripe.subscriptions.cancel(providerSubscriptionId);
  }

  async parseAndVerifyWebhook(
    rawBody: Buffer,
    headers: Record<string, string>
  ): Promise<VerifiedEvent> {
    const signature = headers["stripe-signature"];
    const webhookSecret = this.env === "test"
      ? process.env.STRIPE_WEBHOOK_SECRET_TEST || ""
      : process.env.STRIPE_WEBHOOK_SECRET_LIVE || "";

    if (!signature || !webhookSecret) {
      throw new Error("Missing Stripe signature or webhook secret");
    }

    const event = this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );

    return {
      id: event.id,
      type: event.type,
      data: event.data.object,
      provider: "stripe",
      env: this.env,
    };
  }
}
```

**Stripe Package installieren:**
```bash
cd apps/cloud-api
pnpm add stripe
pnpm add -D @types/stripe
```

### Schritt 2.4: Billing Service

#### `apps/cloud-api/src/billing/BillingService.ts`

```typescript
import { db } from "../db/client.js";
import { billingCustomers } from "../db/schema/billingCustomers.js";
import { subscriptions } from "../db/schema/subscriptions.js";
import { invoices } from "../db/schema/invoices.js";
import { payments } from "../db/schema/payments.js";
import { eq, and } from "drizzle-orm";
import { PayPalProvider } from "./providers/PayPalProvider.js";
import { StripeProvider } from "./providers/StripeProvider.js";
import type { PaymentProvider, CreateCheckoutInput, CheckoutResult } from "./providers/PaymentProvider.js";

export class BillingService {
  private getProvider(paymentMethod: "paypal" | "card", env: "test" | "live" = "test"): PaymentProvider {
    if (paymentMethod === "paypal") {
      return new PayPalProvider(env);
    } else {
      return new StripeProvider(env);
    }
  }

  async createCheckout(input: CreateCheckoutInput & { paymentMethod: "paypal" | "card" }): Promise<CheckoutResult> {
    const env: "test" | "live" = process.env.NODE_ENV === "production" ? "live" : "test";
    const provider = this.getProvider(input.paymentMethod, env);

    // 1. Billing Customer erstellen oder finden
    const billingCustomer = await this.ensureBillingCustomer({
      orgId: input.orgId,
      email: input.email,
      provider: provider.name,
      providerEnv: env,
    });

    // 2. Checkout Session beim Provider erstellen
    const result = await provider.createCheckoutSession({
      ...input,
      // Provider-spezifische Customer-ID verwenden
    });

    return result;
  }

  private async ensureBillingCustomer(params: {
    orgId: string;
    email: string;
    provider: "stripe" | "paypal";
    providerEnv: "test" | "live";
  }) {
    // TODO: Implementierung - Customer beim Provider erstellen/finden
    // und in billing_customers speichern
    return null;
  }
}
```

---

## 📋 Phase 3: API Endpoints & Idempotency (Tag 3-4)

### Schritt 3.1: Idempotency Service

#### `apps/cloud-api/src/billing/IdempotencyService.ts`

```typescript
import { db } from "../db/client.js";
import { idempotencyKeys } from "../db/schema/idempotencyKeys.js";
import { eq, and, gt } from "drizzle-orm";
import { createHash } from "crypto";
import { addHours } from "date-fns";

export class IdempotencyService {
  private generateKey(scope: string, orgId: string, ...parts: string[]): string {
    return `${scope}:${orgId}:${parts.join(":")}`;
  }

  private hashRequest(body: any): string {
    const str = JSON.stringify(body);
    return createHash("sha256").update(str).digest("hex");
  }

  async checkOrCreate(
    key: string,
    orgId: string,
    scope: string,
    requestBody: any
  ): Promise<{ exists: boolean; cachedResponse?: any }> {
    const requestHash = this.hashRequest(requestBody);
    const expiresAt = addHours(new Date(), 24);

    try {
      // Versuche zu inserten
      await db.insert(idempotencyKeys).values({
        key,
        orgId,
        scope,
        requestHash,
        expiresAt,
      });

      return { exists: false };
    } catch (err: any) {
      // Unique constraint violation = Key existiert bereits
      if (err.code === "23505") {
        // Hole existierenden Key
        const [existing] = await db
          .select()
          .from(idempotencyKeys)
          .where(
            and(
              eq(idempotencyKeys.key, key),
              gt(idempotencyKeys.expiresAt, new Date())
            )
          )
          .limit(1);

        if (existing && existing.responseJson) {
          return { exists: true, cachedResponse: existing.responseJson };
        }
      }

      throw err;
    }
  }

  async saveResponse(key: string, response: any): Promise<void> {
    await db
      .update(idempotencyKeys)
      .set({ responseJson: response })
      .where(eq(idempotencyKeys.key, key));
  }
}
```

### Schritt 3.2: Billing Routes

#### `apps/cloud-api/src/routes/billing.ts`

```typescript
import type { FastifyInstance, FastifyRequest } from "fastify";
import { BillingService } from "../billing/BillingService.js";
import { IdempotencyService } from "../billing/IdempotencyService.js";
import { verifyPortalToken } from "../lib/portalJwt.js";

interface PortalJwtPayload {
  customerId: string;
  orgId: string;
}

function getPortalAuth(request: FastifyRequest): PortalJwtPayload {
  const auth = request.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    throw new Error("Missing portal token");
  }
  const token = auth.slice("Bearer ".length);
  return verifyPortalToken(token) as PortalJwtPayload;
}

export async function registerBillingRoutes(app: FastifyInstance) {
  const billingService = new BillingService();
  const idempotencyService = new IdempotencyService();

  // POST /api/billing/checkout
  app.post("/api/billing/checkout", async (request, reply) => {
    const payload = getPortalAuth(request);
    const body = request.body as {
      planId: "starter" | "pro";
      billingPeriod: "monthly" | "yearly";
      paymentMethod: "paypal" | "card";
      successUrl?: string;
      cancelUrl?: string;
    };

    // Idempotency Key generieren
    const idempotencyKey = idempotencyService.generateKey(
      "create_checkout",
      payload.orgId,
      body.planId,
      body.billingPeriod,
      body.paymentMethod
    );

    // Prüfe Idempotency
    const { exists, cachedResponse } = await idempotencyService.checkOrCreate(
      idempotencyKey,
      payload.orgId,
      "create_checkout",
      body
    );

    if (exists && cachedResponse) {
      return cachedResponse;
    }

    // TODO: Customer aus DB holen
    // TODO: Pricing berechnen
    // TODO: Checkout erstellen

    const result = await billingService.createCheckout({
      orgId: payload.orgId,
      customerId: payload.customerId,
      email: "", // TODO: aus DB
      planId: body.planId,
      billingPeriod: body.billingPeriod,
      paymentMethod: body.paymentMethod,
      amountNet: 0, // TODO: berechnen
      amountTax: 0, // TODO: berechnen
      amountGross: 0, // TODO: berechnen
      currency: "EUR",
      successUrl: body.successUrl || `${process.env.PORTAL_BASE_URL}/portal/upgrade/result?status=success`,
      cancelUrl: body.cancelUrl || `${process.env.PORTAL_BASE_URL}/portal/upgrade/result?status=cancelled`,
    });

    // Response cachen
    await idempotencyService.saveResponse(idempotencyKey, result);

    return result;
  });
}
```

**In `apps/cloud-api/src/server.ts` registrieren:**
```typescript
import { registerBillingRoutes } from "./routes/billing.js";

// ...
await registerBillingRoutes(app);
```

---

## 📋 Phase 4: Frontend Integration (Tag 5)

### Schritt 4.1: PortalApi erweitern

#### `apps/caisty-site/src/lib/portalApi.ts` (ERWEITERN)

```typescript
export async function startPortalUpgrade(
  plan: "starter" | "pro",
  paymentMethod: "paypal" | "card" = "paypal"
): Promise<PortalUpgradeStartResponse> {
  const token = getStoredPortalToken();
  if (!token) throw Error("Nicht angemeldet.");

  const res = await fetch(`${API_BASE}/api/billing/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      planId: plan,
      billingPeriod: "monthly",
      paymentMethod,
    }),
  });

  if (res.status === 401) {
    clearPortalToken();
    throw new Error("Nicht angemeldet.");
  }

  const data = (await res.json()) as PortalUpgradeStartResponse;

  if (!res.ok || !data.ok) {
    throw new Error(data.message ?? "Upgrade konnte nicht gestartet werden.");
  }

  return data;
}
```

### Schritt 4.2: PortalCheckoutPage anpassen

#### `apps/caisty-site/src/routes/PortalCheckoutPage.tsx` (ANPASSEN)

```typescript
async function handlePayment() {
  try {
    setError(null);
    setProcessing(true);

    const res = await startPortalUpgrade(plan, selectedPaymentMethod);

    if (res.redirectUrl) {
      window.location.href = res.redirectUrl;
      return;
    }

    navigate("/portal/invoices");
  } catch (err: any) {
    console.error("payment failed", err);
    setError(err?.message ?? "Zahlung konnte nicht gestartet werden.");
  } finally {
    setProcessing(false);
  }
}

// Karte-Button aktivieren:
<label className="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer ..."
  style={{
    borderColor: selectedPaymentMethod === "card" ? "#10b981" : "#334155",
  }}
>
  <input
    type="radio"
    name="paymentMethod"
    value="card"
    checked={selectedPaymentMethod === "card"}
    onChange={(e) => setSelectedPaymentMethod(e.target.value as PaymentMethod)}
    // disabled entfernen!
  />
  ...
</label>
```

---

## 📋 Phase 5: Stripe Setup (Tag 6-7)

### Schritt 5.1: Stripe Account Setup

1. **Stripe Account erstellen**: https://dashboard.stripe.com/register
2. **Testmode API Keys holen**: Dashboard → Developers → API keys
3. **Products & Prices anlegen**:
   - Dashboard → Products
   - "Starter Monthly" → €14.99/month
   - "Starter Yearly" → €152/year
   - "Pro Monthly" → €29.99/month
   - "Pro Yearly" → €306/year

### Schritt 5.2: Environment Variables

#### `.env` (oder `.env.local`)

```env
# Stripe Testmode
STRIPE_SECRET_KEY_TEST=sk_test_...
STRIPE_WEBHOOK_SECRET_TEST=whsec_...

# Stripe Live (später)
STRIPE_SECRET_KEY_LIVE=sk_live_...
STRIPE_WEBHOOK_SECRET_LIVE=whsec_...

# PayPal (bereits vorhanden)
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
```

### Schritt 5.3: Stripe CLI für lokale Webhooks

```bash
# Stripe CLI installieren
# https://stripe.com/docs/stripe-cli

# Webhook-Forwarding starten
stripe listen --forward-to localhost:3333/webhooks/stripe
# → gibt whsec_... Secret aus → in .env eintragen
```

---

## ✅ Testing Checklist

### Stripe Testmode
- [ ] Testkarte `4242 4242 4242 4242` (success)
- [ ] Testkarte `4000 0000 0000 0002` (declined)
- [ ] 3DS Testkarte `4000 0025 0000 3155`
- [ ] Webhook-Delivery prüfen
- [ ] DB-Einträge prüfen (billing_customers, subscriptions, payments)

### PayPal Sandbox
- [ ] PayPal Checkout Flow
- [ ] Return/Cancel Handler
- [ ] Webhook-Delivery
- [ ] DB-Einträge prüfen

### Idempotency
- [ ] Doppelklick auf "Bezahlen" → keine Doppelzahlung
- [ ] Gleicher Request → cached Response

---

## 🚨 Wichtige Hinweise

1. **Immer Testmode zuerst** - nie direkt Live testen!
2. **Idempotency ist kritisch** - verhindert Chaos
3. **Webhook-Verification** - immer Signatur prüfen
4. **DB-Audit** - jede Transaktion muss nachvollziehbar sein
5. **Error-Handling** - Provider-Fehler sauber behandeln

---

## 📝 Nächste Schritte

1. ✅ **Stripe Account erstellen** (du machst das jetzt)
2. ⏭️ **Phase 1 starten**: DB-Schema erweitern
3. ⏭️ **Schritt für Schritt** durch die Phasen gehen
4. ⏭️ **Testen, testen, testen**

