// Admin fiscal configuration overview (placeholder for future dashboard).
import type { FastifyInstance } from "fastify";
import {
  getAdminBusinessSnapshotByCustomerId,
  getFiscalConfigurationByCustomerId,
  listFiscalConfigurationsForAdmin,
} from "../../fiscal/fiscalConfigurationService.js";
import { computeFiscalOverviewSummary } from "../../fiscal/fiscalOverviewSummary.js";

function mapFiscalOverviewItem(row: Awaited<
  ReturnType<typeof listFiscalConfigurationsForAdmin>
>[number]) {
  return {
    customerId: row.customerId,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    orgId: row.orgId,
    country: row.country,
    currency: row.currency,
    fiscalRequired: row.fiscalRequired,
    provider: row.provider,
    providerType: row.providerType,
    providerName: row.providerName,
    providerLabel: row.providerLabel,
    fiscalConfigurationLabel: row.fiscalConfigurationLabel,
    fiscalStatus: row.fiscalStatusCustomer,
    fiscalEnvironment: row.fiscalEnvironment,
    receiptMode: row.receiptMode,
    fiscalProfileKey: row.fiscalProfileKey,
    posConfigurationStatus: row.posConfigurationStatus,
    posDownloadAllowed: row.posDownloadAllowed,
    supportedExports: row.supportedExports,
    lastSyncAt: row.lastSyncAt ?? null,
    actions: {
      startSetup: row.provider === "fiskaly" && row.fiscalStatus !== "active",
      markActive: false,
      markPending: row.fiscalStatus === "active",
      viewLogs: false,
    },
  };
}

function mapFiscalBlock(
  snapshot: NonNullable<
    Awaited<ReturnType<typeof getFiscalConfigurationByCustomerId>>
  >,
) {
  return {
    orgId: snapshot.orgId,
    country: snapshot.country,
    currency: snapshot.currency,
    fiscalRequired: snapshot.fiscalRequired,
    provider: snapshot.provider,
    providerType: snapshot.providerType,
    providerName: snapshot.providerName,
    providerLabel: snapshot.providerLabel,
    fiscalStatus: snapshot.fiscalStatusCustomer,
    fiscalConfigurationLabel: snapshot.fiscalConfigurationLabel,
    fiscalEnvironment: snapshot.fiscalEnvironment,
    receiptMode: snapshot.receiptMode,
    fiscalProfileKey: snapshot.fiscalProfileKey,
    posConfigurationStatus: snapshot.posConfigurationStatus,
    posDownloadAllowed: snapshot.posDownloadAllowed,
    supportedExports: snapshot.supportedExports,
    fiscalNotice: snapshot.fiscalNotice,
    mode: snapshot.mode,
    lastSyncAt: snapshot.lastSyncAt ?? null,
    actions: {
      startSetup:
        snapshot.provider === "fiskaly" &&
        snapshot.fiscalStatus !== "active",
      markActive: false,
      markPending: snapshot.fiscalStatus === "active",
      viewLogs: false,
    },
  };
}

export async function registerAdminFiscalRoutes(app: FastifyInstance) {
  app.get("/admin/fiscal/overview", async (request) => {
    const limit = Number(
      (request.query as { limit?: string }).limit ?? 500,
    );
    const rows = await listFiscalConfigurationsForAdmin(limit);
    const items = rows.map(mapFiscalOverviewItem);

    return {
      ok: true,
      items,
      total: items.length,
      summary: computeFiscalOverviewSummary(rows),
    };
  });

  app.get<{ Params: { customerId: string } }>(
    "/admin/fiscal/customers/:customerId",
    async (request, reply) => {
      const combined = await getAdminBusinessSnapshotByCustomerId(
        request.params.customerId,
      );

      if (!combined) {
        reply.code(404);
        return { ok: false, error: "not_found" };
      }

      return {
        ok: true,
        business: combined.business,
        fiscal: mapFiscalBlock(combined.snapshot),
      };
    },
  );
}
