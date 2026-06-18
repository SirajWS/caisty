// apps/caisty-site/src/routes/PortalLicensesPage.tsx
import React from "react";
import { Link } from "react-router-dom";
import { Info } from "lucide-react";
import {
  fetchPortalLicenses,
  type PortalLicense,
  fetchPortalMe,
} from "../lib/portalApi";
import { Button } from "../components/ui/Button";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalLocaleTag } from "../lib/portalLocale";
import { portalCardShell, portalInputClass, portalLicenseStatusBadge, portalPrimaryCta, portalTableShell, portalTextLink } from "../lib/portalUi";

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
    <div className="space-y-8">
      <header className="space-y-2">
        <h1
          className={`text-2xl sm:text-3xl font-semibold tracking-tight ${
            isLight ? "text-[#0B1220]" : "text-white"
          }`}
        >
          {t.licenses.title}
        </h1>
        <p
          className={`text-sm ${
            isLight ? "text-slate-600" : "text-slate-400"
          }`}
        >
          {t.licenses.subtitle}
        </p>
      </header>

      <LicensesSummary />

      <section
        className={`${portalCardShell(isLight)} flex flex-col gap-4 md:flex-row md:items-center md:justify-between`}
      >
        <p
          className={`text-sm leading-relaxed max-w-2xl ${
            isLight ? "text-slate-600" : "text-slate-300"
          }`}
        >
          <span className={`font-medium ${isLight ? "text-slate-900" : "text-slate-100"}`}>
            {t.licenses.planBillingLabel}
          </span>{" "}
          {t.licenses.planBillingBody}{" "}
          <span className="font-medium">{t.licenses.planBillingPage}</span>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Link to="/portal/plan" className={`no-underline ${portalPrimaryCta()} text-xs px-4 py-2`}>
            {t.licenses.planBillingCta}
          </Link>
        </div>
      </section>

      <section className={portalTableShell(isLight)}>
        <div
          className={`px-4 py-3.5 border-b flex flex-col gap-3 md:flex-row md:items-center md:justify-between ${
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
                <option value="active">active</option>
                <option value="revoked">revoked</option>
                <option value="expired">expired</option>
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
              {loading ? (
                <>
                  <SkeletonLicenseRow isLight={isLight} />
                  <SkeletonLicenseRow isLight={isLight} />
                </>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className={`text-center ${
                      isLight ? "text-slate-600" : "text-slate-400"
                    }`}
                  >
                    {t.licenses.emptyRow}
                  </td>
                </tr>
              ) : (
                filtered.map((lic) => (
                  <tr key={lic.id}>
                    <td
                      className={`font-mono text-sm ${
                        isLight ? "text-slate-900" : "text-slate-200"
                      }`}
                    >
                      {lic.key}
                    </td>
                    <td
                      className={`capitalize text-sm ${
                        isLight ? "text-slate-900" : "text-slate-200"
                      }`}
                    >
                      {lic.plan}
                    </td>
                    <td>
                      <StatusBadge status={lic.status} isLight={isLight} />
                    </td>
                    <td
                      className={`text-sm ${
                        isLight ? "text-slate-900" : "text-slate-200"
                      }`}
                    >
                      {lic.maxDevices}
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

      <p
        className={`text-xs italic ${
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
      className={`flex gap-3 rounded-xl border px-4 py-3 text-sm ${
        isLight
          ? "border-l-4 border-l-orange-500/70 border-y border-r border-slate-200 bg-orange-50/40 text-slate-700"
          : "border-l-4 border-l-orange-500/50 border-y border-r border-white/10 bg-orange-500/[0.06] text-slate-300"
      }`}
    >
      <Info
        className={`mt-0.5 h-5 w-5 shrink-0 ${isLight ? "text-orange-600" : "text-orange-400"}`}
        aria-hidden
      />
      <div className="min-w-0 leading-relaxed">
        <span className={`font-medium ${isLight ? "text-slate-900" : "text-slate-100"}`}>
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
    <tr className={isLight ? "hover:bg-slate-50/80" : "hover:bg-white/[0.04]"}>
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
