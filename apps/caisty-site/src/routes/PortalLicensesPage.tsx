import React from "react";
import { Link } from "react-router-dom";
import { Check, Copy } from "lucide-react";
import {
  fetchPortalLicenses,
  type PortalLicense,
} from "../lib/portalApi";
import { Button } from "../components/ui/Button";
import { LicensesEmptyState } from "../components/licenses/LicensesEmptyState";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import type { PortalTranslations } from "../lib/translations/portal";
import { portalLocaleTag } from "../lib/portalLocale";
import {
  portalInputClass,
  portalLicenseStatusBadge,
  portalPageShell,
  portalPageSubtitle,
  portalPageTitle,
  portalTableShell,
  portalTextLink,
} from "../lib/portalUi";

function licensePlanLabel(plan: string, t: PortalTranslations): string {
  const p = plan.trim().toLowerCase();
  if (p === "trial") return t.pos.planTrial;
  if (p === "starter") return t.pos.planStarter;
  if (p === "pro") return t.pos.planPro;
  if (p === "business") return t.pos.planBusiness;
  if (p === "enterprise") return t.pos.planEnterprise;
  return plan || t.labels.dash;
}

function licenseStatusLabel(status: string, t: PortalTranslations): string {
  const s = status.trim().toLowerCase();
  const l = t.licenses;
  if (s === "active") return l.statusActive;
  if (s === "revoked" || s === "blocked") return l.statusRevoked;
  if (s === "expired") return l.statusExpired;
  if (s === "inactive") return l.statusInactive;
  return status.trim() ? status : l.statusUnknown;
}

const PortalLicensesPage: React.FC = () => {
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const locale = portalLocaleTag(language);
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [licenses, setLicenses] = React.useState<PortalLicense[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "active" | "revoked" | "expired"
  >("all");
  const [search, setSearch] = React.useState("");

  function formatDate(value: string | null | undefined): string {
    if (!value) return t.labels.dash;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString(locale);
  }

  const loadLicenses = React.useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const items = await fetchPortalLicenses();
      setLicenses(items);
    } catch {
      setLoadError(true);
      setLicenses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadLicenses();
  }, [loadLicenses]);

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();

    return licenses.filter((lic) => {
      if (
        statusFilter !== "all" &&
        lic.status.toLowerCase() !== statusFilter
      ) {
        return false;
      }

      if (!term) return true;

      const haystack = `${lic.key} ${lic.plan}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [licenses, statusFilter, search]);

  const showReset = statusFilter !== "all" || search.trim().length > 0;
  const hasLicenses = licenses.length > 0;

  const listHint = loading
    ? t.licenses.loading
    : filtered.length === 0
      ? t.licenses.noneFiltered
      : t.licenses.count.replace("{{count}}", String(filtered.length));

  return (
    <div className={portalPageShell()}>
      <header className="space-y-1">
        <h1 className={portalPageTitle(isLight)}>{t.licenses.title}</h1>
        <p className={portalPageSubtitle(isLight)}>{t.licenses.subtitle}</p>
      </header>

      <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
        {t.licenses.slimPlanHint}{" "}
        <Link to="/portal/billing" className={`no-underline hover:underline ${portalTextLink(isLight)}`}>
          {t.licenses.slimPlanLink}
        </Link>
      </p>

      {loading ? (
        <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>
          {t.licenses.loading}
        </p>
      ) : loadError ? (
        <div
          className={`rounded-xl border px-3 py-2 text-sm flex flex-wrap items-center gap-3 ${
            isLight
              ? "border-red-300 bg-red-50 text-red-800"
              : "border-red-700 bg-red-900/40 text-red-100"
          }`}
          role="alert"
        >
          <span>{t.licenses.loadError}</span>
          <Button type="button" size="sm" variant="ghost" onClick={() => void loadLicenses()}>
            {t.licenses.retry}
          </Button>
        </div>
      ) : !hasLicenses ? (
        <LicensesEmptyState
          headline={t.licenses.emptyHeadline}
          description={t.licenses.emptyDescription}
          ctaLabel={t.licenses.emptyCta}
          ctaHref="/portal/billing"
        />
      ) : (
        <section className={portalTableShell(isLight)}>
          <div
            className={`px-4 py-3 border-b flex flex-col gap-3 md:flex-row md:items-center md:justify-between ${
              isLight ? "border-slate-100" : "border-white/10"
            }`}
          >
            <div
              className={`text-xs ${
                isLight ? "text-slate-700" : "text-slate-300"
              }`}
            >
              {listHint}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <span
                  className={isLight ? "text-slate-600" : "text-slate-400"}
                >
                  {t.labels.status}:
                </span>
                <select
                  className={`${portalInputClass(isLight)} !w-auto min-w-[7.5rem] py-1.5 text-xs`}
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as typeof statusFilter)
                  }
                >
                  <option value="all">{t.licenses.filterAll}</option>
                  <option value="active">{t.licenses.filterActive}</option>
                  <option value="revoked">{t.licenses.filterRevoked}</option>
                  <option value="expired">{t.licenses.filterExpired}</option>
                </select>
              </div>

              <div className="w-40 md:w-52">
                <input
                  type="search"
                  placeholder={t.licenses.searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`h-9 text-xs ${portalInputClass(isLight)}`}
                />
              </div>

              {showReset && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setStatusFilter("all");
                    setSearch("");
                  }}
                >
                  {t.licenses.resetFilter}
                </Button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="portal-table text-xs">
              <thead>
                <tr>
                  <th>{t.licenses.colKey}</th>
                  <th>{t.labels.plan}</th>
                  <th>{t.labels.status}</th>
                  <th>{t.labels.maxDevices}</th>
                  <th>{t.labels.validUntil}</th>
                  <th>{t.labels.createdAt}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className={`text-center ${
                        isLight ? "text-slate-600" : "text-slate-400"
                      }`}
                    >
                      {t.licenses.noneFiltered}
                    </td>
                  </tr>
                ) : (
                  filtered.map((lic) => (
                    <tr key={lic.id}>
                      <td
                        className={`text-sm ${
                          isLight ? "text-slate-900" : "text-slate-200"
                        }`}
                      >
                        <LicenseKeyCell licenseKey={lic.key} t={t} isLight={isLight} />
                      </td>
                      <td
                        className={`text-sm ${
                          isLight ? "text-slate-900" : "text-slate-200"
                        }`}
                      >
                        {licensePlanLabel(lic.plan, t)}
                      </td>
                      <td>
                        <StatusBadge status={lic.status} t={t} isLight={isLight} />
                      </td>
                      <td
                        className={`text-sm ${
                          isLight ? "text-slate-900" : "text-slate-200"
                        }`}
                      >
                        {lic.maxDevices == null || lic.unlimitedDevices
                          ? t.devices.seatAvailableUnlimited
                          : lic.maxDevices}
                      </td>
                      <td
                        className={`text-sm ${
                          isLight ? "text-slate-700" : "text-slate-300"
                        }`}
                      >
                        {formatDate(lic.validUntil)}
                      </td>
                      <td
                        className={`text-sm ${
                          isLight ? "text-slate-600" : "text-slate-500"
                        }`}
                      >
                        {formatDate(lic.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {hasLicenses ? (
        <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-500"}`}>
          {t.licenses.footer}{" "}
          <Link to="/portal/billing" className={`hover:underline ${portalTextLink(isLight)}`}>
            {t.licenses.footerPlanLink}
          </Link>
        </p>
      ) : null}
    </div>
  );
};

function LicenseKeyCell({
  licenseKey,
  t,
  isLight,
}: {
  licenseKey: string;
  t: PortalTranslations;
  isLight: boolean;
}) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(licenseKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="licenses-key-cell">
      <span className="font-mono">{licenseKey}</span>
      <button
        type="button"
        className={`licenses-copy-btn ${isLight ? "licenses-copy-btn--light" : "licenses-copy-btn--dark"}`}
        onClick={() => void handleCopy()}
        title={copied ? t.licenses.copiedKey : t.licenses.copyKey}
        aria-label={copied ? t.licenses.copiedKey : t.licenses.copyKey}
      >
        {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
      </button>
    </div>
  );
}

const StatusBadge: React.FC<{
  status: string;
  t: PortalTranslations;
  isLight?: boolean;
}> = ({ status, t, isLight = false }) => {
  return (
    <span className={portalLicenseStatusBadge(status, isLight)}>
      {licenseStatusLabel(status, t)}
    </span>
  );
};

export default PortalLicensesPage;
