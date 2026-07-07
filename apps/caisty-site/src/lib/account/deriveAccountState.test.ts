import { describe, expect, it } from "vitest";
import {
  deriveAccountState,
  emailVerificationLabel,
  securityStatusLabel,
} from "./deriveAccountState";
import { portalEn } from "../translations/portal/en";

const baseCustomer = {
  id: "c1",
  orgId: "o1",
  name: "Alex",
  email: "alex@test.com",
  portalStatus: "active" as const,
};

function makeInput(
  overrides: Partial<Parameters<typeof deriveAccountState>[0]> = {},
) {
  const customer = overrides.customer ?? baseCustomer;
  const t = overrides.t ?? portalEn;
  return {
    customer,
    securityStatusLabel:
      overrides.securityStatusLabel ??
      securityStatusLabel(customer.portalStatus, t),
    emailStatusLabel:
      overrides.emailStatusLabel ??
      emailVerificationLabel(customer.portalStatus, t),
    t,
  };
}

describe("deriveAccountState", () => {
  it("derives compact security status from portal status", () => {
    const state = deriveAccountState(makeInput());

    expect(state.securityStatus).toHaveLength(2);
    expect(state.securityStatus[0].value).toBe(portalEn.account.center.emailVerified);
    expect(state.securityStatus[1].value).toBe(portalEn.account.center.securityProtected);
    expect(state.securityStatus[0].tone).toBe("ok");
  });

  it("marks pending email verification honestly", () => {
    const state = deriveAccountState(
      makeInput({ customer: { ...baseCustomer, portalStatus: "pending" } }),
    );

    expect(state.securityStatus[0].tone).toBe("attention");
    expect(state.securityStatus[0].value).toBe(portalEn.account.center.emailPending);
  });

  it("includes legal footer links and support mailto", () => {
    const state = deriveAccountState(makeInput());

    expect(state.legalDocuments.length).toBeGreaterThanOrEqual(6);
    expect(state.legalDocuments[0].shortTitle).toBeTruthy();
    expect(state.supportHref).toMatch(/^mailto:/);
  });
});
