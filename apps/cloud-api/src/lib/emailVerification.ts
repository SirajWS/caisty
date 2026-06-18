import { and, eq, isNull } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { db } from "../db/client.js";
import { customers } from "../db/schema/customers.js";
import { emailVerifications } from "../db/schema/emailVerifications.js";
import { generateAuthToken, hashAuthToken } from "./authTokens.js";
import { sendEmailVerificationEmail } from "./email.js";
import { ENV } from "../config/env.js";

const VERIFICATION_TTL_HOURS = 24;

function frontendBaseUrl(): string {
  return (
    process.env.FRONTEND_URL?.trim() ||
    ENV.PORTAL_BASE_URL
  );
}

export async function issueEmailVerificationToken(
  customerId: string,
  email: string,
  log?: FastifyInstance["log"],
): Promise<{ verifyLink: string; token: string } | null> {
  const token = generateAuthToken();
  const tokenHash = hashAuthToken(token);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + VERIFICATION_TTL_HOURS);

  await db
    .delete(emailVerifications)
    .where(
      and(
        eq(emailVerifications.customerId, customerId),
        isNull(emailVerifications.usedAt),
      ),
    );

  await db.insert(emailVerifications).values({
    customerId,
    tokenHash,
    expiresAt,
  });

  const verifyLink = `${frontendBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;

  try {
    await sendEmailVerificationEmail(email, verifyLink);
    log?.info({ email, customerId }, "Verification email sent");
  } catch (err) {
    log?.error({ err, email, customerId }, "Verification email failed to send");
    if (ENV.NODE_ENV === "development") {
      log?.warn({ verifyLink }, "Development: verification link (email send failed)");
      return { verifyLink, token };
    }
    return null;
  }

  return ENV.NODE_ENV === "development" ? { verifyLink, token } : { verifyLink, token: "" };
}

export async function markCustomerEmailVerified(customerId: string): Promise<void> {
  const now = new Date();
  await db
    .update(customers)
    .set({
      emailVerifiedAt: now,
      portalStatus: "active",
    })
    .where(eq(customers.id, customerId));
}

export function isCustomerEmailVerified(
  customer: { emailVerifiedAt: Date | null },
): boolean {
  return customer.emailVerifiedAt != null;
}
