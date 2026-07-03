# Legal Pages — Phases 2–6

**Date:** July 3, 2026  
**Scope:** Internationalization and layout unification of all remaining legal pages, following Phase 1 (Terms & Conditions) as the single reference standard.

---

## Fertiggestellt

| Phase | Page | Route | Status |
|-------|------|-------|--------|
| 1 (ref) | Terms & Conditions | `/legal/terms-and-conditions` | Updated to shared infrastructure |
| 2 | Privacy Policy | `/legal/privacy-policy` | ✅ DE / EN / FR / AR |
| 3 | Cookie Policy | `/legal/cookie-policy` | ✅ DE / EN / FR / AR |
| 4 | End User License Agreement (EULA) | `/legal/eula` | ✅ DE / EN / FR / AR |
| 5 | Data Processing Agreement (DPA / AVV) | `/legal/dpa` | ✅ DE / EN / FR / AR |
| 6 | Imprint | `/imprint` | ✅ DE / EN / FR / AR |
| Optional | Subprocessors | `/legal/subprocessors` | ✅ DE / EN / FR / AR |

All pages use the same layout, hero, contact card, related documents section, and i18n wiring.

---

## Geänderte Dateien

### Shared infrastructure

| File | Change |
|------|--------|
| `src/components/LegalPageShell.tsx` | Version line support, shared link types |
| `src/components/LegalPageContent.tsx` | Subsections, notices, tables, cookie button, unified contact + related docs |
| `src/components/LegalDocumentPage.tsx` | **New** — generic renderer for all legal pages |
| `src/lib/translations/legal/shared/types.ts` | **New** — `LegalDocumentCopy`, sections, contact |
| `src/lib/translations/legal/shared/labels.ts` | **New** — link + related labels (incl. Terms, Subprocessors) |
| `src/lib/translations/legal/shared/contact.ts` | **New** — unified contact card (info@, support@, privacy@, tax ID) |
| `src/index.css` | Subsection, notice, table, cookie-button styles |
| `src/lib/translations/index.ts` | Wired all `legal.*` locales |

### Route pages (thin wrappers)

| File |
|------|
| `src/routes/TermsPage.tsx` |
| `src/routes/PrivacyPage.tsx` |
| `src/routes/CookiePolicyPage.tsx` |
| `src/routes/EulaPage.tsx` |
| `src/routes/DpaPage.tsx` |
| `src/routes/ImprintPage.tsx` |
| `src/routes/SubprocessorsPage.tsx` |

### Terms (Phase 1 alignment)

| File | Change |
|------|--------|
| `src/lib/translations/legal/terms/types.ts` | Re-exports `LegalDocumentCopy` |
| `src/lib/translations/legal/terms/de.ts` | Shared contact/labels, no owner in card |
| `src/lib/translations/legal/terms/en.ts` | Same |
| `src/lib/translations/legal/terms/fr.ts` | Same |
| `src/lib/translations/legal/terms/ar.ts` | Same |

---

## Neue Translation-Dateien

```
src/lib/translations/legal/
├── shared/
│   ├── types.ts
│   ├── labels.ts
│   └── contact.ts
├── privacy/     types.ts, de.ts, en.ts, fr.ts, ar.ts, index.ts
├── cookie/      types.ts, de.ts, en.ts, fr.ts, ar.ts, index.ts
├── eula/        types.ts, de.ts, en.ts, fr.ts, ar.ts, index.ts
├── dpa/         types.ts, de.ts, en.ts, fr.ts, ar.ts, index.ts
├── imprint/     types.ts, de.ts, en.ts, fr.ts, ar.ts, index.ts
└── subprocessors/ types.ts, de.ts, en.ts, fr.ts, ar.ts, index.ts
```

**45 translation files** under `legal/` (including shared and updated terms).

---

## Wiederverwendete Komponenten

| Component | Role |
|-----------|------|
| `LegalPageShell` | Hero (badge, title, date, version, intro) |
| `LegalPageContent` | Rich text, sections, subsections, contact card, related docs |
| `LegalDocumentPage` | Page glue: language → copy → shell |
| `LegalDocumentLink` | Internal legal links (new tab) |

### Design tokens

- `marketing-site` / `marketing-site--dark`
- `mkt-legal-*` (hero, prose, sections, subsections, card, related grid, notice, table)

### Unified behaviour

- **Contact card:** Caisty, Berlin, info@ / support@ / privacy@, DE463279361
- **Owner name:** only on Imprint (`showOwnerInContact: true`)
- **Related documents order:** Terms → Privacy → Cookie → EULA → DPA → Imprint → Subprocessors (hidden on Subprocessors page itself)
- **RTL:** Arabic via existing `LanguageContext`
- **Cookie preferences:** button on Cookie Policy section 6 (`openCookiePreferences`)

---

## Build Status

```text
pnpm build  (apps/caisty-site)  ✓  success
```

TypeScript check and Vite production build completed without errors.

**Note:** Vite reports the main bundle is >500 KB (legal copy is imported via the central `translations` index). Browserslist baseline data is outdated in devDependencies — cosmetic tooling warning only.

---

## Offene Punkte

| Item | Notes |
|------|--------|
| Juristische Prüfung | EN/FR/AR Übersetzungen vor Produktionsfreigabe durch Anwalt prüfen lassen |
| Bundle size | Legal texts in main chunk (~775 KB JS); optional später lazy-load pro Dokument |
| Subprocessors | Vorläufige Liste mit Hinweisbox — verbindliche Liste noch ausstehend |
| SEO meta | Pro Legal-Route noch keine lokalisierten `meta description` / OG tags |
| Footer | Subprocessors weiterhin nicht im Site-Footer verlinkt (nur Related Documents + DPA-Verweis) |
| Imprint Doppelung | Imprint hat Kontakt in Section 2 und Contact Card am Ende — bewusst konsistent mit Phase-1-Muster |

---

## Qualität

- Kein neues Design — exakt Phase-1-Standard
- Keine gemischten Sprachen pro Seite
- Keine Fallbacks auf Deutsch
- EULA/DPA: collapsible Altlayout entfernt, Inhalt als nummerierte Sections/Subsections
- Alle Seiten visuell und strukturell aus einem Guss
