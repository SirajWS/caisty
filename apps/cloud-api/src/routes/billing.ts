import type { FastifyInstance, FastifyRequest } from "fastify";
import { billingService } from "../billing/billingServiceInstance.js";
import { verifyPortalToken } from "../lib/portalJwt.js";
import type { CheckoutRequest } from "../billing/types.js";

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

export async function registerBillingRoutes(app: FastifyInstance) {
  // POST /api/billing/checkout
  app.post<{
    Body: CheckoutRequest;
  }>("/api/billing/checkout", async (request, reply) => {
    let payload: PortalJwtPayload;

    try {
      payload = getPortalAuth(request);
    } catch (err) {
      app.log.warn({ err }, "billing/checkout: invalid portal token");
      reply.code(401);
      return {
        ok: false,
        error: "unauthorized",
        message: "Invalid or missing portal token",
      };
    }

    const body = request.body;
    const idempotencyKey = request.headers["idempotency-key"] as string | undefined;

    // Generate idempotency key if not provided
    const finalIdempotencyKey = idempotencyKey || `checkout:${payload.orgId}:${body.planId}:${body.provider}:${Date.now()}`;

    try {
      const result = await billingService.checkout(
        {
          ...body,
          customerId: payload.customerId,
        },
        finalIdempotencyKey
      );

      return {
        ok: true,
        checkoutUrl: result.checkoutUrl,
        provider: result.provider,
        providerEnv: result.providerEnv,
      };
    } catch (err: any) {
      app.log.error({ err, body, customerId: payload.customerId }, "billing/checkout failed");
      reply.code(500);
      return {
        ok: false,
        error: "checkout_failed",
        message: err?.message ?? "Checkout konnte nicht gestartet werden.",
      };
    }
  });
}

