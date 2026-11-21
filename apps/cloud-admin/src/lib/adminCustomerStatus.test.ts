import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  ADMIN_CUSTOMERS_LIST_DEFAULT_LIMIT,
  applyCustomerStatusUpdate,
  customerDetailPath,
  customerStatusPatchBody,
  isCustomerStatusActionBusy,
  isInactiveCustomerStatus,
  partitionCustomersByAccountStatus,
  RESTORE_CONFIRM_MESSAGE,
} from "./adminCustomerStatus";

const adminSrc = join(dirname(fileURLToPath(import.meta.url)), "..");

function customer(id: string, status: string) {
  return { id, name: id, status };
}

describe("admin customer status", () => {
  it("builds PATCH bodies for deactivate and restore", () => {
    expect(customerStatusPatchBody("inactive")).toEqual({ status: "inactive" });
    expect(customerStatusPatchBody("active")).toEqual({ status: "active" });
  });

  it("splits active and inactive without duplicates", () => {
    const rows = [
      customer("a", "active"),
      customer("i", "inactive"),
      customer("u", "ACTIVE"),
    ];
    const { active, inactive } = partitionCustomersByAccountStatus(rows);
    expect(active.map((c) => c.id)).toEqual(["a", "u"]);
    expect(inactive.map((c) => c.id)).toEqual(["i"]);
    expect(active.length + inactive.length).toBe(rows.length);
  });

  it("moves a restored customer to the active list", () => {
    const before = [
      customer("a", "active"),
      customer("i", "inactive"),
    ];
    const after = applyCustomerStatusUpdate(before, {
      id: "i",
      name: "i",
      status: "active",
    });
    const { active, inactive } = partitionCustomersByAccountStatus(after);
    expect(active.map((c) => c.id).sort()).toEqual(["a", "i"]);
    expect(inactive).toHaveLength(0);
  });

  it("keeps previous rows when a failed request does not apply an update", () => {
    const before = [customer("i", "inactive")];
    const { inactive } = partitionCustomersByAccountStatus(before);
    expect(inactive).toHaveLength(1);
    expect(isInactiveCustomerStatus("inactive")).toBe(true);
  });

  it("blocks a second Restore while the same customer is busy", () => {
    expect(isCustomerStatusActionBusy("c1", "c1")).toBe(true);
    expect(isCustomerStatusActionBusy("c1", "c2")).toBe(false);
    expect(isCustomerStatusActionBusy(null, "c1")).toBe(false);
  });

  it("links inactive customers to the existing detail route", () => {
    expect(customerDetailPath("cust-1")).toBe("/customers/cust-1");
    expect(RESTORE_CONFIRM_MESSAGE).toMatch(/account status only/i);
    expect(ADMIN_CUSTOMERS_LIST_DEFAULT_LIMIT).toBe(50);
  });
});

describe("A1.2a Super-Admin customer delete UI", () => {
  it("removes Delete customer actions from list, subscriptions and detail", () => {
    const files = [
      "pages/Customers/CustomersListPage.tsx",
      "pages/SubscriptionsListPage.tsx",
      "pages/Customers/CustomerDetailPage.tsx",
    ];
    for (const rel of files) {
      const src = readFileSync(join(adminSrc, rel), "utf8");
      expect(src).not.toMatch(/Delete customer/i);
      expect(src).not.toMatch(/handleDeleteCustomer/);
      expect(src).not.toMatch(/apiDelete.*\/customers\//);
    }
  });
});
