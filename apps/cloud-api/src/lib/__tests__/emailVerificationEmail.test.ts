import { describe, expect, it } from "vitest";

import {
  CAISTY_BRAND_ORANGE,
  CAISTY_EMAIL_LOGO_URL,
  buildEmailVerificationEmail,
} from "../email.js";

/** Fake local verify URL — never a production token. */
const FAKE_VERIFY_LINK =
  "http://localhost:5173/verify-email?token=test-verify-token-not-real-1111";

describe("buildEmailVerificationEmail", () => {
  const { subject, html, text } = buildEmailVerificationEmail(FAKE_VERIFY_LINK);

  it("uses Caisty branding in the subject (not Caisty Portal)", () => {
    expect(subject).toBe("Verify your Caisty email address");
    expect(subject.toLowerCase()).not.toContain("portal");
  });

  it("uses official orange and no legacy green brand colors", () => {
    expect(CAISTY_BRAND_ORANGE).toBe("#ea580c");
    expect(html).toContain(CAISTY_BRAND_ORANGE);
    expect(html).not.toMatch(/#10b981/i);
    expect(html).not.toMatch(/#059669/i);
  });

  it("includes HTTPS logo, brand wordmark, and no Caisty Portal branding", () => {
    expect(CAISTY_EMAIL_LOGO_URL.startsWith("https://")).toBe(true);
    expect(html).toContain(`src="${CAISTY_EMAIL_LOGO_URL}"`);
    expect(html).toContain('alt="Caisty"');
    expect(html).toMatch(/>Caisty</);
    expect(html).not.toMatch(/Caisty Portal/i);
    expect(text).not.toMatch(/Caisty Portal/i);
  });

  it("uses the dynamic verify link for CTA and visible fallback", () => {
    const hrefMatches = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    const verifyHrefs = hrefMatches.filter((h) => h.includes("verify-email"));
    expect(verifyHrefs.length).toBeGreaterThanOrEqual(2);
    expect(verifyHrefs.every((h) => h === FAKE_VERIFY_LINK)).toBe(true);
    expect(html).toContain(`>${FAKE_VERIFY_LINK}</a>`);
    expect(html).toContain("Verify email");
  });

  it("mentions 24-hour expiry and security note", () => {
    expect(html).toMatch(/valid for 24 hours/i);
    expect(html).toMatch(/Security note/i);
    expect(html).toMatch(/did not create a Caisty account/i);
  });

  it("includes preheader and table-based layout cues", () => {
    expect(html).toContain("Confirm your email to activate your Caisty account.");
    expect(html).toContain('role="presentation"');
    expect(html).toContain("Verify your email");
  });

  it("plain text includes the verify link and key notices", () => {
    expect(text).toContain(FAKE_VERIFY_LINK);
    expect(text).toMatch(/24 hours/i);
    expect(text).toMatch(/Security note/i);
    expect(text).not.toContain("<");
  });

  it("HTML-escapes special characters in the verify link", () => {
    const awkward =
      'http://localhost:5173/verify-email?token=a&b=<c>"d\'';
    const { html: escapedHtml } = buildEmailVerificationEmail(awkward);
    expect(escapedHtml).toContain("a&amp;b=&lt;c&gt;&quot;d&#39;");
    expect(escapedHtml).not.toContain(
      'href="http://localhost:5173/verify-email?token=a&b=<c>"',
    );
  });
});
