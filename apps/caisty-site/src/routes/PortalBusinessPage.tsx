// apps/caisty-site/src/routes/PortalBusinessPage.tsx
import React from "react";
import { Download, Info } from "lucide-react";
import {
  fetchPortalBusiness,
  updatePortalBusiness,
  type PortalBusinessProfile,
} from "../lib/portalApi";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import {
  portalCardShell,
  portalInputClass,
  portalPrimaryCta,
  portalSectionLabel,
} from "../lib/portalUi";
import {
  BUSINESS_COUNTRY_OPTIONS,
  BUSINESS_LANGUAGE_OPTIONS,
  currenciesForCountry,
  getPosLatestVersion,
  getPosWindowsDownloadUrl,
  isPosDownloadConfigured,
} from "../config/businessCountries";
import {
  previewFiscalConfigurationLabel,
  previewFiscalNotice,
  previewFiscalProviderKey,
  previewFiscalStatus,
  previewReceiptMode,
} from "../lib/businessDisplay";
import {
  mapPortalApiError,
} from "../lib/caistyTerminology";

function statusBadgeClass(status: string, isLight: boolean): string {
  const base =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium";
  const s = status.toLowerCase();
  if (
    s === "active" ||
    s === "ready" ||
    s === "not_required" ||
    s === "download_available"
  ) {
    return `${base} ${
      isLight
        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
        : "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
    }`;
  }
  if (
    s === "pending_setup" ||
    s === "required" ||
    s === "required_coming_soon" ||
    s === "incomplete" ||
    s === "not_ready"
  ) {
    return `${base} ${
      isLight
        ? "border-amber-300 bg-amber-50 text-amber-900"
        : "border-amber-500/40 bg-amber-500/15 text-amber-200"
    }`;
  }
  if (s === "error" || s === "action_required") {
    return `${base} ${
      isLight
        ? "border-rose-300 bg-rose-50 text-rose-800"
        : "border-rose-500/40 bg-rose-500/10 text-rose-300"
    }`;
  }
  return `${base} ${
    isLight
      ? "border-slate-200 bg-slate-100 text-slate-700"
      : "border-white/10 bg-slate-800/80 text-slate-300"
  }`;
}

const PortalBusinessPage: React.FC = () => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const b = t.business;
  const isLight = theme === "light";

  const [profile, setProfile] = React.useState<PortalBusinessProfile | null>(
    null,
  );
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const [companyName, setCompanyName] = React.useState("");
  const [legalName, setLegalName] = React.useState("");
  const [country, setCountry] = React.useState("");
  const [currency, setCurrency] = React.useState("EUR");
  const [defaultLanguage, setDefaultLanguage] = React.useState("en");
  const [street, setStreet] = React.useState("");
  const [city, setCity] = React.useState("");
  const [zip, setZip] = React.useState("");
  const [vatId, setVatId] = React.useState("");
  const [taxId, setTaxId] = React.useState("");

  function applyProfileToForm(p: PortalBusinessProfile) {
    setCompanyName(p.companyName);
    setLegalName(p.legalName);
    setCountry(p.country ?? "");
    setCurrency(p.currency);
    setDefaultLanguage(p.defaultLanguage);
    setStreet(p.businessAddress.street ?? "");
    setCity(p.businessAddress.city ?? "");
    setZip(p.businessAddress.zip ?? "");
    setVatId(p.vatId);
    setTaxId(p.taxId);
  }

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchPortalBusiness();
        if (cancelled) return;
        setProfile(data);
        applyProfileToForm(data);
      } catch (err) {
        if (!cancelled) {
          setError(mapPortalApiError(err, {
            default: b.loadError,
            businessMissing: b.loadError,
          }));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [b.loadError]);

  function fiscalStatusLabel(status: string): string {
    const key = status as keyof typeof b.statusFiscal;
    return b.statusFiscal[key] ?? status;
  }

  function complianceLabel(status: string): string {
    const key = status as keyof typeof b.statusCompliance;
    return b.statusCompliance[key] ?? status;
  }

  function fiscalProviderLabel(key: string): string {
    if (key === "fiskaly" || key === "caisty_fiscal_germany_fiskaly") {
      return b.providerGermanyFiskaly;
    }
    return b.providerNone;
  }

  function fiscalConfigurationLabel(
    labelOrKey: string | null | undefined,
  ): string {
    if (!labelOrKey) return b.packageGenericStandard;
    if (
      labelOrKey === "Caisty Fiscal Germany powered by Fiskaly" ||
      labelOrKey === b.providerGermanyFiskaly
    ) {
      return b.providerGermanyFiskaly;
    }
    if (labelOrKey.includes("coming_soon") || labelOrKey.includes("coming soon")) {
      return b.packageComingSoon;
    }
    if (labelOrKey === "de_fiskaly_api") return b.providerGermanyFiskaly;
    if (labelOrKey === "generic_standard") return b.packageGenericStandard;
    return labelOrKey;
  }

  function receiptModeLabel(mode: string): string {
    if (mode === "certified" || mode === "certified_germany") {
      return b.receiptModeCertified;
    }
    if (mode === "standard_until_certified") {
      return b.receiptModeStandardUntilCertified;
    }
    return b.receiptModeStandard;
  }

  function countryLabel(code: string | null): string {
    if (!code) return t.labels.dash;
    const key = code as keyof typeof b.countries;
    return b.countries[key] ?? code;
  }

  async function handleSaveCompany(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const updated = await updatePortalBusiness({
        companyName: companyName.trim(),
        legalName: legalName.trim(),
        country: country || null,
        currency,
        defaultLanguage,
        businessAddress: {
          street: street.trim(),
          city: city.trim(),
          zip: zip.trim(),
          country: country || undefined,
        },
      });
      setProfile(updated);
      applyProfileToForm(updated);
      setSuccess(b.saveSuccess);
    } catch (err) {
      setError(mapPortalApiError(err, { default: b.saveError }));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveTax(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const updated = await updatePortalBusiness({
        vatId: vatId.trim(),
        taxId: taxId.trim(),
      });
      setProfile(updated);
      applyProfileToForm(updated);
      setSuccess(b.saveSuccess);
    } catch (err) {
      setError(mapPortalApiError(err, { default: b.saveError }));
    } finally {
      setSaving(false);
    }
  }

  const posDownloadUrl = getPosWindowsDownloadUrl();
  const posDownloadAvailable = isPosDownloadConfigured();
  const posVersion = getPosLatestVersion();

  const effectiveCountry = country || profile?.country || null;
  const countryDirty =
    Boolean(country) && country !== (profile?.country ?? "");

  const displayFiscalStatus = countryDirty
    ? previewFiscalStatus(effectiveCountry)
    : (profile?.fiscalStatus ?? previewFiscalStatus(effectiveCountry));
  const displayProviderKey = countryDirty
    ? previewFiscalProviderKey(effectiveCountry)
    : (profile?.fiscalProviderDisplayKey ??
      previewFiscalProviderKey(effectiveCountry));
  const displayFiscalConfiguration = countryDirty
    ? previewFiscalConfigurationLabel(effectiveCountry)
    : (profile?.fiscalConfigurationLabel ??
      profile?.fiscalPackage ??
      previewFiscalConfigurationLabel(effectiveCountry));
  const displayReceiptMode = countryDirty
    ? previewReceiptMode(effectiveCountry)
    : (profile?.receiptMode ?? previewReceiptMode(effectiveCountry));
  const displayFiscalNotice = countryDirty
    ? previewFiscalNotice(effectiveCountry)
    : (profile?.fiscalNotice ?? previewFiscalNotice(effectiveCountry));
  const displayCurrency = countryDirty
    ? currency
    : (profile?.currency ?? currency);

  const allowedCurrencies = effectiveCountry
    ? currenciesForCountry(effectiveCountry)
    : currenciesForCountry("DE");

  function fiscalExplainerText(): string {
    if (!effectiveCountry) return b.fiscalExplainerNoCountry;
    if (effectiveCountry === "DE") return b.fiscalExplainerGermany;
    if (
      ["AT", "FR", "IT", "ES", "PT", "NL", "BE"].includes(effectiveCountry)
    ) {
      return b.fiscalExplainerEuSoon;
    }
    return b.fiscalExplainerGeneric;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div
          className={`h-8 w-48 rounded animate-pulse ${
            isLight ? "bg-slate-200" : "bg-slate-800"
          }`}
        />
        <div
          className={`h-40 rounded-xl animate-pulse ${
            isLight ? "bg-slate-200" : "bg-slate-800"
          }`}
        />
      </div>
    );
  }

  const readOnly = profile;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1
          className={`text-2xl sm:text-3xl font-semibold tracking-tight ${
            isLight ? "text-[#0B1220]" : "text-white"
          }`}
        >
          {b.title}
        </h1>
        <p
          className={`text-sm max-w-2xl leading-relaxed ${
            isLight ? "text-slate-600" : "text-slate-400"
          }`}
        >
          {b.subtitle}
        </p>
        <p
          className={`text-xs inline-flex items-center gap-2 rounded-full border px-3 py-1 ${
            isLight
              ? "border-slate-200 bg-slate-50 text-slate-600"
              : "border-white/10 bg-white/[0.04] text-slate-400"
          }`}
        >
          {t.layout.cloudManaged} · {t.layout.syncedFromCloud}
        </p>
      </header>

      {(error || success) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? isLight
                ? "border-rose-300 bg-rose-50 text-rose-800"
                : "border-rose-500/60 bg-rose-500/10 text-rose-200"
              : isLight
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"
          }`}
        >
          {error ?? success}
        </div>
      )}

      {/* A) Company Information */}
      <section className={`${portalCardShell(isLight)} space-y-5`}>
        <div>
          <h2
            className={`text-sm font-semibold ${
              isLight ? "text-slate-900" : "text-slate-100"
            }`}
          >
            {b.companyTitle}
          </h2>
          <p
            className={`text-xs mt-1 ${
              isLight ? "text-slate-600" : "text-slate-400"
            }`}
          >
            {b.companyHint}
          </p>
        </div>

        <form onSubmit={handleSaveCompany} className="space-y-4 text-xs">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={b.companyName}>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className={portalInputClass(isLight)}
                required
              />
            </Field>
            <Field label={b.legalName}>
              <input
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                className={portalInputClass(isLight)}
              />
            </Field>
            <Field label={b.country}>
              <select
                value={country}
                onChange={(e) => {
                  const code = e.target.value;
                  setCountry(code);
                  const opt = BUSINESS_COUNTRY_OPTIONS.find(
                    (c) => c.code === code,
                  );
                  if (opt) setCurrency(opt.currency);
                }}
                className={portalInputClass(isLight)}
              >
                <option value="">{b.countryPlaceholder}</option>
                {BUSINESS_COUNTRY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {countryLabel(c.code)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={b.currency}>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={portalInputClass(isLight)}
              >
                {allowedCurrencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={b.defaultLanguage}>
              <select
                value={defaultLanguage}
                onChange={(e) => setDefaultLanguage(e.target.value)}
                className={portalInputClass(isLight)}
              >
                {BUSINESS_LANGUAGE_OPTIONS.map((l) => (
                  <option key={l.code} value={l.code}>
                    {b.languages[l.labelKey]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className={portalSectionLabel(isLight)}>{b.addressTitle}</div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={b.street} className="md:col-span-2">
              <input
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className={portalInputClass(isLight)}
              />
            </Field>
            <Field label={b.city}>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={portalInputClass(isLight)}
              />
            </Field>
            <Field label={b.zip}>
              <input
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className={portalInputClass(isLight)}
              />
            </Field>
          </div>

          <button
            type="submit"
            disabled={saving}
            className={`${portalPrimaryCta()} disabled:opacity-60`}
          >
            {saving ? b.saving : b.saveCompany}
          </button>
        </form>
      </section>

      {/* B) Tax & Compliance */}
      <section className={`${portalCardShell(isLight)} space-y-5`}>
        <div>
          <h2
            className={`text-sm font-semibold ${
              isLight ? "text-slate-900" : "text-slate-100"
            }`}
          >
            {b.taxTitle}
          </h2>
          <p
            className={`text-xs mt-1 ${
              isLight ? "text-slate-600" : "text-slate-400"
            }`}
          >
            {b.taxHint}
          </p>
        </div>

        <form onSubmit={handleSaveTax} className="space-y-4 text-xs">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={b.vatId}>
              <input
                value={vatId}
                onChange={(e) => setVatId(e.target.value)}
                className={portalInputClass(isLight)}
                maxLength={64}
              />
            </Field>
            <Field label={b.taxId}>
              <input
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className={portalInputClass(isLight)}
                maxLength={64}
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <ReadOnlyStatus
              label={b.fiscalStatusLabel}
              value={fiscalStatusLabel(displayFiscalStatus)}
              badgeClass={statusBadgeClass(displayFiscalStatus, isLight)}
              isLight={isLight}
            />
            <ReadOnlyStatus
              label={b.fiscalProviderLabel}
              value={fiscalProviderLabel(displayProviderKey)}
              isLight={isLight}
            />
            <ReadOnlyStatus
              label={b.complianceStatusLabel}
              value={complianceLabel(
                readOnly?.complianceStatus ?? "incomplete",
              )}
              badgeClass={statusBadgeClass(
                readOnly?.complianceStatus ?? "incomplete",
                isLight,
              )}
              isLight={isLight}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className={`${portalPrimaryCta()} disabled:opacity-60`}
          >
            {saving ? b.saving : b.saveTax}
          </button>
        </form>
      </section>

      {/* C) POS Configuration */}
      <section className={`${portalCardShell(isLight)} space-y-5`}>
        <div>
          <h2
            className={`text-sm font-semibold ${
              isLight ? "text-slate-900" : "text-slate-100"
            }`}
          >
            {b.posTitle}
          </h2>
          <p
            className={`text-xs mt-1 ${
              isLight ? "text-slate-600" : "text-slate-400"
            }`}
          >
            {b.posHint}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
          <ReadOnlyStatus
            label={b.selectedCountry}
            value={countryLabel(effectiveCountry)}
            isLight={isLight}
          />
          <ReadOnlyStatus
            label={b.currency}
            value={displayCurrency}
            isLight={isLight}
          />
          <ReadOnlyStatus
            label={b.fiscalConfiguration}
            value={fiscalConfigurationLabel(displayFiscalConfiguration)}
            isLight={isLight}
          />
          <ReadOnlyStatus
            label={b.receiptMode}
            value={receiptModeLabel(displayReceiptMode)}
            isLight={isLight}
          />
          <ReadOnlyStatus
            label={b.posDownloadStatus}
            value={
              posDownloadAvailable
                ? b.posDownloadAvailable
                : b.posDownloadUnavailable
            }
            badgeClass={statusBadgeClass(
              posDownloadAvailable ? "download_available" : "not_ready",
              isLight,
            )}
            isLight={isLight}
          />
          <ReadOnlyStatus
            label={b.posVersion}
            value={posVersion}
            isLight={isLight}
          />
        </div>

        <div>
          {posDownloadAvailable && posDownloadUrl ? (
            <a
              href={posDownloadUrl}
              target="_blank"
              rel="noreferrer noopener"
              className={`inline-flex items-center gap-2 no-underline ${portalPrimaryCta()}`}
            >
              <Download size={16} aria-hidden />
              {b.downloadPos}
            </a>
          ) : (
            <button
              type="button"
              disabled
              className={`${portalPrimaryCta()} opacity-50 cursor-not-allowed`}
            >
              {b.downloadPosUnavailable}
            </button>
          )}
        </div>
      </section>

      {/* D) Fiscal Information */}
      <section className={`${portalCardShell(isLight)} space-y-3`}>
        <div className="flex gap-3">
          <Info
            className={`h-5 w-5 shrink-0 mt-0.5 ${
              isLight ? "text-orange-600" : "text-orange-400"
            }`}
            aria-hidden
          />
          <div className="space-y-2 text-sm">
            <h2
              className={`font-semibold ${
                isLight ? "text-slate-900" : "text-slate-100"
              }`}
            >
              {b.fiscalInfoTitle}
            </h2>
            <p className={isLight ? "text-slate-600" : "text-slate-400"}>
              {fiscalExplainerText()}
            </p>
            {displayFiscalNotice && (
              <p
                className={`text-xs ${
                  isLight ? "text-slate-500" : "text-slate-500"
                }`}
              >
                {displayFiscalNotice}
              </p>
            )}
            {displayFiscalStatus === "pending_setup" &&
              effectiveCountry === "DE" && !displayFiscalNotice && (
              <p
                className={`text-xs ${
                  isLight ? "text-slate-500" : "text-slate-500"
                }`}
              >
                {b.fiscalPendingNote}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div
        className={`text-[11px] font-medium uppercase tracking-wider ${
          isLight ? "text-slate-500" : "text-slate-400"
        }`}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function ReadOnlyStatus({
  label,
  value,
  badgeClass,
  isLight,
}: {
  label: string;
  value: string;
  badgeClass?: string;
  isLight: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 space-y-1 ${
        isLight
          ? "border-slate-200 bg-slate-50/80"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div
        className={`text-[10px] font-medium uppercase tracking-wider ${
          isLight ? "text-slate-500" : "text-slate-500"
        }`}
      >
        {label}
      </div>
      {badgeClass ? (
        <span className={badgeClass}>{value}</span>
      ) : (
        <div
          className={`text-sm font-medium ${
            isLight ? "text-slate-900" : "text-slate-100"
          }`}
        >
          {value}
        </div>
      )}
    </div>
  );
}

export default PortalBusinessPage;
