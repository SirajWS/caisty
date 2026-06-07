// apps/caisty-site/src/routes/PortalLicensesPage.tsx
import React from "react";
import { Link } from "react-router-dom";
import {
  fetchPortalLicenses,
  type PortalLicense,
  fetchPortalMe,
} from "../lib/portalApi";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalLocaleTag } from "../lib/portalLocale";
import { portalCardShell, portalLicenseStatusBadge, portalPrimaryCta, portalTableShell, portalTextLink } from "../lib/portalUi";

const PortalLicensesPage: React.FC = () => {
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const locale = portalLocaleTag(language);
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [licenses, setLicenses] = React.useState<PortalLicense[]>([]);
  const [loading, setLoading] = React.useState(true);
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

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const items = await fetchPortalLicenses();
        if (!cancelled) setLicenses(items);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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

  const listHint = loading
    ? t.licenses.loading
    : filtered.length === 0
      ? t.licenses.noneFiltered
      : t.licenses.count.replace("{{count}}", String(filtered.length));

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1
          className={`text-xl font-semibold tracking-tight ${
            isLight ? "text-slate-900" : "text-slate-100"
          }`}
        >
          {t.licenses.title}
        </h1>
        <p
          className={`text-sm ${
            isLight ? "text-slate-600" : "text-slate-300"
          }`}
        >
          {t.licenses.subtitle}
        </p>
      </header>

      <LicensesSummary />

      <section
        className={`${portalCardShell(isLight)} flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-[11px]`}
      >
        <div>
          <span
            className={`font-semibold ${
              isLight ? "text-slate-900" : "text-slate-100"
            }`}
          >
            {t.licenses.planBillingLabel}
          </span>{" "}
          {t.licenses.planBillingBody}{" "}
          <span className="font-semibold">{t.licenses.planBillingPage}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/portal/plan" className={`no-underline ${portalPrimaryCta()} text-[11px] px-4 py-2`}>
            {t.licenses.planBillingCta}
          </Link>
        </div>
      </section>

      <section className={portalTableShell(isLight)}>
        <div
          className={`px-4 py-3 border-b flex flex-col gap-3 md:flex-row md:items-center md:justify-between ${
            isLight ? "border-slate-200" : "border-slate-800"
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
                className={`rounded-full border px-2 py-1 text-[11px] focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/40 ${
                  isLight
                    ? "border-slate-300 bg-white text-slate-900"
                    : "border-slate-700 bg-slate-950 text-slate-100"
                }`}
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as typeof statusFilter)
                }
              >
                <option value="all">{t.licenses.filterAll}</option>
                <option value="active">active</option>
                <option value="revoked">revoked</option>
                <option value="expired">expired</option>
              </select>
            </div>

            <div className="w-40 md:w-52">
              <Input
                placeholder={t.licenses.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 px-2 py-1 text-[11px]"
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
          <table className="min-w-full text-xs">
            <thead>
              <tr
                className={`border-b text-[11px] uppercase ${
                  isLight
                    ? "border-slate-200 bg-slate-50 text-slate-600"
                    : "border-slate-800 bg-slate-950/60 text-slate-500"
                }`}
              >
                <th className="text-left px-4 py-2 font-medium">{t.licenses.colKey}</th>
                <th className="text-left px-4 py-2 font-medium">{t.labels.plan}</th>
                <th className="text-left px-4 py-2 font-medium">{t.labels.status}</th>
                <th className="text-left px-4 py-2 font-medium">{t.labels.maxDevices}</th>
                <th className="text-left px-4 py-2 font-medium">{t.labels.validUntil}</th>
                <th className="text-left px-4 py-2 font-medium">{t.labels.createdAt}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <SkeletonLicenseRow isLight={isLight} />
                  <SkeletonLicenseRow isLight={isLight} />
                </>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className={`px-4 py-6 text-center ${
                      isLight ? "text-slate-600" : "text-slate-400"
                    }`}
                  >
                    {t.licenses.emptyRow}
                  </td>
                </tr>
              ) : (
                filtered.map((lic) => (
                  <tr
                    key={lic.id}
                    className={`border-t hover:bg-opacity-80 ${
                      isLight
                        ? "border-slate-200 hover:bg-slate-50"
                        : "border-slate-900/80 hover:bg-slate-900/80"
                    }`}
                  >
                    <td
                      className={`px-4 py-2 font-mono text-[11px] ${
                        isLight ? "text-slate-900" : "text-slate-200"
                      }`}
                    >
                      {lic.key}
                    </td>
                    <td
                      className={`px-4 py-2 capitalize ${
                        isLight ? "text-slate-900" : "text-slate-200"
                      }`}
                    >
                      {lic.plan}
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={lic.status} isLight={isLight} />
                    </td>
                    <td
                      className={`px-4 py-2 ${
                        isLight ? "text-slate-900" : "text-slate-200"
                      }`}
                    >
                      {lic.maxDevices}
                    </td>
                    <td
                      className={`px-4 py-2 ${
                        isLight ? "text-slate-700" : "text-slate-300"
                      }`}
                    >
                      {formatDate(lic.validUntil)}
                    </td>
                    <td
                      className={`px-4 py-2 ${
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

      <p
        className={`text-[11px] ${
          isLight ? "text-slate-600" : "text-slate-500"
        }`}
      >
        {t.licenses.footer}{" "}
        <Link to="/portal/plan" className={`hover:underline ${portalTextLink(isLight)}`}>
          {t.licenses.footerPlanLink}
        </Link>
      </p>
    </div>
  );
};

const LicensesSummary: React.FC = () => {
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [name, setName] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const me = await fetchPortalMe();
      setName(me?.name ?? null);
    })();
  }, []);

  const who = name ?? t.licenses.summaryYourAccount;

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-[11px] flex items-center justify-between gap-3 ${
        isLight
          ? "border-slate-200 bg-slate-50 text-slate-600"
          : "border-slate-800 bg-slate-950/60 text-slate-400"
      }`}
    >
      <div>
        <span
          className={`font-medium ${
            isLight ? "text-slate-900" : "text-slate-200"
          }`}
        >
          {t.licenses.summaryPrefix} {who}
        </span>{" "}
        {t.licenses.summarySuffix}
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: string; isLight?: boolean }> = ({
  status,
  isLight = false,
}) => {
  return <span className={portalLicenseStatusBadge(status, isLight)}>{status}</span>;
};

const SkeletonLicenseRow: React.FC<{ isLight?: boolean }> = ({
  isLight = false,
}) => {
  return (
    <tr
      className={`border-t ${
        isLight ? "border-slate-200" : "border-slate-900/80"
      }`}
    >
      <td className="px-4 py-3">
        <SkeletonBar className="w-40" isLight={isLight} />
      </td>
      <td className="px-4 py-3">
        <SkeletonBar className="w-20" isLight={isLight} />
      </td>
      <td className="px-4 py-3">
        <SkeletonBar className="w-16" isLight={isLight} />
      </td>
      <td className="px-4 py-3">
        <SkeletonBar className="w-10" isLight={isLight} />
      </td>
      <td className="px-4 py-3">
        <SkeletonBar className="w-28" isLight={isLight} />
      </td>
      <td className="px-4 py-3">
        <SkeletonBar className="w-24" isLight={isLight} />
      </td>
    </tr>
  );
};

const SkeletonBar: React.FC<{ className?: string; isLight?: boolean }> = ({
  className,
  isLight = false,
}) => (
  <div
    className={[
      "h-3 rounded-full animate-pulse",
      isLight ? "bg-slate-200" : "bg-slate-800",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
  />
);

export default PortalLicensesPage;
