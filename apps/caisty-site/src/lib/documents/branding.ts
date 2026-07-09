/**
 * Shared Caisty document branding — aligned with cloud-api invoice HTML tokens.
 * Used by portal PDF exports and future invoice / fiscal document renderers.
 */
export const CAISTY_DOCUMENT_BRAND = {
  productName: "Caisty Cloud",
  website: "www.caisty.com",
  websiteUrl: "https://www.caisty.com",
  colors: {
    orange: [249, 115, 22] as const,
    orangeDark: [255, 91, 16] as const,
    textDark: [21, 24, 29] as const,
    textMuted: [107, 114, 128] as const,
    textFaint: [154, 161, 172] as const,
    border: [228, 230, 234] as const,
    surface: [248, 249, 251] as const,
    white: [255, 255, 255] as const,
  },
  page: {
    format: "a4" as const,
    orientation: "portrait" as const,
    unit: "mm" as const,
    marginLeft: 14,
    marginRight: 14,
    marginTop: 16,
    marginBottom: 18,
    contentWidth: 182,
    footerY: 287,
  },
  font: {
    family: "helvetica" as const,
    titleSize: 16,
    subtitleSize: 11,
    sectionSize: 10,
    bodySize: 9,
    metaSize: 8.5,
    footerSize: 7.5,
  },
} as const;
