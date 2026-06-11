// Host-based market (global marketing vs Tunisia subdomain).
export type SiteMarket = "global" | "tn";

const TN_HOST = "tn.caisty.com";

export function getSiteMarket(): SiteMarket {
  if (typeof window === "undefined") return "global";
  return window.location.hostname === TN_HOST ? "tn" : "global";
}

export function isTunisiaSite(): boolean {
  return getSiteMarket() === "tn";
}
