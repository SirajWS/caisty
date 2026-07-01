import { POS_LANDING_PATH } from "../config/marketingRoutes";

/** Default document + sharing copy for the company homepage (`/`). */
export const COMPANY_SITE_TITLE = "Caisty – Business software solutions";
const COMPANY_META_DESCRIPTION =
  "Caisty builds modern business software for restaurants, retail businesses and growing teams.";
const COMPANY_OG_DESCRIPTION =
  "Modern cloud software products for restaurants, retail businesses and growing teams.";

/** Contact page (`/contact`). */
export const CONTACT_SITE_TITLE = "Contact – Caisty";
const CONTACT_META_DESCRIPTION =
  "Get in touch with Caisty for general inquiries, partnerships or technical support.";

/** Caisty POS product landing (`/caisty-pos`). */
export const POS_PRODUCT_SITE_TITLE = "Caisty POS – Modern cloud POS software";
const POS_META_DESCRIPTION = "Modern POS software for restaurants, cafés and small shops.";

function setMetaContentById(id: string, content: string) {
  const el = document.getElementById(id);
  if (el && el instanceof HTMLMetaElement) {
    el.setAttribute("content", content);
  }
}

function companyOgUrl() {
  if (typeof window === "undefined") return "https://www.caisty.com";
  const { protocol, hostname } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") return `${protocol}//${window.location.host}`;
  if (hostname === "tn.caisty.com") return "https://tn.caisty.com";
  return "https://www.caisty.com";
}

function posCanonicalUrl() {
  if (typeof window === "undefined") return `https://www.caisty.com${POS_LANDING_PATH}`;
  return `${window.location.origin}${POS_LANDING_PATH}`;
}

/** Apply tags aligned with `index.html` ids (company / root). */
export function applyCompanySiteMeta() {
  document.title = COMPANY_SITE_TITLE;
  setMetaContentById("seo-meta-description", COMPANY_META_DESCRIPTION);
  setMetaContentById("seo-og-title", COMPANY_SITE_TITLE);
  setMetaContentById("seo-og-description", COMPANY_OG_DESCRIPTION);
  setMetaContentById("seo-og-url", companyOgUrl());
  setMetaContentById("seo-og-type", "website");
  setMetaContentById("seo-twitter-title", COMPANY_SITE_TITLE);
  setMetaContentById("seo-twitter-description", COMPANY_OG_DESCRIPTION);
}

/** Contact page: call on `/contact` mount. */
export function applyContactSiteMeta() {
  document.title = CONTACT_SITE_TITLE;
  setMetaContentById("seo-meta-description", CONTACT_META_DESCRIPTION);
  setMetaContentById("seo-og-title", CONTACT_SITE_TITLE);
  setMetaContentById("seo-og-description", CONTACT_META_DESCRIPTION);
  setMetaContentById("seo-og-url", companyOgUrl());
  setMetaContentById("seo-og-type", "website");
  setMetaContentById("seo-twitter-title", CONTACT_SITE_TITLE);
  setMetaContentById("seo-twitter-description", CONTACT_META_DESCRIPTION);
}

/** POS product page: call on `/caisty-pos` mount; restore company meta on unmount if needed. */
export function applyCaistyPosProductMeta() {
  document.title = POS_PRODUCT_SITE_TITLE;
  setMetaContentById("seo-meta-description", POS_META_DESCRIPTION);
  setMetaContentById("seo-og-title", POS_PRODUCT_SITE_TITLE);
  setMetaContentById("seo-og-description", POS_META_DESCRIPTION);
  setMetaContentById("seo-og-url", posCanonicalUrl());
  setMetaContentById("seo-og-type", "website");
  setMetaContentById("seo-twitter-title", POS_PRODUCT_SITE_TITLE);
  setMetaContentById("seo-twitter-description", POS_META_DESCRIPTION);
}
