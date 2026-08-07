import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const componentsDir = dirname(fileURLToPath(import.meta.url));

describe("portal channel webhook UI contract", () => {
  it("does not render webhook path UI in ChannelFormDialog", () => {
    const src = readFileSync(join(componentsDir, "ChannelFormDialog.tsx"), "utf8");
    expect(src).not.toContain("portal-channel-webhook-path");
    expect(src).not.toContain("onCopyWebhook");
    expect(src).not.toContain("/webhooks/channels/");
  });

  it("does not expose webhook path UI in PortalChannelsPage", () => {
    const src = readFileSync(join(componentsDir, "../../routes/PortalChannelsPage.tsx"), "utf8");
    expect(src).not.toContain("buildWebhookPath");
    expect(src).not.toContain("webhookPath");
    expect(src).not.toContain("/webhooks/channels/");
  });
});
