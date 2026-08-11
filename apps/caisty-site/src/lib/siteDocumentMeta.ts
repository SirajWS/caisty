import { POS_LANDING_PATH } from "../config/marketingRoutes";

/** Default document + sharing copy for the company homepage (`/`). */
export const COMPANY_SITE_TITLE = "Caisty – SaaS products & digital solutions";
const COMPANY_META_DESCRIPTION =
  "Caisty is an independent software company from Germany developing SaaS products, digital platforms and tailored software solutions.";
const COMPANY_OG_DESCRIPTION =
  "Independent software company from Germany — SaaS products, digital platforms and tailored software solutions.";

export const COMPANY_OG_IMAGE_PATH = "/og/company-default.svg";

/** Caisty POS product landing (`/caisty-pos`). */
export const POS_PRODUCT_SITE_TITLE = "Caisty POS – Modern cloud POS software";
const POS_META_DESCRIPTION =
  "Modern POS software for restaurants, cafés and small shops. Offline-first checkout, cloud portal and device sync.";
const POS_OG_DESCRIPTION =
  "Touchscreen POS with offline mode, customer portal and cloud device management — built for restaurants and retail.";

export const POS_OG_IMAGE_PATH = "/og/pos-default.svg";

/** Contact page (`/contact`). */
export const CONTACT_SITE_TITLE = "Contact – Caisty";
const CONTACT_META_DESCRIPTION =
  "Get in touch with Caisty for general inquiries, partnerships or technical support.";

const HREFLANG_IDS = ["seo-hreflang-en", "seo-hreflang-de", "seo-hreflang-x-default"] as const;

function setMetaContentById(id: string, content: string) {
  const el = document.getElementById(id);
  if (el && el instanceof HTMLMetaElement) {
    el.setAttribute("content", content);
  }
}

function siteOrigin(): string {
  if (typeof window === "undefined") return "https://www.caisty.com";
  const { protocol, hostname, host } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") return `${protocol}//${host}`;
  if (hostname === "tn.caisty.com") return "https://tn.caisty.com";
  return "https://www.caisty.com";
}

function absoluteImageUrl(path: string): string {
  return `${siteOrigin()}${path}`;
}

function companyCanonicalUrl() {
  return siteOrigin();
}

function posCanonicalUrl() {
  return `${siteOrigin()}${POS_LANDING_PATH}`;
}

function upsertHreflangLink(id: string, hreflang: string, href: string) {
  let link = document.getElementById(id) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.id = id;
    link.rel = "alternate";
    document.head.appendChild(link);
  }
  link.hreflang = hreflang;
  link.href = href;
}

function applyMarketingHreflang(canonicalPath: string) {
  const href = `${siteOrigin()}${canonicalPath === "/" ? "" : canonicalPath}`;
  const base = href.endsWith("/") && href !== `${siteOrigin()}/` ? href.slice(0, -1) : href;
  upsertHreflangLink(HREFLANG_IDS[0], "en", base || siteOrigin());
  upsertHreflangLink(HREFLANG_IDS[1], "de", base || siteOrigin());
  upsertHreflangLink(HREFLANG_IDS[2], "x-default", base || siteOrigin());
}

function setOgImage(path: string) {
  const url = absoluteImageUrl(path);
  setMetaContentById("seo-og-image", url);
  setMetaContentById("seo-twitter-image", url);
}

/** Apply tags aligned with `index.html` ids (company / root). */
export function applyCompanySiteMeta() {
  document.title = COMPANY_SITE_TITLE;
  setMetaContentById("seo-meta-description", COMPANY_META_DESCRIPTION);
  setMetaContentById("seo-og-title", COMPANY_SITE_TITLE);
  setMetaContentById("seo-og-description", COMPANY_OG_DESCRIPTION);
  setMetaContentById("seo-og-url", companyCanonicalUrl());
  setMetaContentById("seo-og-type", "website");
  setOgImage(COMPANY_OG_IMAGE_PATH);
  setMetaContentById("seo-twitter-title", COMPANY_SITE_TITLE);
  setMetaContentById("seo-twitter-description", COMPANY_OG_DESCRIPTION);
  applyMarketingHreflang("/");
}

/** Contact page: call on `/contact` mount. */
export function applyContactSiteMeta() {
  document.title = CONTACT_SITE_TITLE;
  setMetaContentById("seo-meta-description", CONTACT_META_DESCRIPTION);
  setMetaContentById("seo-og-title", CONTACT_SITE_TITLE);
  setMetaContentById("seo-og-description", CONTACT_META_DESCRIPTION);
  setMetaContentById("seo-og-url", companyCanonicalUrl());
  setMetaContentById("seo-og-type", "website");
  setMetaContentById("seo-twitter-title", CONTACT_SITE_TITLE);
  setMetaContentById("seo-twitter-description", CONTACT_META_DESCRIPTION);
}

/** POS product page: call on `/caisty-pos` mount; restore company meta on unmount if needed. */
export function applyCaistyPosProductMeta() {
  document.title = POS_PRODUCT_SITE_TITLE;
  setMetaContentById("seo-meta-description", POS_META_DESCRIPTION);
  setMetaContentById("seo-og-title", POS_PRODUCT_SITE_TITLE);
  setMetaContentById("seo-og-description", POS_OG_DESCRIPTION);
  setMetaContentById("seo-og-url", posCanonicalUrl());
  setMetaContentById("seo-og-type", "website");
  setOgImage(POS_OG_IMAGE_PATH);
  setMetaContentById("seo-twitter-title", POS_PRODUCT_SITE_TITLE);
  setMetaContentById("seo-twitter-description", POS_OG_DESCRIPTION);
  applyMarketingHreflang(POS_LANDING_PATH);
}
