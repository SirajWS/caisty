export const REVOKE_LICENSE_CONFIRM_MESSAGE =
  "Revoking this license will prevent further authorized online POS access with this license. " +
  "Existing device assignments will remain until the devices are explicitly released. " +
  "License history, receipts and station codes will be preserved. " +
  "This action cannot currently be reversed in the Admin.";

export function canRevokeLicense(status: string | null | undefined): boolean {
  return (status ?? "").toLowerCase().trim() !== "revoked";
}

export function isLicenseRevokeBusy(
  busyId: string | null,
  licenseId: string,
): boolean {
  return busyId === licenseId;
}

export function applyLicenseRevokeUpdate<
  T extends { id: string; status?: string | null },
>(items: T[], licenseId: string): T[] {
  return items.map((item) =>
    item.id === licenseId ? { ...item, status: "revoked" } : item,
  );
}
