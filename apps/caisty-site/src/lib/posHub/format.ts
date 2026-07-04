export function formatInstallerBytes(
  bytes: number | null,
  locale: string,
  fallback: string,
): string {
  if (!bytes || bytes <= 0) return fallback;
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toLocaleString(locale, { maximumFractionDigits: 1 })} ${units[unit]}`;
}

export function translatePortalEnvironment(
  raw: string,
  labels: {
    production: string;
    staging: string;
    development: string;
  },
): string {
  const key = raw.trim().toLowerCase();
  if (key === "staging") return labels.staging;
  if (key === "development") return labels.development;
  return labels.production;
}
