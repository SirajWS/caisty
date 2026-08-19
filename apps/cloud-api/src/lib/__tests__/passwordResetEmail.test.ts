import { describe, expect, it } from "vitest";

import {
  CAISTY_BRAND_ORANGE,
  CAISTY_EMAIL_LOGO_URL,
  buildPasswordResetEmail,
} from "../email.js";

/** Fake local reset URL — never a production token. */
const FAKE_RESET_LINK =
  "http://localhost:5173/reset-password?token=test-token-not-real-00000000";

describe("buildPasswordResetEmail", () => {
  const { subject, html, text } = buildPasswordResetEmail(FAKE_RESET_LINK);

  it("uses Caisty branding in the subject (not Caisty Portal)", () => {
    expect(subject).toBe("Reset your Caisty password");
    expect(subject.toLowerCase()).not.toContain("portal");
  });

  it("includes Caisty wordmark and no Caisty Portal branding", () => {
    expect(html).toMatch(/>Caisty</);
    expect(html).not.toMatch(/Caisty Portal/i);
    expect(text).not.toMatch(/Caisty Portal/i);
  });

  it("uses official orange and no legacy green brand colors", () => {
    expect(CAISTY_BRAND_ORANGE).toBe("#ea580c");
    expect(html).toContain(CAISTY_BRAND_ORANGE);
    expect(html).not.toMatch(/#10b981/i);
    expect(html).not.toMatch(/#059669/i);
  });

  it("includes HTTPS logo with alt text", () => {
    expect(CAISTY_EMAIL_LOGO_URL.startsWith("https://")).toBe(true);
    expect(html).toContain(`src="${CAISTY_EMAIL_LOGO_URL}"`);
    expect(html).toContain('alt="Caisty"');
  });

  it("uses the dynamic reset link for CTA and visible fallback", () => {
    const hrefMatches = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    const resetHrefs = hrefMatches.filter((h) => h.includes("reset-password"));
    expect(resetHrefs.length).toBeGreaterThanOrEqual(2);
    expect(resetHrefs.every((h) => h === FAKE_RESET_LINK)).toBe(true);
    expect(html).toContain(`>${FAKE_RESET_LINK}</a>`);
  });

  it("mentions expiry, one-time use, and security note", () => {
    expect(html).toMatch(/valid for 1 hour/i);
    expect(html).toMatch(/only be used once/i);
    expect(html).toMatch(/Security note/i);
    expect(html).toMatch(/did not request a password reset/i);
  });

  it("includes preheader and table-based layout cues", () => {
    expect(html).toContain("Reset your Caisty password securely.");
    expect(html).toContain('role="presentation"');
    expect(html).toContain("Reset password");
  });

  it("plain text includes the reset link and key notices", () => {
    expect(text).toContain(FAKE_RESET_LINK);
    expect(text).toMatch(/1 hour/i);
    expect(text).toMatch(/only be used once/i);
    expect(text).toMatch(/Security note/i);
    expect(text).not.toContain("<");
  });

  it("HTML-escapes special characters in the reset link", () => {
    const awkward =
      'http://localhost:5173/reset-password?token=a&b=<c>"d\'';
    const { html: escapedHtml } = buildPasswordResetEmail(awkward);
    expect(escapedHtml).toContain("a&amp;b=&lt;c&gt;&quot;d&#39;");
    expect(escapedHtml).not.toContain('href="http://localhost:5173/reset-password?token=a&b=<c>"');
  });
});
