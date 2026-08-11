import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { portalAr, portalDe, portalEn, portalFr } from "../translations/portal";

const cssPath = resolve(dirname(fileURLToPath(import.meta.url)), "../../index.css");
const css = readFileSync(cssPath, "utf8");

function extractMediaBlock(cssText: string, start: number): string {
  let i = cssText.indexOf("{", start);
  expect(i).toBeGreaterThan(start);
  let depth = 0;
  for (; i < cssText.length; i += 1) {
    const ch = cssText[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return cssText.slice(start, i + 1);
      }
    }
  }
  throw new Error("Unclosed media query");
}

function mediaBlocks(cssText: string, query: string): string[] {
  const marker = `@media (${query})`;
  const blocks: string[] = [];
  let from = 0;
  while (from < cssText.length) {
    const start = cssText.indexOf(marker, from);
    if (start < 0) break;
    const block = extractMediaBlock(cssText, start);
    blocks.push(block);
    from = start + block.length;
  }
  expect(blocks.length, `missing media query ${marker}`).toBeGreaterThan(0);
  return blocks;
}

function mediaBlockContaining(cssText: string, query: string, needle: string): string {
  const match = mediaBlocks(cssText, query).find((block) => block.includes(needle));
  expect(match, `no @media (${query}) containing ${needle}`).toBeTruthy();
  return match!;
}

describe("portal mobile phase 1 — channel dialog", () => {
  const mobile = mediaBlockContaining(css, "max-width: 640px", ".portal-channel-dialog-root");

  it("covers common phone widths under the 640px breakpoint", () => {
    for (const width of [320, 390, 430] as const) {
      expect(width).toBeLessThanOrEqual(640);
    }
    expect(mobile).toContain(".portal-channel-dialog-root");
    expect(mobile).toContain(".portal-channel-dialog-footer");
  });

  it("uses dynamic viewport height and visual-viewport CSS variables", () => {
    expect(mobile).toContain("100dvh");
    expect(mobile).toContain("var(--portal-channel-vvh");
    expect(mobile).toContain("var(--portal-channel-vv-offset");
    expect(css).toContain("--portal-channel-vvh");
  });

  it("keeps header/footer sticky and only the body scrollable on mobile", () => {
    expect(mobile).toMatch(
      /\.portal-channel-dialog-header\s*\{[^}]*position:\s*sticky/s,
    );
    expect(mobile).toMatch(
      /\.portal-channel-dialog-footer\s*\{[^}]*position:\s*sticky/s,
    );
    expect(mobile).toMatch(
      /\.portal-channel-dialog-body\s*\{[^}]*overflow-y:\s*auto/s,
    );
    expect(mobile).toContain("overscroll-behavior: contain");
    expect(mobile).toContain("scroll-padding-bottom");
  });

  it("accounts for iOS/Android safe areas on mobile sheet chrome", () => {
    expect(mobile).toContain("env(safe-area-inset-top");
    expect(mobile).toContain("env(safe-area-inset-bottom");
    expect(mobile).toContain("env(safe-area-inset-left");
    expect(mobile).toContain("env(safe-area-inset-right");
  });

  it("presents as a full-height bottom sheet on small viewports", () => {
    expect(mobile).toMatch(
      /\.portal-channel-dialog-root\s*\{[^}]*justify-content:\s*flex-end/s,
    );
    expect(mobile).toMatch(
      /\.portal-channel-dialog\s*\{[^}]*height:\s*100%/s,
    );
    expect(mobile).toContain("border-radius: 1rem 1rem 0 0");
  });

  it("leaves desktop dialog sizing intact outside the mobile breakpoint", () => {
    const desktopDialog = css.match(
      /\.portal-channel-dialog\s*\{[^}]*max-height:\s*min\(90vh,\s*52rem\)[^}]*\}/s,
    );
    expect(desktopDialog).not.toBeNull();
    expect(desktopDialog![0]).not.toContain("100dvh");
  });
});

describe("portal mobile phase 1 — RTL/LTR drawer", () => {
  const drawerMedia = mediaBlockContaining(css, "max-width: 1024px", ".portal-sidebar");

  it("opens the mobile drawer from the inline-start edge (left in LTR, right in RTL)", () => {
    expect(drawerMedia).toMatch(
      /\.portal-sidebar\s*\{[^}]*inset-inline-start:\s*-280px/s,
    );
    expect(drawerMedia).toMatch(
      /\.portal-sidebar\.is-open\s*\{[^}]*inset-inline-start:\s*0/s,
    );
    expect(drawerMedia).not.toMatch(/\.portal-sidebar\s*\{[^}]*\bleft:\s*-280px/s);
    expect(drawerMedia).not.toMatch(/\.portal-sidebar\.is-open\s*\{[^}]*\bleft:\s*0/s);
  });

  it("uses logical border/margin for sidebar chrome and drawer close control", () => {
    expect(css).toMatch(
      /\.portal-sidebar\s*\{[^}]*border-inline-end:\s*1px\s+solid/s,
    );
    expect(css).toMatch(
      /\.portal-drawer-close\s*\{[^}]*margin-inline-start:\s*auto/s,
    );
    expect(css).toMatch(
      /\.portal-topbar-right\s*\{[^}]*margin-inline-start:\s*auto/s,
    );
  });

  it("keeps backdrop full-viewport and animated independently of writing mode", () => {
    expect(drawerMedia).toMatch(/\.portal-backdrop\s*\{[^}]*inset:\s*0/s);
    expect(drawerMedia).toContain("transition: opacity 0.2s");
    expect(drawerMedia).toContain("transition: inset-inline-start 0.2s ease");
  });

  it("keeps the mobile brand header compact with wrapping title and visible close control", () => {
    expect(drawerMedia).toMatch(
      /\.portal-brand\s*\{[^}]*align-items:\s*flex-start/s,
    );
    expect(drawerMedia).toMatch(/\.portal-brand\s*\{[^}]*gap:\s*8px/s);
    expect(drawerMedia).toMatch(/\.portal-brand\s*\{[^}]*padding:\s*12px/s);
    expect(drawerMedia).toMatch(
      /\.portal-brand-copy\s*\{[^}]*min-width:\s*0/s,
    );
    expect(drawerMedia).toMatch(
      /\.portal-brand-main\s*\{[^}]*overflow-wrap:\s*anywhere/s,
    );
    expect(drawerMedia).toMatch(
      /\.portal-drawer-close\s*\{[^}]*flex-shrink:\s*0/s,
    );
    expect(drawerMedia).toMatch(
      /\.portal-drawer-close\s*\{[^}]*align-self:\s*flex-start/s,
    );
  });
});

describe("portal brand copy — business portal", () => {
  it("uses Caisty Business Portal title in all portal languages", () => {
    for (const portal of [portalEn, portalDe, portalFr, portalAr]) {
      expect(portal.layout.taglineTitle).toBe("Caisty Business Portal");
      expect(portal.layout.taglineSubtitle.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("portal mobile — POS summary card", () => {
  const summaryMobile = mediaBlockContaining(css, "max-width: 640px", ".pos-summary-bar");
  const summaryNarrow = mediaBlockContaining(css, "max-width: 360px", ".pos-summary-mid");

  it("stacks title, 2×2 status grid, and full-width CTA under 640px", () => {
    expect(summaryMobile).toMatch(
      /\.pos-summary-bar\s*\{[^}]*flex-direction:\s*column/s,
    );
    expect(summaryMobile).toMatch(
      /\.pos-summary-mid\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s,
    );
    expect(summaryMobile).toMatch(
      /\.pos-summary-cta\s*\{[^}]*width:\s*100%/s,
    );
    expect(summaryMobile).toMatch(
      /\.pos-summary-right\s*\{[^}]*margin-inline-start:\s*0/s,
    );
    expect(summaryMobile).toMatch(
      /\.pos-summary-label,\s*\.pos-summary-value,\s*\.pos-summary-link\s*\{[^}]*white-space:\s*nowrap/s,
    );
  });

  it("collapses the status grid to one column on very narrow phones", () => {
    expect(summaryNarrow).toMatch(
      /\.pos-summary-mid\s*\{[^}]*grid-template-columns:\s*1fr/s,
    );
  });

  it("does not force the summary bar into a column layout on desktop rules", () => {
    expect(css).toMatch(
      /\.pos-summary-bar\s*\{[^}]*display:\s*flex[^}]*flex-wrap:\s*wrap/s,
    );
    const desktopBar = css.match(/\.pos-summary-bar\s*\{[^}]*\}/s)?.[0] ?? "";
    expect(desktopBar).not.toContain("flex-direction: column");
  });
});
