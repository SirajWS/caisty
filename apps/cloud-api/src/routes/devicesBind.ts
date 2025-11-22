// apps/api/src/routes/devicesBind.ts
import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { devices } from "../db/schema/devices";
import { licenses } from "../db/schema/licenses";
import { customers } from "../db/schema/customers";

// Strukturen wie aus der POS-Seite "Cloud Customer / Account"
type CloudCustomerContact = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
};

type CloudCustomerAddress = {
  country?: string;
  city?: string;
  street?: string;
  zip?: string;
};

export type CloudCustomerPayload = {
  accountName?: string;
  legalName?: string;
  externalId?: string;
  contact?: CloudCustomerContact;
  address?: CloudCustomerAddress;
  language?: string;
  notes?: string;
};

type BindDeviceBody = {
  licenseKey: string;
  deviceName: string;
  deviceType?: string;
  fingerprint?: string;
  cloudCustomer?: CloudCustomerPayload;
};

type BindDeviceResponse = {
  ok: boolean;
  error?:
    | "MISSING_FIELDS"
    | "LICENSE_NOT_FOUND"
    | "LICENSE_INACTIVE"
    | "MAX_DEVICES_REACHED";
  device?: {
    id: string;
    name: string;
    type: string;
    status: string;
    licenseId: string | null;
    customerId: string | null;
    lastHeartbeatAt: string | null;
    createdAt: string;
  };
  license?: {
    id: string;
    key: string;
    plan: string;
    status: string;
    maxDevices: number | null;
    validUntil: string | null;
    customerId: string | null;
  };
  customer?: {
    id: string;
    name: string;
    email: string;
    status: string;
    createdAt: string;
    profile: unknown;
  } | null;
};

function hasCloudCustomerPayload(payload?: CloudCustomerPayload | null): boolean {
  if (!payload) return false;
  return Boolean(
    payload.accountName ||
      payload.legalName ||
      payload.externalId ||
      payload.language ||
      payload.notes ||
      payload.contact?.firstName ||
      payload.contact?.lastName ||
      payload.contact?.email ||
      payload.contact?.phone ||
      payload.address?.country ||
      payload.address?.city ||
      payload.address?.street ||
      payload.address?.zip,
  );
}

const devicesBindRoutes = async (app: FastifyInstance) => {
  app.post<{ Body: BindDeviceBody; Reply: BindDeviceResponse }>(
    "/devices/bind",
    async (request, reply) => {
      const { licenseKey, deviceName, deviceType = "pos", fingerprint, cloudCustomer } =
        request.body;

      if (!licenseKey || !deviceName) {
        return reply.status(400).send({
          ok: false,
          error: "MISSING_FIELDS",
        });
      }

      // 1) Lizenz suchen
      const license = await db.query.licenses.findFirst({
        where: eq(licenses.key, licenseKey),
      });

      if (!license) {
        return reply.status(404).send({
          ok: false,
          error: "LICENSE_NOT_FOUND",
        });
      }

      if (license.status !== "active") {
        return reply.status(409).send({
          ok: false,
          error: "LICENSE_INACTIVE",
        });
      }

      const now = new Date();

      // 2) Devices für diese Lizenz laden
      type DeviceRow = typeof devices.$inferSelect;

      const devicesForLicense: DeviceRow[] = await db.query.devices.findMany({
        where: eq(devices.licenseId, license.id),
      });

      let device: DeviceRow | undefined;

      // Wenn Fingerprint vorhanden -> Gerät wiederverwenden
      if (fingerprint) {
        device = devicesForLicense.find(
          (d) => (d as any).fingerprint && (d as any).fingerprint === fingerprint,
        );
      }

      const usedSeats = devicesForLicense.length;
      const maxDevices = license.maxDevices ?? 1;

      if (!device && usedSeats >= maxDevices) {
        return reply.status(409).send({
          ok: false,
          error: "MAX_DEVICES_REACHED",
        });
      }

      // 3) Gerät anlegen oder aktualisieren
      if (!device) {
        const inserted = await db
          .insert(devices)
          .values({
            // casts wegen evtl. zusätzlichen Spalten in deinem Schema
            orgId: (license as any).orgId ?? null,
            customerId: license.customerId ?? null,
            licenseId: license.id,
            name: deviceName,
            type: deviceType,
            status: "active",
            fingerprint: fingerprint ?? null,
            lastHeartbeatAt: now,
          } as any)
          .returning();

        device = inserted[0];
      } else {
        const updated = await db
          .update(devices)
          .set(
            {
              name: deviceName,
              type: deviceType,
              status: "active",
              lastHeartbeatAt: now,
            } as any,
          )
          .where(eq(devices.id, device.id))
          .returning();

        device = updated[0] ?? device;
      }

      // 4) Customer-Profil ggf. mit Daten vom POS aktualisieren
      type CustomerRow = typeof customers.$inferSelect;
      let updatedCustomer: CustomerRow | null = null;

      if (license.customerId && hasCloudCustomerPayload(cloudCustomer)) {
        const existingCustomer = await db.query.customers.findFirst({
          where: eq(customers.id, license.customerId),
        });

        if (existingCustomer) {
          const nowIso = now.toISOString();

          const mergedProfile = {
            ...(existingCustomer.profile as any),
            ...cloudCustomer,
            lastSyncAt: nowIso,
          };

          const nameToSet =
            cloudCustomer?.accountName?.trim() || existingCustomer.name;
          const emailToSet =
            cloudCustomer?.contact?.email?.trim() || existingCustomer.email;

          const updatedRows = await db
            .update(customers)
            .set(
              {
                name: nameToSet,
                email: emailToSet,
                profile: mergedProfile,
              } as any,
            )
            .where(eq(customers.id, existingCustomer.id))
            .returning();

          updatedCustomer = updatedRows[0] ?? existingCustomer;
        }
      }

      return reply.send({
        ok: true,
        device: {
          id: String(device.id),
          name: String(device.name),
          type: String(device.type),
          status: String(device.status),
          licenseId: (device as any).licenseId ?? null,
          customerId: (device as any).customerId ?? null,
          lastHeartbeatAt: device.lastHeartbeatAt
            ? new Date(device.lastHeartbeatAt).toISOString()
            : null,
          createdAt: new Date(device.createdAt as any).toISOString(),
        },
        license: {
          id: String(license.id),
          key: String(license.key),
          plan: String(license.plan),
          status: String(license.status),
          maxDevices: license.maxDevices ?? null,
          validUntil: license.validUntil
            ? new Date(license.validUntil as any).toISOString()
            : null,
          customerId: (license as any).customerId ?? null,
        },
        customer: updatedCustomer
          ? {
              id: String(updatedCustomer.id),
              name: updatedCustomer.name,
              email: updatedCustomer.email,
              status: updatedCustomer.status,
              createdAt: new Date(
                updatedCustomer.createdAt as any,
              ).toISOString(),
              profile: updatedCustomer.profile,
            }
          : null,
      });
    },
  );
};

export default devicesBindRoutes;
