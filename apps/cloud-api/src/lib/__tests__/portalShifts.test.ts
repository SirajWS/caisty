import { describe, expect, it } from "vitest";

import {
  deriveShiftDurationMinutes,
  mapPortalOpenShiftRecord,
} from "../portalShifts.js";

describe("portalShifts", () => {
  it("derives duration in minutes", () => {
    const startedAt = new Date("2026-07-14T10:00:00.000Z");
    const endedAt = new Date("2026-07-14T12:30:00.000Z");
    expect(deriveShiftDurationMinutes(startedAt, endedAt)).toBe(150);
  });

  it("maps open shift portal record", () => {
    const mapped = mapPortalOpenShiftRecord(
      {
        id: "shift-1",
        localShiftId: "local-shift-1",
        status: "open",
        cashier: "Anna",
        deviceId: "dev-1",
        deviceName: "Till 1",
        businessDate: "2026-07-14",
        startedAt: new Date("2026-07-14T08:00:00.000Z"),
        endedAt: null,
        openingFloatMinor: 5000,
        closingFloatMinor: null,
        previousClosingFloatMinor: null,
        currency: "EUR",
      },
      new Date("2026-07-14T09:00:00.000Z"),
    );

    expect(mapped.shiftId).toBe("shift-1");
    expect(mapped.durationMinutes).toBe(60);
    expect(mapped.openingFloatMinor).toBe(5000);
  });
});
