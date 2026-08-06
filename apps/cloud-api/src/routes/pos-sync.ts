import type { FastifyInstance } from "fastify";

import { authenticatePosDevice, formatPosDeviceAuthFailure } from "../lib/posDeviceAuth.js";
import { InvalidPullCursorError, PullCursorOrgMismatchError } from "../posSync/pullErrors.js";
import { posPullService } from "../posSync/PosPullService.js";
import { posSyncService } from "../posSync/PosSyncService.js";
import { validatePullRequest } from "../posSync/validatePullRequest.js";
import { validateSyncBatchRequest } from "../posSync/validateSyncBatch.js";

export async function registerPosSyncRoutes(app: FastifyInstance) {
  /**
   * POST /pos/sync/batch
   * Central POS sales sync endpoint (orders, receipts, payments in one batch).
   * Auth: deviceId + licenseKey in body (same model as GET /pos/config).
   */
  app.post("/pos/sync/batch", async (request, reply) => {
    const validated = validateSyncBatchRequest(request.body);
    if (!validated.ok) {
      reply.code(400);
      return {
        ok: false,
        error: validated.error.code,
        message: validated.error.message,
      };
    }

    const { request: body } = validated;

    const auth = await authenticatePosDevice({
      deviceId: body.deviceId,
      licenseKey: body.licenseKey,
    });

    if (!auth.ok) {
      reply.code(auth.statusCode);
      return formatPosDeviceAuthFailure(auth);
    }

    const idempotencyKey = request.headers["idempotency-key"];
    const key =
      typeof idempotencyKey === "string" && idempotencyKey.trim()
        ? idempotencyKey.trim()
        : undefined;

    try {
      const result = await posSyncService.processBatch(
        body,
        auth.context,
        key,
      );
      reply.code(201);
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (message.includes("Idempotency key conflict")) {
        reply.code(409);
        return {
          ok: false,
          error: "idempotency_conflict",
          message,
        };
      }

      request.log.error({ err }, "POST /pos/sync/batch failed");
      reply.code(500);
      return { ok: false, error: "server_error" };
    }
  });

  /**
   * POST /pos/sync/pull
   * Pull business-scoped sync snapshots with per-entity cursors.
   * Auth: deviceId + licenseKey in body.
   */
  app.post("/pos/sync/pull", async (request, reply) => {
    const validated = validatePullRequest(request.body);
    if (!validated.ok) {
      reply.code(400);
      return {
        ok: false,
        error: validated.error.code,
        message: validated.error.message,
      };
    }

    const { request: body } = validated;

    const auth = await authenticatePosDevice({
      deviceId: body.deviceId,
      licenseKey: body.licenseKey,
    });

    if (!auth.ok) {
      reply.code(auth.statusCode);
      return formatPosDeviceAuthFailure(auth);
    }

    try {
      const result = await posPullService.pullChanges(body, auth.context);
      reply.code(200);
      return result;
    } catch (err: unknown) {
      if (err instanceof InvalidPullCursorError) {
        reply.code(400);
        return {
          ok: false,
          error: err.code,
          message: err.message,
        };
      }
      if (err instanceof PullCursorOrgMismatchError) {
        reply.code(400);
        return {
          ok: false,
          error: err.code,
          message: err.message,
        };
      }
      request.log.error({ err }, "POST /pos/sync/pull failed");
      reply.code(500);
      return { ok: false, error: "server_error" };
    }
  });
}
