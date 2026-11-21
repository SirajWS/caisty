import { describe, expect, it } from "vitest";

import { licenseSeatPayload } from "../deviceSeats.js";

describe("licenseSeatPayload", () => {
  it("keeps maxDevices null as unlimited without inventing a numeric cap", () => {
    expect(licenseSeatPayload(null, 2)).toEqual({
      devicesCount: 2,
      seatSummary: {
        used: 2,
        limit: null,
        unlimitedDevices: true,
      },
    });
  });

  it("uses the license maxDevices field as the denominator", () => {
    expect(licenseSeatPayload(3, 2).seatSummary).toEqual({
      used: 2,
      limit: 3,
      unlimitedDevices: false,
    });
  });
});
