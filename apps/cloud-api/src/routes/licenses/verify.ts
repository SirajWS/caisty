// apps/api/src/routes/licenses/verify.ts
import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  verifyLicenseForPos,
  type VerifyLicenseInput,
} from "../../services/licensingService";
import { OFFLINE_GRACE_DAYS } from "../../config/license";
import {
  LICENSE_PLANS,
  type LicensePlanId,
} from "../../config/licensePlans";

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
      const { licenseKey, deviceId, deviceName, deviceType } = request.body;

      const result = await verifyLicenseForPos({
        licenseKey,
        deviceId,
        deviceName,
        deviceType,
      } as VerifyLicenseInput);

      const effectiveOfflineGraceDays =
        typeof result.offlineGraceDays === "number"
          ? result.offlineGraceDays
          : OFFLINE_GRACE_DAYS;

      if (!result.ok) {
        const { errorCode, message } = result;
        const reason = mapErrorCodeToReason(errorCode);

        let licensePayload:
          | {
              id: string;
              key: string;
              plan: string;
              planLabel: string;
              status: string;
              period: { start: string | null; end: string | null };
              maxDevices: number | null;
              createdAt?: string | Date;
            }
          | undefined;

        if (result.license) {
          const lic = result.license;
          const planConfig =
            LICENSE_PLANS[lic.plan as LicensePlanId] ?? null;

          licensePayload = {
            id: lic.id,
            key: lic.key,
            plan: lic.plan,
            planLabel: planConfig?.label ?? String(lic.plan),
            status: lic.status,
            period: {
              start: lic.validFrom,
              end: lic.validUntil,
            },
            maxDevices:
              planConfig?.maxDevices ??
              (typeof lic.maxDevices === "number" ? lic.maxDevices : null),
            createdAt: lic.createdAt,
          };
        }

        return reply.send({
          ok: false,
          code: errorCode,
          reason,
          message,
          offlineGraceDays: effectiveOfflineGraceDays,
          license: licensePayload,
          devices: result.devices,
        });
      }

      const lic = result.license!;
      const planConfig = LICENSE_PLANS[lic.plan as LicensePlanId] ?? null;

      return reply.send({
        ok: true,
        offlineGraceDays: effectiveOfflineGraceDays,
        lastVerified: result.checkedAt.toISOString(),
        deviceId: result.device?.id ?? null,
        license: {
          id: lic.id,
          key: lic.key,
          plan: lic.plan,
          planLabel: planConfig?.label ?? String(lic.plan),
          status: lic.status,
          period: {
            start: lic.validFrom,
            end: lic.validUntil,
          },
          maxDevices:
            planConfig?.maxDevices ??
            (typeof lic.maxDevices === "number" ? lic.maxDevices : null),
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
