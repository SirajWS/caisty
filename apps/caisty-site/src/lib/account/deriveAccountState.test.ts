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

describe("deriveAccountState", () => {
  it("uses real customer fields without inventing session history", () => {
    const state = deriveAccountState({
      customer: baseCustomer,
      languageLabel: "English",
      themeLabel: "Light",
      securityStatusLabel: securityStatusLabel("active", portalEn),
      emailStatusLabel: emailVerificationLabel("active", portalEn),
      roleLabel: portalEn.account.center.roleOwner,
      browserLabel: "Google Chrome",
      t: portalEn,
    });

    expect(state.overview.find((k) => k.id === "name")?.value).toBe("Alex");
    expect(state.session.find((f) => f.id === "activity")?.value).toBe(
      portalEn.account.center.sessionActiveNow,
    );
    expect(state.checklist.find((i) => i.id === "2fa")?.status).toBe("coming_soon");
  });

  it("marks pending email verification honestly", () => {
    const state = deriveAccountState({
      customer: { ...baseCustomer, portalStatus: "pending" },
      languageLabel: "English",
      themeLabel: "Light",
      securityStatusLabel: securityStatusLabel("pending", portalEn),
      emailStatusLabel: emailVerificationLabel("pending", portalEn),
      roleLabel: portalEn.account.center.roleOwner,
      browserLabel: null,
      t: portalEn,
    });

    expect(state.checklist.find((i) => i.id === "email")?.status).toBe("pending");
  });
});
