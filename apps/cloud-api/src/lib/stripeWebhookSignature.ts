import crypto from "node:crypto";

/**
 * Verify Stripe-Signature header (HMAC SHA256) without the Stripe SDK.
 * @see https://docs.stripe.com/webhooks/signatures
 */
export function verifyStripeWebhookSignature(params: {
  rawBody: string;
  signatureHeader: string | string[] | undefined;
  secret: string;
  /** Reject events older than this (default 300s). */
  toleranceSec?: number;
  nowSec?: number;
}): { ok: true; timestamp: number } | { ok: false; reason: string } {
  const header = Array.isArray(params.signatureHeader)
    ? params.signatureHeader[0]
    : params.signatureHeader;
  if (!header?.trim()) {
    return { ok: false, reason: "missing_stripe_signature" };
  }
  if (!params.secret.trim()) {
    return { ok: false, reason: "missing_webhook_secret" };
  }

  const parts = header.split(",").map((p) => p.trim());
  let timestamp: number | null = null;
  const v1Signatures: string[] = [];
  for (const part of parts) {
    const [k, v] = part.split("=");
    if (k === "t" && v) timestamp = Number(v);
    if (k === "v1" && v) v1Signatures.push(v);
  }
  if (timestamp == null || !Number.isFinite(timestamp)) {
    return { ok: false, reason: "invalid_signature_timestamp" };
  }
  if (v1Signatures.length === 0) {
    return { ok: false, reason: "missing_v1_signature" };
  }

  const tolerance = params.toleranceSec ?? 300;
  const now = params.nowSec ?? Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > tolerance) {
    return { ok: false, reason: "timestamp_out_of_tolerance" };
  }

  const payload = `${timestamp}.${params.rawBody}`;
  const expected = crypto
    .createHmac("sha256", params.secret)
    .update(payload, "utf8")
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  let matched = false;
  for (const sig of v1Signatures) {
    const got = Buffer.from(sig, "utf8");
    if (
      got.length === expectedBuf.length &&
      crypto.timingSafeEqual(got, expectedBuf)
    ) {
      matched = true;
      break;
    }
  }
  if (!matched) {
    return { ok: false, reason: "signature_mismatch" };
  }
  return { ok: true, timestamp };
}
