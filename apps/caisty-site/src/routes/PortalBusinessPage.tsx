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
  portalPageShell,
  portalPageSubtitle,
  portalPageTitle,
  portalPrimaryCta,
  portalSectionLabel,
} from "../lib/portalUi";
import {
  getBusinessCountryOptions,
  BUSINESS_LANGUAGE_OPTIONS,
  currenciesForCountry,
  getPosLatestVersion,
  getPosWindowsDownloadUrl,
  isPosDownloadConfigured,
} from "../config/businessCountries";
import { previewFiscalStatus } from "../lib/businessDisplay";
import { getCountryConfigByCode } from "../lib/countryConfigClient";
import { mapPortalApiError } from "../lib/caistyTerminology";
import {
  deriveFiscalVisibility,
  getFiscalCustomerCopy,
} from "../lib/useFiscalVisibility";

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

  function countryLabel(code: string | null): string {
    if (!code) return t.labels.dash;
    const key = code as keyof typeof b.countries;
    return b.countries[key] ?? code;
  }

  async function handleSaveAll(e: React.FormEvent) {
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

  const allowedCurrencies = effectiveCountry
    ? currenciesForCountry(effectiveCountry)
    : currenciesForCountry("DE");

  const effectiveFiscalRequired = countryDirty
    ? (getCountryConfigByCode(effectiveCountry)?.fiscalRequired ?? false)
    : profile?.fiscalRequired === true;

  const fiscalVisibility = deriveFiscalVisibility({
    fiscalRequired: effectiveFiscalRequired,
    fiscalStatus: displayFiscalStatus,
    country: effectiveCountry,
  });
  const fiscalCopy = getFiscalCustomerCopy(t, fiscalVisibility);

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

  const showComplianceIncomplete = profile?.complianceStatus === "incomplete";

  return (
    <div className={portalPageShell()}>
      <header className="space-y-1">
        <h1 className={portalPageTitle(isLight)}>{b.title}</h1>
        <p className={portalPageSubtitle(isLight)}>{b.subtitle}</p>
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

      <section className={`${portalCardShell(isLight)} space-y-4`}>
        <div>
          <h2 className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>
            {b.companyTitle}
          </h2>
          <p className={`text-xs mt-0.5 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            {b.companyHint}
          </p>
        </div>

        <form onSubmit={handleSaveAll} className="space-y-4 text-xs">
          <div className="grid gap-3 md:grid-cols-2">
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
                  const opt = getBusinessCountryOptions().find((c) => c.code === code);
                  if (opt) setCurrency(opt.currency);
                }}
                className={portalInputClass(isLight)}
              >
                <option value="">{b.countryPlaceholder}</option>
                {getBusinessCountryOptions().map((c) => (
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
          <div className="grid gap-3 md:grid-cols-2">
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

          <div className="grid gap-3 md:grid-cols-2">
            <Field label={fiscalVisibility.showFiscalUi ? b.vatId : b.vatIdOptional}>
              <input
                value={vatId}
                onChange={(e) => setVatId(e.target.value)}
                className={portalInputClass(isLight)}
                maxLength={64}
              />
            </Field>
            <Field label={fiscalVisibility.showFiscalUi ? b.taxId : b.taxIdOptional}>
              <input
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className={portalInputClass(isLight)}
                maxLength={64}
              />
            </Field>
          </div>

          {showComplianceIncomplete ? (
            <p className={`text-xs ${isLight ? "text-amber-700" : "text-amber-200"}`}>
              {t.fiscal.businessIncompleteHint}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className={`${portalPrimaryCta()} disabled:opacity-60`}
          >
            {saving ? b.saving : b.saveCompany}
          </button>
        </form>
      </section>

      <section className={`${portalCardShell(isLight)} space-y-3`}>
        <h2 className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>
          {b.posTitle}
        </h2>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className={`text-sm ${isLight ? "text-slate-700" : "text-slate-300"}`}>
            Caisty POS {posVersion} ·{" "}
            {posDownloadAvailable ? b.posDownloadAvailable : b.posDownloadUnavailable}
          </p>
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

      {fiscalCopy ? (
        <p
          className={`text-xs leading-relaxed rounded-lg border px-3 py-2 flex items-start gap-2 ${
            isLight
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          <Info size={14} className="shrink-0 mt-0.5" aria-hidden />
          <span>{fiscalCopy.message}</span>
        </p>
      ) : null}
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

export default PortalBusinessPage;
