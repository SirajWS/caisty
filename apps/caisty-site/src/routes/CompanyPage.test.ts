import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { company } from "../lib/translations/company";
import { companyTn } from "../lib/translations/companyTn";
import { common } from "../lib/translations/common";
import type { CompanyCopy } from "../lib/translations/company";
import type { Language } from "../lib/translations/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const companyPageSource = readFileSync(join(__dirname, "CompanyPage.tsx"), "utf8");
const siteMetaSource = readFileSync(join(__dirname, "../lib/siteDocumentMeta.ts"), "utf8");

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
  expect(copy.capabilities.items).toHaveLength(3);
  expect(copy.about.values).toHaveLength(3);
  expect(copy.cta.ctaProducts.length).toBeGreaterThan(0);
  expect(copy.cta.ctaContact.length).toBeGreaterThan(0);
}

describe("Company page Phase 2.1 copy", () => {
  it("positions Caisty as an independent software company with SaaS, platforms and tailored solutions", () => {
    expect(company.en.hero.badge).toBe("Independent software company");
    expect(company.en.hero.badge).not.toContain("Built in Germany");
    expect(company.en.trustBar.items).toContain("Built in Germany");
    expect(company.en.hero.badge.toLowerCase()).toContain("independent");
    const en = flattenCopy(company.en).join("\n").toLowerCase();
    expect(en).toContain("saas");
    expect(en).toMatch(/digital platform/);
    expect(en).toMatch(/tailored software solutions/);
    expect(company.en.platform.products[2].status).toBe("Coming soon");
  });

  it("keeps Caisty POS, Business and Staff in the product ecosystem", () => {
    expect(company.en.platform.products.map((p) => p.title)).toEqual([
      "Caisty POS",
      "Caisty Business",
      "Caisty Staff",
    ]);
    expect(company.en.platform.products[0].status).toBe("Available");
    expect(company.en.platform.products[1].status).toBe("Available");
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

  it("provides structure for all locales including capabilities", () => {
    for (const language of LANGUAGES) {
      assertCompanyStructure(company[language]);
    }
    assertCompanyStructure(companyTn);
  });

  it("localizes Coming soon and ecosystem labels without English leftovers", () => {
    expect(company.de.platform.products[2].status).toBe("Demnächst");
    expect(company.fr.platform.products[2].status).toBe("Bientôt disponible");
    expect(company.ar.platform.products[2].status).toBe("قريباً");
    expect(companyTn.platform.products[2].status).toBe("Bientôt disponible");
    expect(flattenCopy(companyTn).join("\n")).not.toContain("Coming soon");
    expect(company.en.hero.platformLabel).toBe("The Caisty product ecosystem");
    for (const language of LANGUAGES) {
      expect(company[language].hero.platformLabel).not.toBe(company[language].platform.title);
    }
  });

  it("avoids restaurant/retail company-wide positioning in company and footer copy", () => {
    for (const language of LANGUAGES) {
      const text = flattenCopy(company[language]).join("\n").toLowerCase();
      expect(text).not.toContain("restaurant");
      expect(text).not.toContain("retail");
    }
    expect(common.en.footer.companyTagline.toLowerCase()).not.toContain("restaurant");
    expect(common.en.footer.companyTagline.toLowerCase()).not.toContain("retail");
    expect(common.en.footer.companyTagline.toLowerCase()).toContain("saas");
  });
});

describe("CompanyPage Phase 2.1 layout boundaries", () => {
  it("uses a compact hero platform panel without product screenshots in the hero", () => {
    expect(companyPageSource).toContain("company-page__hero-platform");
    expect(companyPageSource).toContain("t.hero.platformLabel");
    const heroSlice = companyPageSource.slice(
      companyPageSource.indexOf("Company Hero"),
      companyPageSource.indexOf("Trust strip"),
    );
    expect(heroSlice).not.toContain("<img");
    expect(heroSlice).not.toContain("screenshots/");
  });

  it("removes detailed product screenshots from the company page rendering", () => {
    expect(companyPageSource).not.toContain("CaistyPosDarkMode.png");
    expect(companyPageSource).not.toContain("caisty-business-dashboard");
    expect(companyPageSource).not.toContain("caisty-business-reports");
    expect(companyPageSource).not.toContain("caisty-business-mobile");
    expect(companyPageSource).not.toContain("<img");
    expect(companyPageSource).not.toContain("Bild13");
    expect(companyPageSource).not.toContain("portal.png");
    expect(companyPageSource).not.toContain("company-page__business-media");
  });

  it("renders three capability areas and keeps about plus contact CTA", () => {
    expect(companyPageSource).toContain("company-page__capabilities");
    expect(companyPageSource).toContain("t.capabilities.items");
    expect(companyPageSource).toContain('id="about"');
    expect(companyPageSource).toContain('id="products"');
    expect(companyPageSource).toContain("CONTACT_PATH");
    expect(companyPageSource).toContain("t.cta.ctaContact");
    expect(companyPageSource).not.toContain("POS_LANDING_PATH");
    expect(companyPageSource).not.toContain("TechStackCardGrid");
  });

  it("keeps a single h1 and does not start Phase 3 product-page work", () => {
    expect(companyPageSource.match(/<h1[\s>]/g)?.length).toBe(1);
    expect(companyPageSource).not.toContain("/caisty-staff");
    expect(companyPageSource).not.toContain("WorkTrack");
  });

  it("updates company SEO description away from restaurant/retail framing", () => {
    expect(siteMetaSource).toContain(
      "Caisty is an independent software company from Germany developing SaaS products, digital platforms and tailored software solutions.",
    );
    expect(siteMetaSource).toContain("COMPANY_SITE_TITLE = \"Caisty – SaaS products & digital solutions\"");
    expect(siteMetaSource).not.toMatch(/COMPANY_META_DESCRIPTION\s*=\s*"[^"]*restaurant/);
  });
});
