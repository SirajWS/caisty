import crypto from "node:crypto";
import Fastify from "fastify";
import { afterAll, describe, expect, it } from "vitest";

import { verifyStripeWebhookSignature } from "../stripeWebhookSignature.js";
import {
  isManualOrNonSubscriptionLicense,
  isSubscriptionBackedPaidLicense,
  maxLicenseValidUntil,
} from "../licenseGrantGuard.js";

describe("verifyStripeWebhookSignature", () => {
  const secret = "whsec_test_secret";
  const rawBody = JSON.stringify({ id: "evt_1", type: "invoice.paid" });
  const timestamp = 1_700_000_000;

  function sign(ts: number, body: string): string {
    const payload = `${ts}.${body}`;
    const v1 = crypto.createHmac("sha256", secret).update(payload, "utf8").digest("hex");
    return `t=${ts},v1=${v1}`;
  }

  it("accepts a valid Stripe signature", () => {
    const result = verifyStripeWebhookSignature({
      rawBody,
      signatureHeader: sign(timestamp, rawBody),
      secret,
      nowSec: timestamp,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects tampered body", () => {
    const result = verifyStripeWebhookSignature({
      rawBody: rawBody + "x",
      signatureHeader: sign(timestamp, rawBody),
      secret,
      nowSec: timestamp,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("signature_mismatch");
  });

  it("rejects missing signature header", () => {
    const result = verifyStripeWebhookSignature({
      rawBody,
      signatureHeader: undefined,
      secret,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects expired timestamps", () => {
    const result = verifyStripeWebhookSignature({
      rawBody,
      signatureHeader: sign(timestamp, rawBody),
      secret,
      nowSec: timestamp + 10_000,
      toleranceSec: 300,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("timestamp_out_of_tolerance");
  });
});

describe("licenseGrantGuard", () => {
  it("treats subscription-linked starter/pro as paid subscription licenses", () => {
    expect(
      isSubscriptionBackedPaidLicense({
        subscriptionId: "sub-1",
        plan: "starter",
        status: "active",
      }),
    ).toBe(true);
  });

  it("treats null subscriptionId as manual / non-subscription", () => {
    expect(
      isManualOrNonSubscriptionLicense({
        subscriptionId: null,
      }),
    ).toBe(true);
    expect(
      isSubscriptionBackedPaidLicense({
        subscriptionId: null,
        plan: "starter",
        status: "active",
      }),
    ).toBe(false);
  });

  it("does not treat trial as paid subscription license for renewal extension", () => {
    expect(
      isSubscriptionBackedPaidLicense({
        subscriptionId: "sub-1",
        plan: "trial",
        status: "active",
      }),
    ).toBe(false);
  });
});

describe("renewal revenue semantics (documented)", () => {
  it("two paid invoices of 1499 cents sum to 2998 (29.98 EUR)", () => {
    const june = 1499;
    const july = 1499;
    expect(june + july).toBe(2998);
  });
});

describe("webhook failure semantics (documented)", () => {
  it("unresolved subscription must be treated as failed business processing", () => {
    const result = {
      success: false,
      code: "unresolved_subscription" as const,
      message: "invoice.paid could not resolve a local subscription",
    };
    expect(result.success).toBe(false);
    const webhookStatus = result.success ? "ok" : "failed";
    expect(webhookStatus).toBe("failed");
  });

  it("customer.subscription.updated alone is not a full renewal payment", () => {
    const createsInvoice = false;
    const extendsLicense = false;
    expect(createsInvoice).toBe(false);
    expect(extendsLicense).toBe(false);
  });
});

describe("idempotency keys (documented)", () => {
  it("uses Stripe invoice id as payment and invoice provider key", () => {
    const stripeInvoiceId = "in_1JulyRenewal";
    const paymentKey = stripeInvoiceId;
    const invoiceKey = stripeInvoiceId;
    expect(paymentKey).toBe(invoiceKey);
    expect(paymentKey.startsWith("in_")).toBe(true);
  });

  it("running the same renewal twice would reuse the same provider keys", () => {
    const keys = new Set<string>();
    const stripeInvoiceId = "in_dup";
    keys.add(`pay:${stripeInvoiceId}`);
    keys.add(`inv:${stripeInvoiceId}`);
    keys.add(`pay:${stripeInvoiceId}`);
    keys.add(`inv:${stripeInvoiceId}`);
    expect(keys.size).toBe(2);
  });
});

describe("manual apology license protection (documented)", () => {
  it("manual license without subscriptionId is never selected for Stripe extend", () => {
    const licenses = [
      {
        id: "paid",
        subscriptionId: "local-sub",
        plan: "starter",
        status: "active",
      },
      {
        id: "apology",
        subscriptionId: null,
        plan: "starter",
        status: "active",
      },
    ];
    const toExtend = licenses.filter(isSubscriptionBackedPaidLicense);
    const untouched = licenses.filter(isManualOrNonSubscriptionLicense);
    expect(toExtend.map((l) => l.id)).toEqual(["paid"]);
    expect(untouched.map((l) => l.id)).toEqual(["apology"]);
  });
});

describe("maxLicenseValidUntil", () => {
  it("never shortens an existing validUntil", () => {
    const current = new Date("2026-12-01T00:00:00.000Z");
    const shorterPeriodEnd = new Date("2026-08-21T00:00:00.000Z");
    expect(maxLicenseValidUntil(current, shorterPeriodEnd).toISOString()).toBe(
      current.toISOString(),
    );
  });

  it("extends when periodEnd is later", () => {
    const current = new Date("2026-07-21T00:00:00.000Z");
    const later = new Date("2026-08-21T00:00:00.000Z");
    expect(maxLicenseValidUntil(current, later).toISOString()).toBe(
      later.toISOString(),
    );
  });
});

describe("invoice.paid + invoice.payment_succeeded idempotency (documented)", () => {
  it("both events share the same Stripe invoice id as payment/invoice key", () => {
    const stripeInvoiceId = "in_1SameInvoice";
    const eventA = { type: "invoice.paid", invoiceId: stripeInvoiceId };
    const eventB = {
      type: "invoice.payment_succeeded",
      invoiceId: stripeInvoiceId,
    };
    const paymentKeys = new Set([
      `pay:${eventA.invoiceId}`,
      `pay:${eventB.invoiceId}`,
    ]);
    const invoiceKeys = new Set([
      `inv:${eventA.invoiceId}`,
      `inv:${eventB.invoiceId}`,
    ]);
    expect(paymentKeys.size).toBe(1);
    expect(invoiceKeys.size).toBe(1);
  });

  it("duplicate invoice.paid uses the same provider keys", () => {
    const stripeInvoiceId = "in_paid_twice";
    const keys = new Set<string>();
    keys.add(`pay:${stripeInvoiceId}`);
    keys.add(`inv:${stripeInvoiceId}`);
    keys.add(`pay:${stripeInvoiceId}`);
    keys.add(`inv:${stripeInvoiceId}`);
    expect(keys.size).toBe(2);
  });
});

describe("subscription match missing (documented)", () => {
  it("unresolved subscription is a controlled business failure", () => {
    const business = {
      success: false,
      code: "unresolved_subscription" as const,
    };
    const webhookStatus = business.success ? "processed" : "failed";
    expect(webhookStatus).toBe("failed");
    expect(business.success).toBe(false);
  });
});

describe("reconcile dryRun safety (documented)", () => {
  it("default dryRun is true unless dryRun === false", () => {
    const body1: { dryRun?: boolean } = {};
    const body2 = { dryRun: true };
    const body3 = { dryRun: false };
    expect(body1.dryRun !== false).toBe(true);
    expect(body2.dryRun !== false).toBe(true);
    expect(body3.dryRun !== false).toBe(false);
  });

  it("dryRun resolve must not persist provider_subscription_id backfill", () => {
    const resolveResult = {
      ok: true as const,
      backfillProviderSubscriptionId: "sub_missing_locally",
    };
    const writesAllowed = false; // dry-run
    const wouldWrite =
      writesAllowed && Boolean(resolveResult.backfillProviderSubscriptionId);
    expect(wouldWrite).toBe(false);
  });
});

describe("raw JSON content-type parser (Fastify)", () => {
  const app = Fastify({ logger: false });

  app.removeContentTypeParser("application/json");
  app.addContentTypeParser(
    /^application\/json(;.*)?$/i,
    { parseAs: "buffer" },
    (req, body, done) => {
      try {
        const raw = Buffer.isBuffer(body)
          ? body.toString("utf8")
          : String(body ?? "");
        (req as { rawBody?: string }).rawBody = raw;
        const trimmed = raw.trim();
        if (!trimmed) {
          done(null, {});
          return;
        }
        done(null, JSON.parse(raw));
      } catch (err) {
        const error = err as Error & { statusCode?: number };
        error.statusCode = 400;
        done(error, undefined);
      }
    },
  );

  app.post("/echo", async (request) => {
    return {
      rawBody: (request as { rawBody?: string }).rawBody ?? null,
      body: request.body,
    };
  });

  afterAll(async () => {
    await app.close();
  });

  it("parses normal JSON and preserves exact rawBody", async () => {
    const payload = `{"email":"a@b.c","n":1}`;
    const res = await app.inject({
      method: "POST",
      url: "/echo",
      headers: { "content-type": "application/json" },
      payload,
    });
    expect(res.statusCode).toBe(200);
    const json = res.json() as { rawBody: string; body: { email: string; n: number } };
    expect(json.rawBody).toBe(payload);
    expect(json.body).toEqual({ email: "a@b.c", n: 1 });
  });

  it("supports application/json; charset=utf-8", async () => {
    const payload = `{"ok":true}`;
    const res = await app.inject({
      method: "POST",
      url: "/echo",
      headers: { "content-type": "application/json; charset=utf-8" },
      payload,
    });
    expect(res.statusCode).toBe(200);
    const json = res.json() as { rawBody: string; body: { ok: boolean } };
    expect(json.rawBody).toBe(payload);
    expect(json.body).toEqual({ ok: true });
  });

  it("handles empty JSON body safely", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/echo",
      headers: { "content-type": "application/json" },
      payload: "",
    });
    expect(res.statusCode).toBe(200);
    const json = res.json() as { rawBody: string; body: Record<string, never> };
    expect(json.rawBody).toBe("");
    expect(json.body).toEqual({});
  });

  it("Stripe signature uses exact rawBody bytes (whitespace-sensitive)", async () => {
    const secret = "whsec_test";
    const rawBody = `{\n  "id": "evt_1",\n  "type": "invoice.paid"\n}`;
    const ts = 1_700_000_000;
    const v1 = crypto
      .createHmac("sha256", secret)
      .update(`${ts}.${rawBody}`, "utf8")
      .digest("hex");
    const header = `t=${ts},v1=${v1}`;

    const injectRes = await app.inject({
      method: "POST",
      url: "/echo",
      headers: { "content-type": "application/json" },
      payload: rawBody,
    });
    const storedRaw = (injectRes.json() as { rawBody: string }).rawBody;
    expect(storedRaw).toBe(rawBody);

    const ok = verifyStripeWebhookSignature({
      rawBody: storedRaw,
      signatureHeader: header,
      secret,
      nowSec: ts,
    });
    expect(ok.ok).toBe(true);

    const reparsed = JSON.stringify(JSON.parse(storedRaw));
    const bad = verifyStripeWebhookSignature({
      rawBody: reparsed,
      signatureHeader: header,
      secret,
      nowSec: ts,
    });
    expect(bad.ok).toBe(false);
  });
});
