import type { FastifyReply, FastifyRequest } from "fastify";

import type { AdminJwtPayload } from "./adminJwt.js";
export { loadActiveAdminUser } from "./adminUsersLookup.js";
import { loadActiveAdminUser } from "./adminUsersLookup.js";

export function isPublicUnauthenticatedRoute(
  url: string,
  method: string,
  nodeEnv: string,
): boolean {
  const m = method.toUpperCase();

  if (url === "/health") return true;
  if (url.startsWith("/public/")) return true;
  if (url === "/auth/login") return true;
  if (url.startsWith("/admin/auth/")) return true;
  if (url.startsWith("/portal/")) return true;
  if (url.startsWith("/api/auth/")) return true;
  if (url.startsWith("/api/billing/")) return true;
  if (url === "/webhooks/paypal" && m === "POST") return true;
  if (url === "/webhooks/stripe" && m === "POST") return true;
  if (url.startsWith("/webhooks/channels/") && m === "POST") return true;
  if (url === "/licenses/verify" && m === "POST") return true;
  if (url === "/devices/bind" && m === "POST") return true;
  if (url === "/devices/heartbeat" && m === "POST") return true;
  if (url === "/pos/config" && m === "GET") return true;
  if (url === "/pos/sync/batch" && m === "POST") return true;
  if (url === "/pos/sync/pull" && m === "POST") return true;
  if (url.startsWith("/country-config")) return true;
  if (nodeEnv === "development" && url.startsWith("/test-email")) return true;
  if (nodeEnv === "development" && url.startsWith("/test-reset-token")) {
    return true;
  }
  if (nodeEnv === "development" && url.startsWith("/debug/")) return true;
  return false;
}

/**
 * Platform-wide Super-Admin APIs (admin.caisty.com).
 * Excludes POS bind/heartbeat, license verify, Stripe/PayPal webhook POST, and Portal.
 */
export function isPlatformAdminRoute(url: string, method: string): boolean {
  const m = method.toUpperCase();

  if (url.startsWith("/admin/auth/")) return false;
  if (url.startsWith("/admin/")) return true;

  if (url === "/customers" || url.startsWith("/customers/")) return true;
  if (url === "/orgs" || url.startsWith("/orgs/")) return true;

  if (
    m === "GET" &&
    (url === "/devices" || url.startsWith("/devices/")) &&
    url !== "/devices/bind" &&
    url !== "/devices/heartbeat"
  ) {
    return true;
  }

  if (url.startsWith("/licenses")) {
    if (m === "POST" && url === "/licenses/verify") return false;
    return true;
  }

  if (url === "/subscriptions" || url.startsWith("/subscriptions/")) {
    return true;
  }

  if (url === "/invoices" || url.startsWith("/invoices/")) return true;

  if (url === "/payments" || url.startsWith("/payments/")) return true;

  if (m === "GET" && (url === "/webhooks" || url === "/webhooks/")) return true;

  if (url === "/notifications" || url.startsWith("/notifications/")) {
    return true;
  }

  return false;
}

export async function assertPlatformSuperadmin(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<boolean> {
  const user = (request as { user?: AdminJwtPayload & { isAdmin?: boolean } })
    .user;

  if (!user?.adminUserId || user.isAdmin !== true) {
    reply.code(403);
    await reply.send({
      error: "Forbidden",
      message: "Platform administrator access required.",
    });
    return false;
  }

  const admin = await loadActiveAdminUser(user.adminUserId);
  if (!admin) {
    reply.code(401);
    await reply.send({
      error: "Unauthorized",
      message: "Admin account is inactive or was not found.",
    });
    return false;
  }

  if (admin.role !== "superadmin") {
    reply.code(403);
    await reply.send({
      error: "Forbidden",
      message: "Superadmin access required for this operation.",
    });
    return false;
  }

  (request as { user?: unknown }).user = {
    ...user,
    role: admin.role,
    email: admin.email,
  };
  return true;
}
