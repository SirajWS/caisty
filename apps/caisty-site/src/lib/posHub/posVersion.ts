/** Semantic version tuple for POS release comparison. */
export type SemverParts = [major: number, minor: number, patch: number];

export function parseSemver(version: string): SemverParts | null {
  const trimmed = version.trim().replace(/^v/i, "");
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(trimmed);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

export function compareSemver(a: string, b: string): -1 | 0 | 1 {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa && !pb) return 0;
  if (!pa) return -1;
  if (!pb) return 1;
  for (let i = 0; i < 3; i += 1) {
    if (pa[i] < pb[i]) return -1;
    if (pa[i] > pb[i]) return 1;
  }
  return 0;
}

export function isUpdateAvailable(
  installed: string | null | undefined,
  latest: string,
): boolean {
  if (!installed?.trim()) return false;
  return compareSemver(installed, latest) < 0;
}

export function pickHighestSemver(
  versions: readonly (string | null | undefined)[],
): string | null {
  let best: string | null = null;
  for (const v of versions) {
    const trimmed = v?.trim();
    if (!trimmed || !parseSemver(trimmed)) continue;
    if (!best || compareSemver(trimmed, best) > 0) best = trimmed;
  }
  return best;
}
