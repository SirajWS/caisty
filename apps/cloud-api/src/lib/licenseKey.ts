// apps/api/src/lib/licenseKey.ts

// Zeichenvorrat für License-Keys – ohne 0/O/1/I um Verwechslungen zu vermeiden.
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
 * Erzeugt einen License-Key wie z.B.:
 *   CSTY-ABCD-EFGH-JKLM
 *
 * Parameter:
 *  - prefix: z.B. "CSTY" oder "TEST"
 *  - groups: Anzahl der Blöcke nach dem Prefix (Default 3 → 3x4 Zeichen)
 *  - groupLength: Länge der einzelnen Blöcke (Default 4)
 */
export function generateLicenseKey(
  prefix = "CSTY",
  groups = 3,
  groupLength = 4,
): string {
  const parts: string[] = [];
  for (let i = 0; i < groups; i++) {
    parts.push(randomChunk(groupLength));
  }
  return `${prefix}-${parts.join("-")}`;
}

/**
 * Alias für bestehenden Code – falls irgendwo noch createLicenseKey
 * verwendet wird, bleibt die Signatur kompatibel.
 */
export function createLicenseKey(
  prefix = "CSTY",
  groups = 3,
  groupLength = 4,
): string {
  return generateLicenseKey(prefix, groups, groupLength);
}
