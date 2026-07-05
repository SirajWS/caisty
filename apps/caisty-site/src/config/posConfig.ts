/**
 * Central POS release & launch configuration (build-time env).
 * Single source of truth for version, installer, Web POS, and desktop protocol.
 * Future: replace env reads with GET /portal/pos/release API response.
 */

export type PosInstallerConfig = {
  platform: string;
  fileName: string;
  downloadUrl: string;
  sizeBytes: number | null;
  sha256: string | null;
};

export type PosWebConfig = {
  enabled: boolean;
  url: string | null;
  plannedUrl: string;
};

export type PosDesktopConfig = {
  protocol: string;
  openUrl: string;
};

export type PosReleaseConfig = {
  latestVersion: string;
  releaseDate: string | null;
  releaseNotesUrl: string | null;
  releaseNotesSummary: string | null;
  installer: PosInstallerConfig;
  web: PosWebConfig;
  desktop: PosDesktopConfig;
};

const INSTALLER_VERSION_RE = /Caisty\.PoS_([\d.]+)_x64-setup\.exe/i;
const DEFAULT_FALLBACK_VERSION = "0.3.2";
const DEFAULT_PLATFORM = "Windows x64";
const DEFAULT_DESKTOP_PROTOCOL = "caisty";

function env(key: string): string {
  return String(import.meta.env[key] ?? "").trim();
}

function envBool(key: string): boolean {
  const raw = env(key).toLowerCase();
  return raw === "true" || raw === "1";
}

function parseInstallerVersionFromUrl(url: string): string | null {
  const match = url.match(INSTALLER_VERSION_RE);
  return match?.[1]?.trim() || null;
}

function buildInstallerFileName(version: string): string {
  return `Caisty.PoS_${version}_x64-setup.exe`;
}

function buildInstallerRelativePath(version: string): string {
  return `/downloads/${buildInstallerFileName(version)}`;
}

function resolveLatestVersion(): string {
  const url = env("VITE_POS_WINDOWS_URL");
  const fromUrl = url ? parseInstallerVersionFromUrl(url) : null;
  if (fromUrl) return fromUrl;

  const fromEnv = env("VITE_POS_LATEST_VERSION");
  if (fromEnv) return fromEnv;

  return DEFAULT_FALLBACK_VERSION;
}

function resolveDownloadUrl(version: string): string {
  const envUrl = env("VITE_POS_WINDOWS_URL");
  if (envUrl) return envUrl;
  return buildInstallerRelativePath(version);
}

function parseOptionalInt(raw: string): number | null {
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Full POS release configuration for portal surfaces. */
export function getPosReleaseConfig(): PosReleaseConfig {
  const latestVersion = resolveLatestVersion();
  const downloadUrl = resolveDownloadUrl(latestVersion);
  const webPlanned = env("VITE_POS_WEB_URL") || "https://pos.caisty.com";
  const webEnabled = envBool("VITE_POS_WEB_ENABLED");
  const protocol = env("VITE_POS_DESKTOP_PROTOCOL") || DEFAULT_DESKTOP_PROTOCOL;

  return {
    latestVersion,
    releaseDate: env("VITE_POS_RELEASE_DATE") || null,
    releaseNotesUrl: env("VITE_POS_RELEASE_NOTES_URL") || null,
    releaseNotesSummary: env("VITE_POS_RELEASE_NOTES_SUMMARY") || null,
    installer: {
      platform: env("VITE_POS_INSTALLER_PLATFORM") || DEFAULT_PLATFORM,
      fileName: buildInstallerFileName(latestVersion),
      downloadUrl,
      sizeBytes: parseOptionalInt(env("VITE_POS_INSTALLER_SIZE_BYTES")),
      sha256: env("VITE_POS_INSTALLER_SHA256") || null,
    },
    web: {
      enabled: webEnabled,
      url: webEnabled ? webPlanned : null,
      plannedUrl: webPlanned,
    },
    desktop: {
      protocol,
      openUrl: `${protocol}://open`,
    },
  };
}

/** @deprecated Use getPosReleaseConfig().latestVersion */
export function getPosLatestVersion(): string {
  return getPosReleaseConfig().latestVersion;
}

/** @deprecated Use getPosReleaseConfig().installer.downloadUrl */
export function getPosWindowsDownloadUrl(): string | null {
  const url = getPosReleaseConfig().installer.downloadUrl;
  return url || null;
}

export function isPosDownloadConfigured(): boolean {
  return Boolean(getPosWindowsDownloadUrl());
}

/** @deprecated Use getPosReleaseConfig().web.plannedUrl */
export function getPosWebUrlTarget(): string {
  return getPosReleaseConfig().web.plannedUrl;
}

/** @deprecated Use getPosReleaseConfig().web.enabled */
export function isPosWebEnabled(): boolean {
  return getPosReleaseConfig().web.enabled;
}

/** @deprecated Use getPosReleaseConfig().web.url */
export function getPosWebUrl(): string | null {
  return getPosReleaseConfig().web.url;
}

/** Portal deployment environment label (production / staging / development). */
export function getPortalEnvironmentLabel(): string {
  const explicit = env("VITE_PORTAL_ENV");
  if (explicit) return explicit;
  if (import.meta.env.DEV) return "development";
  if (import.meta.env.MODE === "staging") return "staging";
  return "production";
}
