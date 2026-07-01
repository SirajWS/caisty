/** Company homepage (root). Legacy `/company` redirects here. */
export const COMPANY_HOME = "/";

/** Caisty POS product marketing page (hero, #product, #pricing, …). */
export const POS_LANDING_PATH = "/caisty-pos";

/** Public contact page. */
export const CONTACT_PATH = "/contact";

/** Legal document routes (footer). */
export const LEGAL_PATHS = {
  terms: "/legal/terms-and-conditions",
  privacy: "/legal/privacy-policy",
  cookie: "/legal/cookie-policy",
  eula: "/legal/eula",
  dpa: "/legal/dpa",
  subprocessors: "/legal/subprocessors",
  imprint: "/imprint",
} as const;
