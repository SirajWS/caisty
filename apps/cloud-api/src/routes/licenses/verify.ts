// apps/api/src/routes/licenses/verify.ts
import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  verifyLicenseForPos,
  type VerifyLicenseInput,
} from "../../services/licensingService";

type VerifyBody = {
  licenseKey: string;
  deviceId?: string;
  deviceName?: string;
  deviceType?: string;
};

export async function registerLicenseVerifyRoute(app: FastifyInstance) {
  app.post(
    "/licenses/verify",
    {
      schema: {
        body: {
          type: "object",
          required: ["licenseKey"],
          properties: {
            licenseKey: { type: "string" },
            deviceId: { type: "string", nullable: true },
            deviceName: { type: "string", nullable: true },
            deviceType: { type: "string", nullable: true },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: VerifyBody }>, reply) => {
      const { licenseKey, deviceId, deviceName, deviceType } =
        request.body;

      const result = await verifyLicenseForPos({
        licenseKey,
        deviceId,
        deviceName,
        deviceType,
      } as VerifyLicenseInput);

      if (!result.ok) {
        const { errorCode, message } = result;

        const reason = mapErrorCodeToReason(errorCode);

        // Business-Fehler weiterhin als HTTP 200 mit ok:false
        return reply.send({
          ok: false,
          code: errorCode,
          reason,
          message,
          offlineGraceDays: result.offlineGraceDays,
          license: result.license
            ? {
                id: result.license.id,
                key: result.license.key,
                plan: result.license.plan,
                status: result.license.status,
                period: {
                  start: result.license.validFrom,
                  end: result.license.validUntil,
                },
                maxDevices: result.license.maxDevices,
              }
            : undefined,
          devices: result.devices,
        });
      }

      // Erfolgsfall – Response-Shape festgezogen
      const lic = result.license!;
      return reply.send({
        ok: true,
        offlineGraceDays: result.offlineGraceDays,
        lastVerified: result.checkedAt.toISOString(),
        deviceId: result.device?.id ?? null,
        license: {
          id: lic.id,
          key: lic.key,
          plan: lic.plan,
          status: lic.status,
          period: {
            start: lic.validFrom,
            end: lic.validUntil,
          },
          maxDevices: lic.maxDevices,
          createdAt: lic.createdAt,
        },
        devices: result.devices,
        device: result.device
          ? {
              id: result.device.id,
              name: result.device.name,
              type: result.device.type,
              status: result.device.status,
              lastHeartbeatAt: result.device.lastHeartbeatAt,
              lastSeenAt: result.device.lastSeenAt,
            }
          : null,
      });
    },
  );
}

function mapErrorCodeToReason(
  code: import("../../services/licensingService").LicenseErrorCode | undefined,
):
  | "license_not_found"
  | "license_revoked"
  | "invalid_or_expired"
  | "license_inactive"
  | "device_mismatch"
  | "unknown_error" {
  switch (code) {
    case "NOT_FOUND":
      return "license_not_found";
    case "BLOCKED":
      return "license_revoked";
    case "EXPIRED":
      return "invalid_or_expired";
    case "INACTIVE":
      return "license_inactive";
    case "DEVICE_MISMATCH":
      return "device_mismatch";
    default:
      return "unknown_error";
  }
}
