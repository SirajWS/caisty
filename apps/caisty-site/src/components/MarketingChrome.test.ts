import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { common } from "../lib/translations/common";
import { worktrackPage } from "../lib/translations/worktrackPage";
import type { Language } from "../lib/translations/types";
import {
  COMPANY_HOME,
  CONTACT_PATH,
  LEGAL_PATHS,
  POS_LANDING_PATH,
  STAFF_LANDING_PATH,
} from "../config/marketingRoutes";

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteLayoutSource = readFileSync(join(__dirname, "../layouts/SiteLayout.tsx"), "utf8");
const productsNavSource = readFileSync(join(__dirname, "ProductsNavMenu.tsx"), "utf8");
const appSource = readFileSync(join(__dirname, "../App.tsx"), "utf8");

const LANGUAGES: Language[] = ["en", "fr", "de", "ar"];

function flattenCopy(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(flattenCopy);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(flattenCopy);
  }
  return [];
}

describe("Phase 2 marketing chrome", () => {
  it("keeps the original logo component in the site layout", () => {
    expect(siteLayoutSource).toContain("CaistyLogo");
    expect(siteLayoutSource).toContain("header");
    expect(siteLayoutSource).toContain("<nav");
  });

  it("exposes Company, Products, Pricing and Contact navigation", () => {
    expect(siteLayoutSource).toContain("DesktopProductsNavMenu");
    expect(siteLayoutSource).toContain("MobileProductsNavMenu");
    expect(siteLayoutSource).toContain("t.nav.company");
    expect(siteLayoutSource).toContain("t.nav.pricing");
    expect(siteLayoutSource).toContain("t.nav.contact");
    expect(siteLayoutSource).toContain("CONTACT_PATH");
  });

  it("lists POS, Business and Staff in the products menu with Staff coming soon", () => {
    expect(productsNavSource).toContain("POS_LANDING_PATH");
    expect(productsNavSource).toContain("#products");
    expect(productsNavSource).toContain("STAFF_LANDING_PATH");
    expect(productsNavSource).toContain("aria-expanded");
    expect(productsNavSource).toContain("aria-controls");
    expect(productsNavSource).toContain("Escape");
    expect(productsNavSource).toContain("mkt-products-menu__item--soon");
  });

  it("keeps Staff linked to the existing coming-soon route", () => {
    expect(STAFF_LANDING_PATH).toBe("/worktrack");
    expect(POS_LANDING_PATH).toBe("/caisty-pos");
    expect(CONTACT_PATH).toBe("/contact");
    expect(COMPANY_HOME).toBe("/");
    expect(appSource).toContain('path="/worktrack"');
    expect(appSource).toContain('path="/caisty-staff"');
    expect(LEGAL_PATHS.privacy).toContain("/legal/");
  });

  it("removes public WorkTrack labels from common and staff page copy", () => {
    for (const language of LANGUAGES) {
      const chromeText = flattenCopy({
        nav: common[language].nav,
        productMenu: common[language].productMenu,
        footer: {
          productWorktrackSoon: common[language].footer.productWorktrackSoon,
          productWorktrackName: common[language].footer.productWorktrackName,
        },
      }).join("\n");
      expect(chromeText).not.toContain("WorkTrack");
      expect(common[language].productMenu.worktrackTitle).toBe("Caisty Staff");
      expect(common[language].productMenu.businessTitle).toBe("Caisty Business");
      expect(common[language].nav.contact.length).toBeGreaterThan(0);
      expect(worktrackPage[language].hero.title).toBe("Caisty Staff");
      expect(worktrackPage[language].documentTitle).toBe("Caisty Staff");
    }
  });

  it("structures the footer with company, products and legal columns", () => {
    expect(siteLayoutSource).toContain("colCompany");
    expect(siteLayoutSource).toContain("colProducts");
    expect(siteLayoutSource).toContain("colLegal");
    expect(siteLayoutSource).toContain("productPosName");
    expect(siteLayoutSource).toContain("worktrackTitle");
    expect(siteLayoutSource).toContain("worktrackStatus");
    expect(siteLayoutSource).not.toContain("productWorktrackSoon");
  });

  it("keeps login and register actions reachable", () => {
    expect(siteLayoutSource).toContain('to="/login"');
    expect(siteLayoutSource).toContain('to="/register"');
  });
});
