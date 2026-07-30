import { describe, expect, it } from "vitest";

import { maxDevicesForPlan } from "../../config/licensePlans.js";
import {
  isSubscriptionBackedPaidLicense,
  maxLicenseValidUntil,
  resolveSubscriptionPaidLicenseAction,
} from "../licenseGrantGuard.js";

/**
 * Combined renewal (main) + Business/Unlimited (staging) contract tests.
 * Pure helpers only — no Stripe network, no DB.
 */
describe("paid plan device seats (new purchase contract)", () => {
  it("Starter → max_devices = 1", () => {
    expect(maxDevicesForPlan("starter")).toBe(1);
  });

  it("Pro → max_devices = 3", () => {
    expect(maxDevicesForPlan("pro")).toBe(3);
  });

  it("Business → max_devices = null (unlimited)", () => {
    expect(maxDevicesForPlan("business")).toBeNull();
  });

  it("rejects inventing unlimited for unknown plans (falls back to 1)", () => {
    expect(maxDevicesForPlan("enterprise")).toBe(1);
    expect(maxDevicesForPlan("")).toBe(1);
  });
});

describe("subscription-backed recognition includes Business", () => {
  it("recognizes starter, pro, and business with subscriptionId", () => {
    for (const plan of ["starter", "pro", "business"] as const) {
      expect(
        isSubscriptionBackedPaidLicense({
          subscriptionId: "sub-1",
          plan,
          status: "active",
        }),
      ).toBe(true);
    }
  });

  it("rejects trial and unknown plans for renewal extension", () => {
    expect(
      isSubscriptionBackedPaidLicense({
        subscriptionId: "sub-1",
        plan: "trial",
        status: "active",
      }),
    ).toBe(false);
    expect(
      isSubscriptionBackedPaidLicense({
        subscriptionId: "sub-1",
        plan: "gold",
        status: "active",
      }),
    ).toBe(false);
  });
});

describe("renewal extend preserves seat limits by plan", () => {
  it("Starter renewal: validity extends forward; seat stays 1", () => {
    const current = new Date("2026-07-01T00:00:00Z");
    const periodEnd = new Date("2026-08-01T00:00:00Z");
    expect(maxLicenseValidUntil(current, periodEnd).toISOString()).toBe(
      periodEnd.toISOString(),
    );
    expect(maxDevicesForPlan("starter")).toBe(1);
  });

  it("Pro renewal: validity extends forward; seat stays 3", () => {
    const current = new Date("2026-07-01T00:00:00Z");
    const periodEnd = new Date("2026-08-01T00:00:00Z");
    expect(maxLicenseValidUntil(current, periodEnd).getTime()).toBe(
      periodEnd.getTime(),
    );
    expect(maxDevicesForPlan("pro")).toBe(3);
  });

  it("Business renewal: validity extends forward; seat stays null", () => {
    const current = new Date("2026-07-01T00:00:00Z");
    const periodEnd = new Date("2026-08-01T00:00:00Z");
    expect(maxLicenseValidUntil(current, periodEnd).getTime()).toBe(
      periodEnd.getTime(),
    );
    expect(maxDevicesForPlan("business")).toBeNull();
  });

  it("never shortens validity on overlapping renewals (idempotent max)", () => {
    const later = new Date("2026-09-01T00:00:00Z");
    const earlier = new Date("2026-08-01T00:00:00Z");
    expect(maxLicenseValidUntil(later, earlier).getTime()).toBe(later.getTime());
    const again = maxLicenseValidUntil(later, earlier);
    expect(again.getTime()).toBe(later.getTime());
  });
});

describe("duplicate invoice / double reconcile", () => {
  it("second resolve stays extend — no duplicate create target", () => {
    const subscriptionId = "sub-paid-1";
    const licenses = [
      {
        id: "lic-1",
        subscriptionId,
        plan: "business",
        status: "active",
      },
    ];
    const first = resolveSubscriptionPaidLicenseAction(licenses, subscriptionId);
    const second = resolveSubscriptionPaidLicenseAction(licenses, subscriptionId);
    expect(first).toEqual({ action: "extend", targetLicenseId: "lic-1" });
    expect(second).toEqual(first);
  });
});
