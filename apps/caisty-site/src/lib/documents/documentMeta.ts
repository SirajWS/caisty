import type { PortalCustomer } from "../portalApi";
import { fetchPortalBusiness } from "../portalApi";
import type { DocumentIdentity, DocumentMeta, DocumentPeriod } from "./types";

export async function resolveDocumentIdentity(
  customer: PortalCustomer,
): Promise<DocumentIdentity> {
  try {
    const profile = await fetchPortalBusiness();
    const businessName = profile.companyName?.trim() || customer.name;
    const storeName =
      profile.legalName?.trim() ||
      profile.companyName?.trim() ||
      customer.name;
    return { businessName, storeName };
  } catch {
    return {
      businessName: customer.name,
      storeName: customer.name,
    };
  }
}

export function buildDocumentMeta(input: {
  identity: DocumentIdentity;
  period: DocumentPeriod;
  generatedAt: Date;
  timezone: string;
  currency: string;
  locale: string;
}): DocumentMeta {
  return {
    ...input.identity,
    ...input.period,
    generatedAt: input.generatedAt,
    timezone: input.timezone,
    currency: input.currency,
    locale: input.locale,
  };
}
