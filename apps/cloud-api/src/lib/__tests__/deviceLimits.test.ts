import { describe, expect, it } from "vitest";

import {
  canAcceptAdditionalDevice,
  isUnlimitedDeviceLimit,
  seatLimitForApi,
} from "../deviceLimits.js";

describe("deviceLimits", () => {
  it("treats null as unlimited", () => {
    expect(isUnlimitedDeviceLimit(null)).toBe(true);
    expect(isUnlimitedDeviceLimit(1)).toBe(false);
    expect(isUnlimitedDeviceLimit(0)).toBe(false);
  });

  it("blocks starter at 1 device", () => {
    expect(canAcceptAdditionalDevice(0, 1)).toBe(true);
    expect(canAcceptAdditionalDevice(1, 1)).toBe(false);
  });

  it("blocks pro at 3 devices", () => {
    expect(canAcceptAdditionalDevice(2, 3)).toBe(true);
    expect(canAcceptAdditionalDevice(3, 3)).toBe(false);
  });

  it("blocks business at 5 devices", () => {
    expect(canAcceptAdditionalDevice(4, 5)).toBe(true);
    expect(canAcceptAdditionalDevice(5, 5)).toBe(false);
  });

  it("still treats explicit null license cap as unlimited (enterprise override)", () => {
    expect(canAcceptAdditionalDevice(5, null)).toBe(true);
    expect(canAcceptAdditionalDevice(10, null)).toBe(true);
    expect(canAcceptAdditionalDevice(100, null)).toBe(true);
  });

  it("never treats 0 as unlimited", () => {
    expect(canAcceptAdditionalDevice(0, 0)).toBe(false);
    expect(seatLimitForApi(0).unlimitedDevices).toBe(false);
  });

  it("exposes null maxDevices for API without coercing to 1", () => {
    expect(seatLimitForApi(null)).toEqual({
      maxDevices: null,
      unlimitedDevices: true,
      limit: null,
    });
    expect(seatLimitForApi(3)).toEqual({
      maxDevices: 3,
      unlimitedDevices: false,
      limit: 3,
    });
  });
});
