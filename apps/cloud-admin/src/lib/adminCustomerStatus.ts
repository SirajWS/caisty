export type CustomerAccountStatus = "active" | "inactive";

/** Matches GET /customers default when the Admin list does not pass limit. */
export const ADMIN_CUSTOMERS_LIST_DEFAULT_LIMIT = 50;

export const SET_INACTIVE_CONFIRM_MESSAGE =
  "Set this customer to inactive?\n\n" +
  "They will move to the inactive list in Super-Admin. " +
  "Licenses, subscriptions, devices and Portal/POS access are not changed.";

export const RESTORE_CONFIRM_MESSAGE =
  "Restore this customer to the active Super-Admin list?\n\n" +
  "This updates account status only. Licenses, subscriptions, devices and organizations stay as they are.";

export function customerStatusPatchBody(status: CustomerAccountStatus): {
  status: CustomerAccountStatus;
} {
  return { status };
}

export function isInactiveCustomerStatus(
  status: string | null | undefined,
): boolean {
  return (status ?? "").toLowerCase().trim() === "inactive";
}

export function customerDetailPath(customerId: string): string {
  return `/customers/${encodeURIComponent(customerId)}`;
}

export function isCustomerStatusActionBusy(
  busyId: string | null,
  customerId: string,
): boolean {
  return busyId === customerId;
}

export function partitionCustomersByAccountStatus<
  T extends { status?: string | null },
>(items: T[]): { active: T[]; inactive: T[] } {
  const active: T[] = [];
  const inactive: T[] = [];
  for (const item of items) {
    if (isInactiveCustomerStatus(item.status)) inactive.push(item);
    else active.push(item);
  }
  return { active, inactive };
}

export function applyCustomerStatusUpdate<
  T extends { id: string; status?: string | null },
>(items: T[], updated: T): T[] {
  return items.map((item) =>
    item.id === updated.id ? { ...item, ...updated } : item,
  );
}
