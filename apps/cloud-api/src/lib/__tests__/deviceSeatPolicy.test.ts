import { describe, expect, it } from "vitest";

import {
  countSeatOccupyingDevicesForLicense,
  deviceOccupiesSeat,
} from "../deviceSeatPolicy.js";

describe("deviceOccupiesSeat", () => {
  it("counts active with licenseId", () => {
    expect(
      deviceOccupiesSeat({ status: "active", licenseId: "lic-1" }),
    ).toBe(true);
  });

  it("does not count pending_approval", () => {
    expect(
      deviceOccupiesSeat({ status: "pending_approval", licenseId: null }),
    ).toBe(false);
  });

  it("does not count rejected", () => {
    expect(
      deviceOccupiesSeat({ status: "rejected", licenseId: null }),
    ).toBe(false);
  });

  it("does not count released", () => {
    expect(
      deviceOccupiesSeat({ status: "released", licenseId: null }),
    ).toBe(false);
  });

  it("counts blocked with existing license binding", () => {
    expect(
      deviceOccupiesSeat({ status: "blocked", licenseId: "lic-1" }),
    ).toBe(true);
  });

  it("does not count active without licenseId", () => {
    expect(
      deviceOccupiesSeat({ status: "active", licenseId: null }),
    ).toBe(false);
  });

  it("does not count archived rows even if they still look assigned", () => {
    expect(
      deviceOccupiesSeat({
        status: "active",
        licenseId: "lic-1",
        archivedAt: new Date("2026-01-01T00:00:00.000Z"),
      }),
    ).toBe(false);
  });
});

describe("countSeatOccupyingDevicesForLicense", () => {
  const rows = [
    { status: "active", licenseId: "lic-1" },
    { status: "blocked", licenseId: "lic-1" },
    { status: "pending_approval", licenseId: null },
    { status: "rejected", licenseId: null },
    { status: "released", licenseId: null },
    { status: "active", licenseId: "lic-2" },
  ];

  it("counts only seat-consuming devices for the target license", () => {
    expect(countSeatOccupyingDevicesForLicense(rows, "lic-1")).toBe(2);
  });

  it("does not include devices from other licenses", () => {
    expect(countSeatOccupyingDevicesForLicense(rows, "lic-2")).toBe(1);
  });

  it("returns zero when no seats are occupied", () => {
    expect(countSeatOccupyingDevicesForLicense(rows, "lic-missing")).toBe(0);
  });

  it("counts two device IDs with the same fingerprint independently", () => {
    expect(
      countSeatOccupyingDevicesForLicense(
        [
          { status: "active", licenseId: "lic-1" },
          { status: "active", licenseId: "lic-1" },
        ],
        "lic-1",
      ),
    ).toBe(2);
  });

  it("drops occupancy after release and not again on a repeated release", () => {
    const afterFirst = [
      { status: "released", licenseId: null },
      { status: "active", licenseId: "lic-1" },
    ];
    expect(countSeatOccupyingDevicesForLicense(afterFirst, "lic-1")).toBe(1);
    expect(countSeatOccupyingDevicesForLicense(afterFirst, "lic-1")).toBe(1);
  });

  it("does not unbind occupying seats when the license is revoked or expired", () => {
    expect(
      countSeatOccupyingDevicesForLicense(
        [{ status: "active", licenseId: "lic-1" }],
        "lic-1",
      ),
    ).toBe(1);
  });
});
