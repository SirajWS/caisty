import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import {
  createPortalChannel,
  deletePortalChannel,
  exportPortalChannels,
  getPortalChannel,
  importPortalChannelsMerge,
  listPortalChannels,
  setPortalChannelEnabled,
  updatePortalChannel,
  type PortalChannelFailure,
} from "../lib/portalChannelService.js";
import { MAX_IMPORT_JSON_BYTES } from "../lib/portalChannelPosFormat.js";
import { verifyPortalToken } from "../lib/portalJwt.js";

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

function portalActor(payload: PortalJwtPayload) {
  return { customerId: payload.customerId, orgId: payload.orgId };
}

function mapFailure(reply: FastifyReply, result: PortalChannelFailure) {
  const status =
    result.code === "CHANNEL_NOT_FOUND"
      ? 404
      : result.code === "CHANNEL_SLUG_CONFLICT"
        ? 409
        : result.code === "forbidden_field"
          ? 403
          : 422;

  reply.code(status);
  return {
    ok: false,
    code: result.code,
    message: result.message,
    ...(result.field ? { field: result.field } : {}),
    ...(result.index !== undefined ? { index: result.index } : {}),
  };
}

function rejectBodyOrgId(body: unknown): string | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  for (const key of Object.keys(body as Record<string, unknown>)) {
    const normalized = key.trim().toLowerCase().replace(/[\s_.-]+/g, "");
    if (
      normalized === "orgid" ||
      normalized === "organizationid" ||
      normalized === "tenantid"
    ) {
      return key;
    }
  }
  return null;
}

export async function registerPortalChannelsRoutes(app: FastifyInstance) {
  app.get("/portal/channels", async (request, reply) => {
    let payload: PortalJwtPayload;
    try {
      payload = getPortalAuth(request);
    } catch {
      reply.code(401);
      return { ok: false, message: "Invalid or missing portal token" };
    }

    try {
      const channels = await listPortalChannels(portalActor(payload));
      return { ok: true, channels };
    } catch (err) {
      request.log.error({ err }, "GET /portal/channels failed");
      reply.code(500);
      return { ok: false, message: "Failed to load channels." };
    }
  });

  app.get<{ Params: { id: string } }>(
    "/portal/channels/:id",
    async (request, reply) => {
      let payload: PortalJwtPayload;
      try {
        payload = getPortalAuth(request);
      } catch {
        reply.code(401);
        return { ok: false, message: "Invalid or missing portal token" };
      }

      try {
        const result = await getPortalChannel(
          portalActor(payload),
          request.params.id,
        );
        if (!result.ok) return mapFailure(reply, result);
        return { ok: true, channel: result.data };
      } catch (err) {
        request.log.error({ err }, "GET /portal/channels/:id failed");
        reply.code(500);
        return { ok: false, message: "Failed to load channel." };
      }
    },
  );

  app.post("/portal/channels", async (request, reply) => {
    let payload: PortalJwtPayload;
    try {
      payload = getPortalAuth(request);
    } catch {
      reply.code(401);
      return { ok: false, message: "Invalid or missing portal token" };
    }

    const forbidden = rejectBodyOrgId(request.body);
    if (forbidden) {
      reply.code(403);
      return {
        ok: false,
        code: "forbidden_field",
        message: `Field "${forbidden}" is not allowed.`,
      };
    }

    try {
      const result = await createPortalChannel(
        portalActor(payload),
        request.body as never,
      );
      if (!result.ok) return mapFailure(reply, result);
      reply.code(201);
      return { ok: true, channel: result.data };
    } catch (err) {
      request.log.error({ err }, "POST /portal/channels failed");
      reply.code(500);
      return { ok: false, message: "Failed to create channel." };
    }
  });

  app.patch<{ Params: { id: string } }>(
    "/portal/channels/:id",
    async (request, reply) => {
      let payload: PortalJwtPayload;
      try {
        payload = getPortalAuth(request);
      } catch {
        reply.code(401);
        return { ok: false, message: "Invalid or missing portal token" };
      }

      const forbidden = rejectBodyOrgId(request.body);
      if (forbidden) {
        reply.code(403);
        return {
          ok: false,
          code: "forbidden_field",
          message: `Field "${forbidden}" is not allowed.`,
        };
      }

      try {
        const body = request.body as Record<string, unknown> | undefined;
        if (body && typeof body.enabled === "boolean" && Object.keys(body).length === 1) {
          const result = await setPortalChannelEnabled(
            portalActor(payload),
            request.params.id,
            body.enabled,
          );
          if (!result.ok) return mapFailure(reply, result);
          return { ok: true, channel: result.data };
        }

        const result = await updatePortalChannel(
          portalActor(payload),
          request.params.id,
          request.body as never,
        );
        if (!result.ok) return mapFailure(reply, result);
        return { ok: true, channel: result.data };
      } catch (err) {
        request.log.error({ err }, "PATCH /portal/channels/:id failed");
        reply.code(500);
        return { ok: false, message: "Failed to update channel." };
      }
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/portal/channels/:id",
    async (request, reply) => {
      let payload: PortalJwtPayload;
      try {
        payload = getPortalAuth(request);
      } catch {
        reply.code(401);
        return { ok: false, message: "Invalid or missing portal token" };
      }

      try {
        const result = await deletePortalChannel(
          portalActor(payload),
          request.params.id,
        );
        if (!result.ok) return mapFailure(reply, result);
        return { ok: true, channel: result.data };
      } catch (err) {
        request.log.error({ err }, "DELETE /portal/channels/:id failed");
        reply.code(500);
        return { ok: false, message: "Failed to delete channel." };
      }
    },
  );

  app.post("/portal/channels/import", async (request, reply) => {
    let payload: PortalJwtPayload;
    try {
      payload = getPortalAuth(request);
    } catch {
      reply.code(401);
      return { ok: false, message: "Invalid or missing portal token" };
    }

    const body = request.body as { channels?: unknown; replace?: boolean; merge?: boolean } | undefined;
    const forbidden = rejectBodyOrgId(body);
    if (forbidden) {
      reply.code(403);
      return {
        ok: false,
        code: "forbidden_field",
        message: `Field "${forbidden}" is not allowed.`,
      };
    }

    const confirmed = body?.merge === true || body?.replace === true;
    if (!confirmed) {
      reply.code(422);
      return {
        ok: false,
        code: "merge_required",
        message: "Import requires merge=true confirmation.",
      };
    }

    const raw = body?.channels ?? body;
    const size = Buffer.byteLength(JSON.stringify(raw), "utf8");
    if (size > MAX_IMPORT_JSON_BYTES) {
      reply.code(422);
      return {
        ok: false,
        code: "file_too_large",
        message: "Import file exceeds the maximum allowed size.",
      };
    }

    try {
      const result = await importPortalChannelsMerge(
        portalActor(payload),
        raw,
      );
      if (!result.ok) return mapFailure(reply, result);
      return {
        ok: true,
        channels: result.data.channels,
        added: result.data.added,
        updated: result.data.updated,
        unchanged: result.data.unchanged,
        keptExisting: result.data.keptExisting,
        strippedSecretPaths: result.data.strippedSecretPaths,
        secretImportNotice: result.data.secretImportNotice,
      };
    } catch (err) {
      request.log.error({ err }, "POST /portal/channels/import failed");
      reply.code(500);
      return { ok: false, message: "Failed to import channels." };
    }
  });

  app.get("/portal/channels/export", async (request, reply) => {
    let payload: PortalJwtPayload;
    try {
      payload = getPortalAuth(request);
    } catch {
      reply.code(401);
      return { ok: false, message: "Invalid or missing portal token" };
    }

    try {
      const channels = await exportPortalChannels(portalActor(payload));
      reply.header("Content-Type", "application/json; charset=utf-8");
      reply.header(
        "Content-Disposition",
        'attachment; filename="channels.json"',
      );
      return channels;
    } catch (err) {
      request.log.error({ err }, "GET /portal/channels/export failed");
      reply.code(500);
      return { ok: false, message: "Failed to export channels." };
    }
  });
}
