import { afterEach, describe, expect, it, vi } from "vitest";
import { getPosReleaseConfig } from "./posConfig";

const POS_WINDOWS_URL =
  "https://www.caisty.com/downloads/Caisty.PoS_0.3.3_x64-setup.exe";

describe("getPosReleaseConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("derives version and file name from VITE_POS_WINDOWS_URL", () => {
    vi.stubEnv("VITE_POS_WINDOWS_URL", POS_WINDOWS_URL);

    const release = getPosReleaseConfig();

    expect(release.latestVersion).toBe("0.3.3");
    expect(release.installer.fileName).toBe("Caisty.PoS_0.3.3_x64-setup.exe");
    expect(release.installer.downloadUrl).toBe(POS_WINDOWS_URL);
  });

  it("Open Caisty Web uses local Caisty-Pos URL on port 5177", () => {
    vi.stubEnv("VITE_POS_WEB_ENABLED", "true");
    vi.stubEnv("VITE_POS_WEB_URL", "http://localhost:5177/pos");

    const release = getPosReleaseConfig();

    expect(release.web.enabled).toBe(true);
    expect(release.web.url).toBe("http://localhost:5177/pos");
    expect(release.web.plannedUrl).toBe("http://localhost:5177/pos");
    expect(release.web.url).not.toContain(":5176");
    expect(release.web.url).not.toContain(":5174");
  });
});
