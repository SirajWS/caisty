/**
 * Resolve organization id for POS device responses from server-side records only.
 */

function normalizeOrgId(value: unknown): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null") {
    return null;
  }
  return trimmed;
}

/**
 * Returns orgId only when device and license organizations are present and match.
 * Used for successful active, approved device flows (bind, verify, config, heartbeat).
 */
export function resolveConsistentDeviceOrgId(input: {
  deviceOrgId?: unknown;
  licenseOrgId?: unknown;
}): string | null {
  const deviceOrg = normalizeOrgId(input.deviceOrgId);
  const licenseOrg = normalizeOrgId(input.licenseOrgId);

  if (!deviceOrg || !licenseOrg) {
    return null;
  }

  if (deviceOrg !== licenseOrg) {
    return null;
  }

  return deviceOrg;
}

/** @deprecated Prefer resolveConsistentDeviceOrgId for active device responses. */
export function resolvePosOrgId(input: {
  deviceOrgId?: string | null;
  licenseOrgId?: string | null;
}): string | null {
  return resolveConsistentDeviceOrgId(input);
}
