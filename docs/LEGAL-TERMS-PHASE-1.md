# Legal Terms — Phase 1

**Date:** July 3, 2026  
**Scope:** Terms & Conditions (`/legal/terms-and-conditions`) — production-ready i18n, layout, and copy polish.

---

## Summary

The Terms page was migrated from a German-only hardcoded component to a fully internationalized legal document with modern marketing-site layout. All 15 sections were preserved in substance; copy was polished for grammar, flow, and consistency. Four languages are supported end-to-end with no mixed-language fallbacks.

---

## Changed files

| File | Change |
|------|--------|
| `apps/caisty-site/src/routes/TermsPage.tsx` | Rewritten to use i18n + new legal layout components |
| `apps/caisty-site/src/components/LegalPageShell.tsx` | **New** — hero, meta, document title, marketing wrapper |
| `apps/caisty-site/src/components/LegalPageContent.tsx` | **New** — rich text (links, emphasis, emails), sections, contact card, related docs |
| `apps/caisty-site/src/lib/translations/legal/terms/types.ts` | **New** — `TermsCopy` schema |
| `apps/caisty-site/src/lib/translations/legal/terms/de.ts` | **New** — German master copy (polished) |
| `apps/caisty-site/src/lib/translations/legal/terms/en.ts` | **New** — English |
| `apps/caisty-site/src/lib/translations/legal/terms/fr.ts` | **New** — French |
| `apps/caisty-site/src/lib/translations/legal/terms/ar.ts` | **New** — Arabic (MSA, RTL via existing `LanguageContext`) |
| `apps/caisty-site/src/lib/translations/legal/terms/index.ts` | **New** — locale exports |
| `apps/caisty-site/src/lib/translations/index.ts` | Wired `legal.terms` into main translation tree |
| `apps/caisty-site/src/index.css` | Added `.mkt-legal-*` typography and related-documents styles |

---

## i18n

| Language | Status |
|----------|--------|
| Deutsch (DE) | Master version — juristisch unverändert, sprachlich überarbeitet |
| English (EN) | SaaS business English, nicht wörtlich |
| Français (FR) | Professionelles Business-Französisch |
| العربية (AR) | Modern Standard Arabic, RTL über `LanguageContext` |

- Integrated with existing `useLanguage()` / `translations[language].legal.terms`
- Inline links (`{{privacy}}`, `{{eula}}`, etc.), emphasis (`{{licensedNotSold}}`, `{{commercialEfforts}}`), and `{{supportEmail}}` resolved at render time
- No German fallbacks when another language is selected

---

## Layout

- Uses existing `marketing-site` design tokens (`--mkt-*`)
- Hero: eyebrow label, title, last updated date, intro paragraph
- Body: max-width ~42rem, numbered sections, lists, contact card
- Related documents grid at page bottom (Privacy, Cookie, EULA, DPA, Imprint)
- Light and dark mode via `marketing-site--dark`
- Responsive; Arabic list padding uses logical `padding-inline-start`

---

## Content principles (verified)

- **Not shortened** — all 15 sections retained
- **No new legal obligations** — liability, pricing, termination, jurisdiction unchanged in substance
- **Germany remains governing law** — Section 14 unchanged in legal effect
- **Company data** — only data already in the document (Siraj Bettaieb, Berlin address, info@ / support@, DE463279361)

---

## Build

```text
pnpm build  (apps/caisty-site)  ✓  success
```

TypeScript check and Vite production build completed without errors.

---

## Open points

| Item | Notes |
|------|--------|
| Other legal pages | Privacy, Cookie, EULA, DPA, Imprint, Subprocessors still DE-only — Phase 2+ |
| Related doc targets | Linked pages open in new tab (existing `LegalDocumentLink` behaviour); destination content may still be German until those pages are i18n’d |
| Subprocessors | Not listed in Related Documents (per spec); route `/legal/subprocessors` still exists but unlinked |
| SEO meta | Page sets `document.title` per language; dedicated meta description / OG tags for legal routes not yet added |
| Bundle size | Terms copy is imported via main `translations` index (not lazy-loaded); acceptable for Phase 1; consider lazy legal chunks if more documents are added |
| Legal review | Copy was polished for clarity; formal legal review by counsel recommended before treating translations as binding in non-DE markets |

---

## Route

`/legal/terms-and-conditions` — unchanged path, footer links continue to work.
