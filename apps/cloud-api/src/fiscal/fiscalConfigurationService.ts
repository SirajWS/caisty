import { eq } from "drizzle-orm";

import { db } from "../db/client.js";
import { businessProfiles } from "../db/schema/businessProfiles.js";
import { fiscalConfigurations } from "../db/schema/fiscalConfigurations.js";
import type { FiscalConfigurationSnapshot } from "./types.js";
import {
  buildFiscalConfiguration,
  enrichWithProviderStatus,
} from "./buildFiscalConfiguration.js";

export async function syncFiscalConfigurationForOrg(
  orgId: string,
  businessRow: typeof businessProfiles.$inferSelect,
): Promise<FiscalConfigurationSnapshot> {
  const snapshot = await enrichWithProviderStatus(
    buildFiscalConfiguration({ orgId, businessRow }),
  );

  const now = new Date();
  const values = {
    orgId,
    country: snapshot.country,
    currency: snapshot.currency,
    fiscalRequired: snapshot.fiscalRequired,
    provider: snapshot.provider,
    providerType: snapshot.providerType,
    providerName: snapshot.providerName,
    fiscalStatus: snapshot.fiscalStatus,
    fiscalEnvironment: snapshot.fiscalEnvironment,
    receiptMode: snapshot.receiptMode,
    fiscalProfileKey: snapshot.fiscalProfileKey,
    supportedExportsJson: snapshot.supportedExports,
    posDownloadAllowed: snapshot.posDownloadAllowed,
    posConfigurationStatus: snapshot.posConfigurationStatus,
    lastSyncAt: now,
    updatedAt: now,
  };

  const [existing] = await db
    .select({ id: fiscalConfigurations.id })
    .from(fiscalConfigurations)
    .where(eq(fiscalConfigurations.orgId, orgId))
    .limit(1);

  if (existing) {
    await db
      .update(fiscalConfigurations)
      .set(values)
      .where(eq(fiscalConfigurations.orgId, orgId));
  } else {
    await db.insert(fiscalConfigurations).values(values);
  }

  return {
    ...snapshot,
    lastSyncAt: now.toISOString(),
  };
}

export async function getFiscalConfigurationForOrg(
  orgId: string,
): Promise<FiscalConfigurationSnapshot | null> {
  const [businessRow] = await db
    .select()
    .from(businessProfiles)
    .where(eq(businessProfiles.orgId, orgId))
    .limit(1);

  if (!businessRow) return null;

  return syncFiscalConfigurationForOrg(orgId, businessRow);
}

export async function getFiscalConfigurationByCustomerId(
  customerId: string,
): Promise<FiscalConfigurationSnapshot | null> {
  const { customers } = await import("../db/schema/customers.js");
  const [customer] = await db
    .select({ orgId: customers.orgId })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);

  if (!customer?.orgId) return null;
  return getFiscalConfigurationForOrg(customer.orgId);
}

export type AdminFiscalOverviewRow = FiscalConfigurationSnapshot & {
  customerId?: string;
  customerName?: string | null;
  customerEmail?: string | null;
};

export async function listFiscalConfigurationsForAdmin(limit = 50): Promise<
  AdminFiscalOverviewRow[]
> {
  const { customers } = await import("../db/schema/customers.js");

  const rows = await db
    .select({
      business: businessProfiles,
      customer: customers,
    })
    .from(businessProfiles)
    .innerJoin(customers, eq(customers.orgId, businessProfiles.orgId))
    .limit(Math.min(limit, 500));

  const results: AdminFiscalOverviewRow[] = [];
  for (const row of rows) {
    if (!row.business.orgId) continue;
    const snapshot = await syncFiscalConfigurationForOrg(
      row.business.orgId,
      row.business,
    );
    results.push({
      ...snapshot,
      customerId: row.customer.id,
      customerName: row.customer.name,
      customerEmail: row.customer.email,
    });
  }
  return results;
}
