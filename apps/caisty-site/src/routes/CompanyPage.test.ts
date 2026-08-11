import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { company } from "../lib/translations/company";
import { companyTn } from "../lib/translations/companyTn";
import type { CompanyCopy } from "../lib/translations/company";
import type { Language } from "../lib/translations/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const companyPageSource = readFileSync(join(__dirname, "CompanyPage.tsx"), "utf8");

const LANGUAGES: Language[] = ["en", "fr", "de", "ar"];

const FORBIDDEN_MARKETING = [
  "Customer Portal",
  "Cloud Platform",
  "WorkTrack",
  "Dispatch",
  "Driver",
  "Food Delivery",
  "Mobility",
  "seven applications",
  "seven connected apps",
];

function flattenCopy(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(flattenCopy);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(flattenCopy);
  }
  return [];
}

function assertCompanyStructure(copy: CompanyCopy) {
  expect(copy.hero.badge.length).toBeGreaterThan(0);
  expect(copy.hero.headline.length).toBeGreaterThan(0);
  expect(copy.hero.platformLabel.length).toBeGreaterThan(0);
  expect(copy.platform.products).toHaveLength(3);
  expect(copy.platform.products.map((p) => p.title)).toEqual([
    "Caisty POS",
    "Caisty Business",
    "Caisty Staff",
  ]);
  expect(copy.storyPos.imageAlt.length).toBeGreaterThan(0);
  expect(copy.storyDashboard.imageAlt.length).toBeGreaterThan(0);
  expect(copy.storyReports.imageAlt.length).toBeGreaterThan(0);
  expect(copy.storyMobile.imageAlt.length).toBeGreaterThan(0);
  expect(copy.about.values).toHaveLength(3);
  expect(copy.cta.ctaProducts.length).toBeGreaterThan(0);
}

describe("Company page Phase 1.4.1 copy", () => {
  it("keeps Caisty POS, Business, Staff and Built in Germany", () => {
    expect(company.en.hero.badge).toContain("Built in Germany");
    expect(company.en.platform.products.map((p) => p.title)).toEqual([
      "Caisty POS",
      "Caisty Business",
      "Caisty Staff",
    ]);
    expect(company.en.platform.products[0].status).toBe("Available");
    expect(company.en.platform.products[1].status).toBe("Available");
    expect(company.en.platform.products[2].status).toBe("Coming soon");
  });

  it("keeps forbidden secret marketing names out of company copy", () => {
    for (const language of LANGUAGES) {
      const text = flattenCopy(company[language]).join("\n");
      for (const forbidden of FORBIDDEN_MARKETING) {
        expect(text).not.toContain(forbidden);
      }
    }
    const tnText = flattenCopy(companyTn).join("\n");
    for (const forbidden of FORBIDDEN_MARKETING) {
      expect(tnText).not.toContain(forbidden);
    }
  });

  it("provides structure for all locales", () => {
    for (const language of LANGUAGES) {
      assertCompanyStructure(company[language]);
    }
  });

  it("provides Tunisia French structure without English leftovers", () => {
    assertCompanyStructure(companyTn);
    expect(companyTn.platform.products[2].status).toBe("Bientôt disponible");
    expect(flattenCopy(companyTn).join("\n")).not.toContain("Coming soon");
  });

  it("localizes Coming soon and hero platform labels", () => {
    expect(company.de.platform.products[2].status).toBe("Demnächst");
    expect(company.fr.platform.products[2].status).toBe("Bientôt disponible");
    expect(company.ar.platform.products[2].status).toBe("قريباً");
    expect(company.en.hero.platformLabel).toBe("The Caisty platform");
    expect(company.de.hero.platformLabel).toBe("Die Caisty-Plattform");
    expect(company.fr.hero.platformLabel).toBe("La plateforme Caisty");
    expect(company.ar.hero.platformLabel).toBe("منصة Caisty");
    expect(companyTn.hero.platformLabel).toBe("La plateforme Caisty");
    for (const language of LANGUAGES) {
      expect(company[language].hero.platformLabel).not.toBe(company[language].platform.title);
    }
    expect(companyTn.hero.platformLabel).not.toBe(companyTn.platform.title);
  });
});

describe("CompanyPage Phase 1.4.1 layout boundaries", () => {
  it("uses a compact hero platform label instead of the full platform title", () => {
    expect(companyPageSource).toContain("t.hero.platformLabel");
    expect(companyPageSource).toContain("company-page__hero-platform");
    expect(companyPageSource).toContain("company-page__hero-modules");
    expect(companyPageSource).not.toContain("company-page__platform-pills");
    const heroSlice = companyPageSource.slice(
      companyPageSource.indexOf("Company Hero"),
      companyPageSource.indexOf("Trust strip"),
    );
    expect(heroSlice).toContain("t.hero.platformLabel");
    expect(heroSlice).not.toContain("t.platform.title");
    expect(heroSlice).not.toContain("CaistyPosDarkMode.png");
    expect(heroSlice).not.toContain("<img");
  });

  it("keeps one image per story section with tight anonymized business assets", () => {
    expect(companyPageSource.match(/CaistyPosDarkMode\.png/g)?.length).toBe(1);
    expect(companyPageSource).toContain("/screenshots/caisty-business-dashboard-tight.png");
    expect(companyPageSource).toContain("/screenshots/caisty-business-reports-tight.png");
    expect(companyPageSource).toContain("/screenshots/caisty-business-mobile.png");
    expect(companyPageSource).not.toContain("company-page__business-media");
    expect(companyPageSource).not.toContain("Bild13");
    expect(companyPageSource).not.toContain("Bild14");
    expect(companyPageSource).not.toContain("portal.png");
  });

  it("does not import TechStackCardGrid on the company page", () => {
    expect(companyPageSource).not.toContain("TechStackCardGrid");
  });

  it("keeps product and about anchors", () => {
    expect(companyPageSource).toContain('id="products"');
    expect(companyPageSource).toContain('id="about"');
  });

  it("keeps story section order POS → dashboard → reports → mobile", () => {
    const pos = companyPageSource.indexOf("storyPos");
    const dashboard = companyPageSource.indexOf("storyDashboard");
    const reports = companyPageSource.indexOf("storyReports");
    const mobile = companyPageSource.indexOf("storyMobile");
    expect(pos).toBeGreaterThan(-1);
    expect(dashboard).toBeGreaterThan(pos);
    expect(reports).toBeGreaterThan(dashboard);
    expect(mobile).toBeGreaterThan(reports);
  });

  it("keeps a single h1 and does not start Phase 2 routing work", () => {
    expect(companyPageSource.match(/<h1[\s>]/g)?.length).toBe(1);
    expect(companyPageSource).not.toContain("/caisty-staff");
    expect(companyPageSource).not.toContain("WorkTrack");
  });
});
