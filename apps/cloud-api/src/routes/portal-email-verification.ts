import type { FastifyInstance } from "fastify";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "../db/client.js";
import { customers } from "../db/schema/customers.js";
import { emailVerifications } from "../db/schema/emailVerifications.js";
import { hashAuthToken } from "../lib/authTokens.js";
import {
  issueEmailVerificationToken,
  markCustomerEmailVerified,
  isCustomerEmailVerified,
} from "../lib/emailVerification.js";
import { notificationService } from "../billing/NotificationService.js";
import { ENV } from "../config/env.js";

const GENERIC_RESEND_MESSAGE =
  "If an account exists for this email and is not yet verified, a verification link has been sent.";

export async function registerEmailVerificationRoutes(app: FastifyInstance) {
  // POST /api/auth/verify-email
  app.post("/api/auth/verify-email", async (request, reply) => {
    const body = request.body as { token?: string };
    const token = typeof body?.token === "string" ? body.token.trim() : "";

    if (!token) {
      reply.code(400);
      return { ok: false, error: "TOKEN_REQUIRED" };
    }

    try {
      const tokenHash = hashAuthToken(token);

      const [record] = await db
        .select({
          id: emailVerifications.id,
          customerId: emailVerifications.customerId,
          expiresAt: emailVerifications.expiresAt,
          usedAt: emailVerifications.usedAt,
          customer: customers,
        })
        .from(emailVerifications)
        .innerJoin(customers, eq(customers.id, emailVerifications.customerId))
        .where(eq(emailVerifications.tokenHash, tokenHash))
        .limit(1);

      if (!record) {
        reply.code(400);
        return { ok: false, error: "INVALID_OR_EXPIRED_TOKEN" };
      }

      if (record.usedAt) {
        reply.code(400);
        return { ok: false, error: "TOKEN_ALREADY_USED" };
      }

      if (record.expiresAt.getTime() < Date.now()) {
        reply.code(400);
        return { ok: false, error: "INVALID_OR_EXPIRED_TOKEN" };
      }

      if (!isCustomerEmailVerified(record.customer)) {
        await markCustomerEmailVerified(record.customerId);

        await notificationService.notifyPortalSignup({
          orgId: record.customer.orgId!,
          customerId: record.customerId,
          customerName: record.customer.name || undefined,
          customerEmail: record.customer.email,
        });
      }

      await db
        .update(emailVerifications)
        .set({ usedAt: new Date() })
        .where(eq(emailVerifications.id, record.id));

      return {
        ok: true,
        message: "Email verified successfully. You can now sign in.",
        email: record.customer.email,
      };
    } catch (err) {
      app.log.error({ err }, "verify-email failed");
      reply.code(500);
      return { ok: false, error: "SERVER_ERROR" };
    }
  });

  // POST /api/auth/resend-verification
  app.post("/api/auth/resend-verification", async (request, reply) => {
    const body = request.body as { email?: string };
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      reply.code(400);
      return { ok: false, error: "EMAIL_REQUIRED" };
    }

    try {
      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.email, email))
        .limit(1);

      if (!customer || isCustomerEmailVerified(customer) || !customer.passwordHash) {
        return { ok: true, message: GENERIC_RESEND_MESSAGE };
      }

      const issued = await issueEmailVerificationToken(
        customer.id,
        customer.email,
        app.log,
      );

      const response: {
        ok: boolean;
        message: string;
        verifyLink?: string;
      } = {
        ok: true,
        message: GENERIC_RESEND_MESSAGE,
      };

      if (ENV.NODE_ENV === "development" && issued?.verifyLink) {
        response.verifyLink = issued.verifyLink;
      }

      return response;
    } catch (err) {
      app.log.error({ err, email }, "resend-verification failed");
      reply.code(500);
      return { ok: false, error: "SERVER_ERROR" };
    }
  });
}
