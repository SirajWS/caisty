// apps/cloud-api/src/lib/licenseKey.ts

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // ohne 0,1,O,I

function randomBlock(length = 4) {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    const idx = Math.floor(Math.random() * ALPHABET.length);
    out += ALPHABET[idx];
  }
  return out;
}

/**
 * Generiert einen License-Key wie:
 * CSTY-KW8Z-BSM3-Y6KN
 */
export function generateLicenseKey(prefix = "CSTY") {
  return [
    prefix,
    randomBlock(4),
    randomBlock(4),
    randomBlock(4),
  ].join("-");
}
