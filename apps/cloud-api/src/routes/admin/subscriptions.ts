// apps/cloud-api/src/routes/admin/subscriptions.ts
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { subscriptions } from "../../db/schema/subscriptions.js";

type PendingSubscriptionParams = { subscriptionId: string };

async function deletePendingSubscriptionHandler(
  request: FastifyRequest<{ Params: PendingSubscriptionParams }>,
  reply: FastifyReply,
) {
  const user = (request as { user?: { adminUserId?: string } }).user;
  if (!user?.adminUserId) {
    reply.code(403);
    return {
      error: "Forbidden",
      message: "Nur Administratoren dürfen Subscriptions löschen.",
    };
  }

  const { subscriptionId } = request.params;

  try {
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1);

    if (!sub) {
      reply.code(404);
      return {
        ok: false,
        error: "not_found",
        message: "Subscription wurde nicht gefunden.",
      };
    }

    if (String(sub.status).toLowerCase() !== "pending") {
      reply.code(400);
      return {
        ok: false,
        error: "invalid_status",
        message: "Nur pending Subscriptions können gelöscht werden.",
        currentStatus: sub.status,
      };
    }

    await db.delete(subscriptions).where(eq(subscriptions.id, subscriptionId));

    return {
      ok: true,
      message: "Pending Subscription wurde gelöscht.",
      deletedSubscription: {
        id: String(sub.id),
        plan: String(sub.plan),
        status: String(sub.status),
      },
    };
  } catch (err: unknown) {
    request.log.error(
      { err, subscriptionId },
      "Error deleting pending subscription",
    );
    reply.code(500);
    return {
      ok: false,
      error: "delete_failed",
      message: "Pending Subscription konnte nicht gelöscht werden.",
    };
  }
}

export async function registerAdminSubscriptionsRoutes(app: FastifyInstance) {
  app.delete<{ Params: PendingSubscriptionParams }>(
    "/admin/subscriptions/:subscriptionId",
    deletePendingSubscriptionHandler,
  );
}
