import { afterEach, describe, expect, it, vi } from "vitest";
import { getPosReleaseConfig } from "./posConfig";

const POS_WINDOWS_URL =
  "https://www.caisty.com/downloads/Caisty.PoS_0.3.4_x64-setup.exe";

describe("getPosReleaseConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("derives version and file name from VITE_POS_WINDOWS_URL", () => {
    vi.stubEnv("VITE_POS_WINDOWS_URL", POS_WINDOWS_URL);

    const release = getPosReleaseConfig();

    expect(release.latestVersion).toBe("0.3.4");
    expect(release.installer.fileName).toBe("Caisty.PoS_0.3.4_x64-setup.exe");
    expect(release.installer.downloadUrl).toBe(POS_WINDOWS_URL);
  });
});
