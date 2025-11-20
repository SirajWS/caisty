// apps/cloud-api/src/lib/licenseKey.ts

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // ohne 0/O/1/I

function randomChunk(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * CHARS.length);
    out += CHARS[idx];
  }
  return out;
}

/**
 * Erzeugt einen License-Key wie:
 *   CSTY-ABCD-EFGH-JKLM
 */
export function generateLicenseKey(
  prefix = "CSTY",
  groups = 3,
  groupLength = 4,
): string {
  const parts = [];
  for (let i = 0; i < groups; i++) {
    parts.push(randomChunk(groupLength));
  }
  return `${prefix}-${parts.join("-")}`;
}
