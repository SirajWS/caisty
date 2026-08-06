import { describe, expect, it } from "vitest";

import { resolveConsistentDeviceOrgId } from "../posOrgContext.js";

const ORG_A = "11111111-1111-1111-1111-111111111111";
const ORG_B = "22222222-2222-2222-2222-222222222222";

describe("resolveConsistentDeviceOrgId", () => {
  it("returns org when device and license match", () => {
    expect(
      resolveConsistentDeviceOrgId({
        deviceOrgId: ORG_A,
        licenseOrgId: ORG_A,
      }),
    ).toBe(ORG_A);
  });

  it("returns null when device org is missing", () => {
    expect(
      resolveConsistentDeviceOrgId({
        deviceOrgId: "",
        licenseOrgId: ORG_A,
      }),
    ).toBeNull();
  });

  it("returns null when license org is missing", () => {
    expect(
      resolveConsistentDeviceOrgId({
        deviceOrgId: ORG_A,
        licenseOrgId: null,
      }),
    ).toBeNull();
  });

  it("returns null when orgs disagree", () => {
    expect(
      resolveConsistentDeviceOrgId({
        deviceOrgId: ORG_A,
        licenseOrgId: ORG_B,
      }),
    ).toBeNull();
  });

  it("never returns undefined, null string, or empty string", () => {
    expect(
      resolveConsistentDeviceOrgId({
        deviceOrgId: undefined,
        licenseOrgId: undefined,
      }),
    ).toBeNull();
    expect(
      resolveConsistentDeviceOrgId({
        deviceOrgId: "null",
        licenseOrgId: "null",
      }),
    ).toBeNull();
  });
});
