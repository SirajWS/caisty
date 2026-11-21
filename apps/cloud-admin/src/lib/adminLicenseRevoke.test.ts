import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  applyLicenseRevokeUpdate,
  canRevokeLicense,
  isLicenseRevokeBusy,
  REVOKE_LICENSE_CONFIRM_MESSAGE,
} from "./adminLicenseRevoke";

const adminSrc = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("admin license revoke", () => {
  it("allows Revoke for every persisted status except revoked", () => {
    expect(canRevokeLicense("active")).toBe(true);
    expect(canRevokeLicense("expired")).toBe(true);
    expect(canRevokeLicense("blocked")).toBe(true);
    expect(canRevokeLicense("revoked")).toBe(false);
  });

  it("updates list status after a successful revoke without duplicating rows", () => {
    const after = applyLicenseRevokeUpdate(
      [
        { id: "a", status: "active" },
        { id: "b", status: "active" },
      ],
      "a",
    );
    expect(after.map((l) => l.status)).toEqual(["revoked", "active"]);
    expect(after).toHaveLength(2);
  });

  it("blocks duplicate revoke while busy and requires the standard confirm copy", () => {
    expect(isLicenseRevokeBusy("lic-1", "lic-1")).toBe(true);
    expect(isLicenseRevokeBusy(null, "lic-1")).toBe(false);
    expect(REVOKE_LICENSE_CONFIRM_MESSAGE).toMatch(/explicitly released/i);
    expect(REVOKE_LICENSE_CONFIRM_MESSAGE).toMatch(/cannot currently be reversed/i);
  });
});

describe("A1.2b Super-Admin license delete UI", () => {
  it("removes license Delete actions from list, portal list and detail", () => {
    const files = [
      "pages/Licenses/LicensesListPage.tsx",
      "pages/Licenses/PortalLicensesPage.tsx",
      "pages/Licenses/LicenseDetailPage.tsx",
    ];
    for (const rel of files) {
      const src = readFileSync(join(adminSrc, rel), "utf8");
      expect(src).not.toMatch(/handleDelete/);
      expect(src).not.toMatch(/apiDelete\(`\/licenses\//);
      expect(src).not.toMatch(/>\s*Delete\s*</);
    }
  });

  it("does not remove A1.2a customer Restore helpers", () => {
    const src = readFileSync(
      join(adminSrc, "pages/Customers/CustomersListPage.tsx"),
      "utf8",
    );
    expect(src).toMatch(/Restore/);
    expect(src).toMatch(/customerStatusPatchBody/);
  });
});
