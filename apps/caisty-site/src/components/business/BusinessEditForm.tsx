import React from "react";
import {
  updatePortalBusiness,
  type PortalBusinessProfile,
} from "../../lib/portalApi";
import type { PortalTranslations } from "../../lib/translations/portal";
import {
  portalInputClass,
  portalPrimaryCta,
  portalSectionLabel,
} from "../../lib/portalUi";
import {
  getBusinessCountryOptions,
  BUSINESS_LANGUAGE_OPTIONS,
  currenciesForCountry,
} from "../../config/businessCountries";
import { mapPortalApiError } from "../../lib/caistyTerminology";
import {
  deriveFiscalVisibility,
} from "../../lib/useFiscalVisibility";

function FormField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`business-form-field ${className}`}>
      <label className="business-form-label">{label}</label>
      {children}
    </div>
  );
}

export function BusinessEditForm({
  profile,
  loading,
  isLight,
  t,
  onSaved,
  formId,
}: {
  profile: PortalBusinessProfile | null;
  loading: boolean;
  isLight: boolean;
  t: PortalTranslations;
  onSaved: () => void;
  formId: string;
}) {
  const b = t.business;
  const c = b.center;

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
    if (profile) applyProfileToForm(profile);
  }, [profile]);

  function countryLabel(code: string | null): string {
    if (!code) return t.labels.dash;
    const key = code as keyof typeof b.countries;
    return b.countries[key] ?? code;
  }

  const effectiveCountry = country || profile?.country || null;
  const allowedCurrencies = effectiveCountry
    ? currenciesForCountry(effectiveCountry)
    : currenciesForCountry("DE");

  const fiscalVisibility = deriveFiscalVisibility({
    fiscalRequired: profile?.fiscalRequired,
    fiscalStatus: profile?.fiscalStatus,
    country: effectiveCountry,
  });

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      await updatePortalBusiness({
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
      setSuccess(b.saveSuccess);
      onSaved();
    } catch (err) {
      setError(mapPortalApiError(err, { default: b.saveError }));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section id={formId} className="dashboard-panel dashboard-panel--wide business-edit-form">
        <div className="h-40 rounded-lg animate-pulse dashboard-kpi--skeleton" />
      </section>
    );
  }

  if (!profile) {
    return (
      <section id={formId} className="dashboard-panel dashboard-panel--wide business-edit-form">
        <h2 className="dashboard-panel-title">{c.sectionCompany}</h2>
        <p className="dashboard-text-muted">{b.loadError}</p>
      </section>
    );
  }

  const showComplianceIncomplete = profile.complianceStatus === "incomplete";

  return (
    <section id={formId} className="dashboard-panel dashboard-panel--wide business-edit-form">
      <div className="business-form-head">
        <div>
          <h2 className="dashboard-panel-title m-0">{c.sectionCompany}</h2>
          <p className="dashboard-text-muted text-xs mt-1 mb-0">{b.companyHint}</p>
        </div>
      </div>

      {(error || success) && (
        <div
          className={`business-form-alert ${
            error ? "business-form-alert--error" : "business-form-alert--success"
          }`}
          role="status"
        >
          {error ?? success}
        </div>
      )}

      <form onSubmit={handleSave} className="business-form">
        <div className={portalSectionLabel(isLight)}>{b.companyTitle}</div>
        <div className="business-form-grid">
          <FormField label={b.companyName}>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className={portalInputClass(isLight)}
              required
            />
          </FormField>
          <FormField label={b.legalName}>
            <input
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              className={portalInputClass(isLight)}
            />
          </FormField>
          <FormField label={b.country}>
            <select
              value={country}
              onChange={(e) => {
                const code = e.target.value;
                setCountry(code);
                const opt = getBusinessCountryOptions().find((item) => item.code === code);
                if (opt) setCurrency(opt.currency);
              }}
              className={portalInputClass(isLight)}
            >
              <option value="">{b.countryPlaceholder}</option>
              {getBusinessCountryOptions().map((item) => (
                <option key={item.code} value={item.code}>
                  {countryLabel(item.code)}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label={b.currency}>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={portalInputClass(isLight)}
            >
              {allowedCurrencies.map((cur) => (
                <option key={cur} value={cur}>
                  {cur}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label={b.defaultLanguage}>
            <select
              value={defaultLanguage}
              onChange={(e) => setDefaultLanguage(e.target.value)}
              className={portalInputClass(isLight)}
            >
              {BUSINESS_LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {b.languages[lang.labelKey]}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className={`${portalSectionLabel(isLight)} mt-4`}>{b.addressTitle}</div>
        <div className="business-form-grid">
          <FormField label={b.street} className="business-form-field--wide">
            <input
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              className={portalInputClass(isLight)}
            />
          </FormField>
          <FormField label={b.city}>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={portalInputClass(isLight)}
            />
          </FormField>
          <FormField label={b.zip}>
            <input
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              className={portalInputClass(isLight)}
            />
          </FormField>
        </div>

        <div className={`${portalSectionLabel(isLight)} mt-4`}>{b.taxTitle}</div>
        <div className="business-form-grid">
          <FormField label={fiscalVisibility.showFiscalUi ? b.vatId : b.vatIdOptional}>
            <input
              value={vatId}
              onChange={(e) => setVatId(e.target.value)}
              className={portalInputClass(isLight)}
              maxLength={64}
            />
          </FormField>
          <FormField label={fiscalVisibility.showFiscalUi ? b.taxId : b.taxIdOptional}>
            <input
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              className={portalInputClass(isLight)}
              maxLength={64}
            />
          </FormField>
        </div>

        {showComplianceIncomplete ? (
          <p className="business-form-hint business-form-hint--warning">
            {t.fiscal.businessIncompleteHint}
          </p>
        ) : null}

        <div className="business-form-actions">
          <button type="submit" disabled={saving} className={`${portalPrimaryCta()} disabled:opacity-60`}>
            {saving ? b.saving : b.saveCompany}
          </button>
        </div>
      </form>
    </section>
  );
}
