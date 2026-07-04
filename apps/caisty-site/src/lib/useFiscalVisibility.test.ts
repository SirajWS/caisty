import { describe, expect, it } from "vitest";
import { portalEn } from "./translations/portal/en";
import {
  deriveFiscalVisibility,
  getFiscalCustomerCopy,
} from "./useFiscalVisibility";

describe("deriveFiscalVisibility", () => {
  it("shows fiscal UI for DE (fiscalRequired true)", () => {
    const v = deriveFiscalVisibility({
      fiscalRequired: true,
      fiscalStatus: "pending_setup",
      country: "DE",
    });
    expect(v.showFiscalUi).toBe(true);
    expect(v.fiscalRequired).toBe(true);
    expect(v.isPendingSetup).toBe(true);
    expect(v.isActive).toBe(false);
  });

  it("hides fiscal UI for TN, MA, DZ, LY (fiscalRequired false)", () => {
    for (const code of ["TN", "MA", "DZ", "LY"]) {
      const v = deriveFiscalVisibility({
        fiscalRequired: false,
        fiscalStatus: "not_required",
        country: code,
      });
      expect(v.showFiscalUi, code).toBe(false);
      expect(v.fiscalRequired, code).toBe(false);
    }
  });

  it("hides fiscal UI when fiscalRequired is missing (unknown fallback)", () => {
    const v = deriveFiscalVisibility({
      fiscalStatus: "pending_setup",
    });
    expect(v.showFiscalUi).toBe(false);
  });

  it("hides fiscal UI for null input", () => {
    expect(deriveFiscalVisibility(null).showFiscalUi).toBe(false);
  });

  it("marks active when fiscalStatus is active", () => {
    const v = deriveFiscalVisibility({
      fiscalRequired: true,
      fiscalStatus: "active",
      country: "DE",
    });
    expect(v.isActive).toBe(true);
    expect(v.isPendingSetup).toBe(false);
  });

  it("returns fiscal-required copy for DE pending setup", () => {
    const copy = getFiscalCustomerCopy(
      portalEn,
      deriveFiscalVisibility({
        fiscalRequired: true,
        fiscalStatus: "pending_setup",
        country: "DE",
      }),
    );
    expect(copy?.message).toBe(
      "Complete your Fiscal Pack to activate your POS.",
    );
    expect(copy?.badge).toBe("Fiscal pack");
  });

  it("returns standard receipts copy for TN", () => {
    const copy = getFiscalCustomerCopy(
      portalEn,
      deriveFiscalVisibility({
        fiscalRequired: false,
        fiscalStatus: "not_required",
        country: "TN",
      }),
    );
    expect(copy?.message).toBe(
      "Standard receipts included — no fiscal pack required.",
    );
  });

  it("returns null copy when country is not set", () => {
    expect(
      getFiscalCustomerCopy(
        portalEn,
        deriveFiscalVisibility({ fiscalRequired: false }),
      ),
    ).toBeNull();
  });
});
