// apps/cloud-api/src/routes/portal-business.ts
import type { FastifyInstance, FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";

import { db } from "../db/client.js";
import { businessProfiles } from "../db/schema/businessProfiles.js";
import { customers } from "../db/schema/customers.js";
import { orgs } from "../db/schema/orgs.js";
import { verifyPortalToken } from "../lib/portalJwt.js";
import {
  applyCountryFiscalRules,
  computeComplianceStatus,
  computePosConfigurationStatus,
  defaultCurrencyForCountry,
  isCurrencyAllowedForCountry,
  normalizeCountryCode,
  resolveFiscalFields,
  sanitizeBusinessAddress,
  SUPPORTED_LANGUAGES,
  type BusinessAddress,
  type BusinessCountryCode,
  type DefaultLanguage,
} from "../lib/businessProfileRules.js";
import {
  syncFiscalConfigurationForOrg,
} from "../fiscal/fiscalConfigurationService.js";
import { buildPosSyncConfig, nextConfigVersion } from "../fiscal/buildPosSyncConfig.js";

interface PortalJwtPayload {
  customerId: string;
  orgId: string;
}

function getPortalAuth(request: FastifyRequest): PortalJwtPayload {
  const auth = request.headers.authorization;
  if (!auth?.startsWith("Bearer ")) throw new Error("Missing portal token");
  const token = auth.slice("Bearer ".length);
  return verifyPortalToken(token) as PortalJwtPayload;
}

type CloudCustomerProfile = {
  accountName?: string;
  legalName?: string;
  address?: BusinessAddress;
  language?: string;
};

function profileFromCustomerJson(
  profile: unknown,
): Partial<{
  companyName: string;
  legalName: string;
  country: BusinessCountryCode;
  defaultLanguage: DefaultLanguage;
  businessAddress: BusinessAddress;
}> {
  if (!profile || typeof profile !== "object") return {};
  const p = profile as CloudCustomerProfile;
  const country = normalizeCountryCode(p.address?.country ?? null);
  const lang = p.language?.trim().toLowerCase();
  const defaultLanguage =
    lang && (SUPPORTED_LANGUAGES as string[]).includes(lang)
      ? (lang as DefaultLanguage)
      : undefined;

  return {
    companyName: p.accountName?.trim() || undefined,
    legalName: p.legalName?.trim() || undefined,
    country: country ?? undefined,
    defaultLanguage,
    businessAddress: p.address
      ? sanitizeBusinessAddress(p.address, country)
      : undefined,
  };
}

function isMissingBusinessProfilesTable(err: unknown): boolean {
  const msg =
    err instanceof Error
      ? err.message
      : typeof err === "object" && err && "message" in err
        ? String((err as { message: unknown }).message)
        : String(err);
  return /business_profiles|relation .* does not exist|42P01/i.test(msg);
}

function buildPortalBusinessResponse(
  row: typeof businessProfiles.$inferSelect,
  orgName: string,
  fiscalSnapshot: Awaited<ReturnType<typeof syncFiscalConfigurationForOrg>>,
) {
  const country = normalizeCountryCode(row.country);
  const businessAddress = sanitizeBusinessAddress(
    row.businessAddressJson,
    row.country,
  );

  return {
    ok: true as const,
    business: {
      companyName: row.companyName ?? orgName,
      legalName: row.legalName ?? "",
      country: row.country ?? null,
      currency: fiscalSnapshot.currency,
      defaultLanguage: row.defaultLanguage ?? "en",
      businessAddress,
      vatId: row.vatId ?? "",
      taxId: row.taxId ?? "",
      fiscalRequired: fiscalSnapshot.fiscalRequired,
      fiscalStatus: fiscalSnapshot.fiscalStatusCustomer,
      fiscalProvider: fiscalSnapshot.provider,
      fiscalProviderDisplayKey: fiscalSnapshot.provider,
      providerType: fiscalSnapshot.providerType,
      providerLabel: fiscalSnapshot.providerLabel,
      fiscalEnvironment: fiscalSnapshot.fiscalEnvironment,
      complianceStatus: computeComplianceStatus({
        country,
        companyName: row.companyName,
        legalName: row.legalName,
        businessAddress,
        fiscalStatus: fiscalSnapshot.fiscalStatus,
      }),
      posConfigurationStatus: fiscalSnapshot.posConfigurationStatus,
      fiscalProfileKey: fiscalSnapshot.fiscalProfileKey,
      fiscalConfigurationLabel: fiscalSnapshot.fiscalConfigurationLabel,
      /** @deprecated use fiscalProfileKey / fiscalConfigurationLabel */
      fiscalPackage: fiscalSnapshot.fiscalProfileKey,
      receiptMode: fiscalSnapshot.receiptMode,
      supportedExports: fiscalSnapshot.supportedExports,
      posDownloadAllowed: fiscalSnapshot.posDownloadAllowed,
      fiscalNotice: fiscalSnapshot.fiscalNotice,
      mode: fiscalSnapshot.mode,
      posReadiness: fiscalSnapshot.posConfigurationStatus,
    },
  };
}

async function syncDerivedFieldsIfNeeded(
  row: typeof businessProfiles.$inferSelect,
): Promise<typeof businessProfiles.$inferSelect> {
  const country = normalizeCountryCode(row.country);
  const fiscal = resolveFiscalFields(
    country,
    row.fiscalStatus,
    row.fiscalProvider,
  );
  const businessAddress = sanitizeBusinessAddress(
    row.businessAddressJson,
    row.country,
  );
  const complianceStatus = computeComplianceStatus({
    country,
    companyName: row.companyName,
    legalName: row.legalName,
    businessAddress,
    fiscalStatus: fiscal.fiscalStatus,
  });
  const posConfigurationStatus = computePosConfigurationStatus({
    country,
    fiscalStatus: fiscal.fiscalStatus,
    complianceStatus,
  });

  const storedCurrency = row.currency ?? defaultCurrencyForCountry(country);
  const needsCurrencyFix =
    Boolean(country) &&
    !isCurrencyAllowedForCountry(country, storedCurrency);

  const stale =
    row.fiscalStatus !== fiscal.fiscalStatus ||
    row.fiscalProvider !== fiscal.fiscalProvider ||
    row.complianceStatus !== complianceStatus ||
    row.posConfigurationStatus !== posConfigurationStatus ||
    needsCurrencyFix;

  if (!stale) return row;

  const [updated] = await db
    .update(businessProfiles)
    .set({
      fiscalStatus: fiscal.fiscalStatus,
      fiscalProvider: fiscal.fiscalProvider,
      fiscalEnvironment: fiscal.fiscalEnvironment,
      complianceStatus,
      posConfigurationStatus,
      currency: needsCurrencyFix
        ? defaultCurrencyForCountry(country)
        : row.currency,
      updatedAt: new Date(),
    })
    .where(eq(businessProfiles.id, row.id))
    .returning();

  return updated ?? row;
}

async function getOrCreateBusinessProfile(
  orgId: string,
  customerId: string,
): Promise<{
  row: typeof businessProfiles.$inferSelect;
  orgName: string;
}> {
  const [org] = await db
    .select({ name: orgs.name })
    .from(orgs)
    .where(eq(orgs.id, orgId))
    .limit(1);

  const orgName = org?.name ?? "My business";

  const [existing] = await db
    .select()
    .from(businessProfiles)
    .where(eq(businessProfiles.orgId, orgId))
    .limit(1);

  if (existing) {
    const synced = await syncDerivedFieldsIfNeeded(existing);
    return { row: synced, orgName };
  }

  const [customer] = await db
    .select({ profile: customers.profile })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);

  const fromPos = profileFromCustomerJson(customer?.profile);
  const country = fromPos.country ?? null;
  const fiscalRules = applyCountryFiscalRules(country);
  const currency = defaultCurrencyForCountry(country);
  const businessAddress =
    fromPos.businessAddress ?? (country ? { country } : {});

  const complianceStatus = computeComplianceStatus({
    country,
    companyName: fromPos.companyName ?? orgName,
    legalName: fromPos.legalName ?? null,
    businessAddress,
    fiscalStatus: fiscalRules.fiscalStatus,
  });

  const posConfigurationStatus = computePosConfigurationStatus({
    country,
    fiscalStatus: fiscalRules.fiscalStatus,
    complianceStatus,
  });

  const [created] = await db
    .insert(businessProfiles)
    .values({
      orgId,
      companyName: fromPos.companyName ?? orgName,
      legalName: fromPos.legalName ?? null,
      country: country ?? null,
      currency,
      defaultLanguage: fromPos.defaultLanguage ?? "en",
      businessAddressJson: businessAddress,
      fiscalStatus: fiscalRules.fiscalStatus,
      fiscalProvider: fiscalRules.fiscalProvider,
      fiscalEnvironment: fiscalRules.fiscalEnvironment,
      complianceStatus,
      posConfigurationStatus,
    })
    .returning();

  return { row: created, orgName };
}

type PatchBody = {
  companyName?: string;
  legalName?: string;
  country?: string | null;
  currency?: string;
  defaultLanguage?: string;
  businessAddress?: BusinessAddress;
  vatId?: string;
  taxId?: string;
};

export async function registerPortalBusinessRoutes(app: FastifyInstance) {
  app.get("/portal/business", async (request, reply) => {
    let payload: PortalJwtPayload;
    try {
      payload = getPortalAuth(request);
    } catch {
      reply.code(401);
      return { ok: false, error: "unauthorized" };
    }

    try {
      const { row, orgName } = await getOrCreateBusinessProfile(
        payload.orgId,
        payload.customerId,
      );
      const fiscalSnapshot = await syncFiscalConfigurationForOrg(
        payload.orgId,
        row,
      );
      return buildPortalBusinessResponse(row, orgName, fiscalSnapshot);
    } catch (err: unknown) {
      request.log.error({ err }, "GET /portal/business failed");
      if (isMissingBusinessProfilesTable(err)) {
        reply.code(503);
        return {
          ok: false,
          error: "migration_required",
          message:
            "Business profile storage is not ready. Apply migration 017_business_profiles.sql.",
        };
      }
      reply.code(500);
      return { ok: false, error: "server_error" };
    }
  });

  app.patch("/portal/business", async (request, reply) => {
    let payload: PortalJwtPayload;
    try {
      payload = getPortalAuth(request);
    } catch {
      reply.code(401);
      return { ok: false, error: "unauthorized" };
    }

    const body = (request.body ?? {}) as PatchBody;

    try {
      const { row: existing, orgName } = await getOrCreateBusinessProfile(
        payload.orgId,
        payload.customerId,
      );

      const updates: Partial<typeof businessProfiles.$inferInsert> = {
        updatedAt: new Date(),
        configVersion: nextConfigVersion(existing.configVersion),
      };

      if (typeof body.companyName === "string") {
        const name = body.companyName.trim().slice(0, 255);
        if (!name) {
          reply.code(400);
          return { ok: false, error: "invalid_company_name" };
        }
        updates.companyName = name;
        await db
          .update(orgs)
          .set({ name, updatedAt: new Date() })
          .where(eq(orgs.id, payload.orgId));
      }

      if (typeof body.legalName === "string") {
        updates.legalName = body.legalName.trim().slice(0, 255) || null;
      }

      let countryChanged = false;
      let newCountry = normalizeCountryCode(existing.country);

      if (body.country !== undefined) {
        if (body.country === null || body.country === "") {
          updates.country = null;
          newCountry = null;
          countryChanged = existing.country !== null;
        } else {
          const normalized = normalizeCountryCode(body.country);
          if (!normalized) {
            reply.code(400);
            return { ok: false, error: "invalid_country" };
          }
          updates.country = normalized;
          countryChanged =
            normalized !== normalizeCountryCode(existing.country);
          newCountry = normalized;
        }
      }

      if (countryChanged) {
        if (!body.currency) {
          updates.currency = defaultCurrencyForCountry(newCountry);
        }
      }

      const mergedCountry =
        body.country !== undefined
          ? newCountry
          : normalizeCountryCode(existing.country);

      const fiscal = resolveFiscalFields(
        mergedCountry,
        countryChanged ? null : existing.fiscalStatus,
        countryChanged ? null : existing.fiscalProvider,
      );
      updates.fiscalStatus = fiscal.fiscalStatus;
      updates.fiscalProvider = fiscal.fiscalProvider;
      updates.fiscalEnvironment = fiscal.fiscalEnvironment;

      if (typeof body.currency === "string") {
        const cur = body.currency.trim().toUpperCase().slice(0, 3);
        const countryForCurrency =
          newCountry ?? normalizeCountryCode(existing.country);
        if (!isCurrencyAllowedForCountry(countryForCurrency, cur)) {
          reply.code(400);
          return { ok: false, error: "invalid_currency" };
        }
        updates.currency = cur;
      }

      if (typeof body.defaultLanguage === "string") {
        const lang = body.defaultLanguage.trim().toLowerCase();
        if (!(SUPPORTED_LANGUAGES as string[]).includes(lang)) {
          reply.code(400);
          return { ok: false, error: "invalid_language" };
        }
        updates.defaultLanguage = lang;
      }

      if (body.businessAddress !== undefined) {
        const countryCode =
          newCountry ?? normalizeCountryCode(existing.country) ?? null;
        updates.businessAddressJson = sanitizeBusinessAddress(
          body.businessAddress,
          countryCode,
        );
      }

      if (typeof body.vatId === "string") {
        updates.vatId = body.vatId.trim().slice(0, 64) || null;
      }

      if (typeof body.taxId === "string") {
        updates.taxId = body.taxId.trim().slice(0, 64) || null;
      }

      const mergedCompanyName =
        updates.companyName ?? existing.companyName ?? orgName;
      const mergedLegalName =
        updates.legalName !== undefined
          ? updates.legalName
          : existing.legalName;
      const mergedAddress = sanitizeBusinessAddress(
        updates.businessAddressJson ?? existing.businessAddressJson,
        mergedCountry,
      );
      const fiscalStatus = fiscal.fiscalStatus;

      const complianceStatus = computeComplianceStatus({
        country: mergedCountry,
        companyName: mergedCompanyName,
        legalName: mergedLegalName,
        businessAddress: mergedAddress,
        fiscalStatus,
      });

      updates.complianceStatus = complianceStatus;
      updates.posConfigurationStatus = computePosConfigurationStatus({
        country: mergedCountry,
        fiscalStatus,
        complianceStatus,
      });

      const [updated] = await db
        .update(businessProfiles)
        .set(updates)
        .where(eq(businessProfiles.orgId, payload.orgId))
        .returning();

      if (!updated) {
        reply.code(404);
        return { ok: false, error: "not_found" };
      }

      const fiscalSnapshot = await syncFiscalConfigurationForOrg(
        payload.orgId,
        updated,
      );
      return buildPortalBusinessResponse(updated, orgName, fiscalSnapshot);
    } catch (err: unknown) {
      request.log.error({ err }, "PATCH /portal/business failed");
      if (isMissingBusinessProfilesTable(err)) {
        reply.code(503);
        return {
          ok: false,
          error: "migration_required",
          message:
            "Business profile storage is not ready. Apply migration 017_business_profiles.sql.",
        };
      }
      reply.code(500);
      return { ok: false, error: "server_error" };
    }
  });

  app.get("/portal/business/pos-config", async (request, reply) => {
    let payload: PortalJwtPayload;
    try {
      payload = getPortalAuth(request);
    } catch {
      reply.code(401);
      return { ok: false, error: "unauthorized" };
    }

    try {
      const { row } = await getOrCreateBusinessProfile(
        payload.orgId,
        payload.customerId,
      );
      const fiscalSnapshot = await syncFiscalConfigurationForOrg(
        payload.orgId,
        row,
      );
      const [org] = await db
        .select({ name: orgs.name })
        .from(orgs)
        .where(eq(orgs.id, payload.orgId))
        .limit(1);
      const preview = buildPosSyncConfig({
        businessRow: row,
        fiscalSnapshot,
        license: {
          id: "",
          key: "",
          plan: "",
          status: "",
          maxDevices: 0,
          validUntil: null,
          orgId: payload.orgId,
          customerId: null,
          subscriptionId: null,
          validFrom: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        device: {
          id: "00000000-0000-0000-0000-000000000000",
          orgId: payload.orgId,
          customerId: null,
          name: "",
          type: "pos",
          status: "",
          lastSeenAt: null,
          createdAt: new Date(),
          licenseId: null,
          fingerprint: null,
          lastHeartbeatAt: null,
        },
        orgName: org?.name ?? null,
      });
      return {
        ok: true,
        business: preview.business,
        fiscal: preview.fiscal,
        sync: preview.sync,
      };
    } catch (err: unknown) {
      request.log.error({ err }, "GET /portal/business/pos-config failed");
      if (isMissingBusinessProfilesTable(err)) {
        reply.code(503);
        return { ok: false, error: "migration_required" };
      }
      reply.code(500);
      return { ok: false, error: "server_error" };
    }
  });
}
