import { afterEach, describe, expect, it, vi } from "vitest";
import { getPosReleaseConfig } from "./posConfig";

describe("getPosReleaseConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("derives version and file name from VITE_POS_WINDOWS_URL", () => {
    vi.stubEnv(
      "VITE_POS_WINDOWS_URL",
      "https://www.caisty.com/downloads/Caisty.PoS_0.3.1_x64-setup.exe",
    );

    const release = getPosReleaseConfig();

    expect(release.latestVersion).toBe("0.3.1");
    expect(release.installer.fileName).toBe("Caisty.PoS_0.3.1_x64-setup.exe");
    expect(release.installer.downloadUrl).toBe(
      "https://www.caisty.com/downloads/Caisty.PoS_0.3.1_x64-setup.exe",
    );
  });
});
