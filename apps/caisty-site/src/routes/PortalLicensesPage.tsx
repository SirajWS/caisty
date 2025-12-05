// src/pages/PortalLicensesPage.tsx
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

const PortalLicensesPage: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [licenses, setLicenses] = React.useState<PortalLicense[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "active" | "revoked" | "expired"
  >("all");
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const items = await fetchPortalLicenses();
        if (cancelled) return;
        setLicenses(items);
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

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1
          className={`text-xl font-semibold tracking-tight ${
            isLight ? "text-slate-900" : "text-slate-100"
          }`}
        >
          Meine Lizenzen
        </h1>
        <p
          className={`text-sm ${
            isLight ? "text-slate-600" : "text-slate-300"
          }`}
        >
          Übersicht über alle Lizenzschlüssel, die deinem Konto zugeordnet
          sind.
        </p>
      </header>

      <LicensesSummary />

      {/* Hinweis auf Plan & Abrechnung */}
      <section
        className={`rounded-2xl border px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-[11px] ${
          isLight
            ? "border-slate-200 bg-white text-slate-700"
            : "border-slate-800 bg-slate-950/70 text-slate-300"
        }`}
      >
        <div>
          <span
            className={`font-semibold ${
              isLight ? "text-slate-900" : "text-slate-100"
            }`}
          >
            Plan &amp; Abrechnung:
          </span>{" "}
          Deinen aktuellen Tarif (Trial, Starter, Pro) und eine Übersicht der
          geplanten Pakete findest du auf der Seite{" "}
          <span className="font-semibold">„Plan &amp; Abrechnung"</span>.
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/portal/plan"
            className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium hover:bg-emerald-500/20 ${
              isLight
                ? "border-emerald-400 bg-emerald-50 text-emerald-600"
                : "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"
            }`}
          >
            Plan &amp; Abrechnung öffnen
          </Link>
        </div>
      </section>

      <section
        className={`rounded-2xl border ${
          isLight
            ? "border-slate-200 bg-white"
            : "border-slate-800 bg-slate-900/60"
        }`}
      >
        {/* Kopf mit Status + Filter */}
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
            {loading
              ? "Lizenzen werden geladen…"
              : filtered.length === 0
              ? "Keine Lizenzen passend zu deinem Filter."
              : `${filtered.length} Lizenz(en)`}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <span
                className={isLight ? "text-slate-600" : "text-slate-400"}
              >
                Status:
              </span>
              <select
                className={`rounded-full border px-2 py-1 text-[11px] focus:border-emerald-500 focus:outline-none ${
                  isLight
                    ? "border-slate-300 bg-white text-slate-900"
                    : "border-slate-700 bg-slate-950 text-slate-100"
                }`}
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as typeof statusFilter)
                }
              >
                <option value="all">Alle</option>
                <option value="active">active</option>
                <option value="revoked">revoked</option>
                <option value="expired">expired</option>
              </select>
            </div>

            <div className="w-40 md:w-52">
              <Input
                placeholder="Suche nach Key oder Plan…"
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
                Filter zurücksetzen
              </Button>
            )}
          </div>
        </div>

        {/* Tabelle */}
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
                <th className="text-left px-4 py-2 font-medium">Key</th>
                <th className="text-left px-4 py-2 font-medium">Plan</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium">Max Devices</th>
                <th className="text-left px-4 py-2 font-medium">Gültig bis</th>
                <th className="text-left px-4 py-2 font-medium">Erstellt am</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <SkeletonLicenseRow isLight={isLight} />
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
                    Aktuell sind hier keine Lizenzen sichtbar. Wenn du bereits
                    einen Lizenzschlüssel erhalten hast, wird er später
                    automatisch angezeigt.
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
        Wenn du Fragen zu deinem Lizenzschlüssel hast oder ein Upgrade von
        Starter auf Pro wünschst, wende dich bitte an deinen Anbieter oder
        Caisty-Support. Später kannst du Upgrades direkt unter{" "}
        <Link
          to="/portal/plan"
          className="text-emerald-500 hover:text-emerald-600 underline underline-offset-2"
        >
          „Plan &amp; Abrechnung"
        </Link>{" "}
        anstoßen.
      </p>
    </div>
  );
};

const LicensesSummary: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [name, setName] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const me = await fetchPortalMe();
      setName(me?.name ?? null);
    })();
  }, []);

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
          Lizenzen für {name ?? "dein Konto"}
        </span>{" "}
        – in dieser ersten Version sind die Daten rein lesend.
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: string; isLight?: boolean }> = ({
  status,
  isLight = false,
}) => {
  const normalized = status.toLowerCase();
  let label = status;
  let className =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] border ";

  if (normalized === "active") {
    className += isLight
      ? "border-emerald-400 bg-emerald-50 text-emerald-600 font-medium"
      : "border-emerald-500/60 bg-emerald-500/10 text-emerald-300 font-medium";
    label = "active";
  } else if (normalized === "revoked") {
    className += isLight
      ? "border-rose-400 bg-rose-50 text-rose-600 font-medium"
      : "border-rose-500/60 bg-rose-500/10 text-rose-300 font-medium";
    label = "revoked";
  } else if (normalized === "expired") {
    className += isLight
      ? "border-amber-400 bg-amber-50 text-amber-600 font-medium"
      : "border-amber-500/60 bg-amber-500/10 text-amber-300 font-medium";
    label = "expired";
  } else {
    className += isLight
      ? "border-slate-300 bg-slate-100 text-slate-700"
      : "border-slate-600 bg-slate-800 text-slate-300";
  }

  return <span className={className}>{label}</span>;
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

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export default PortalLicensesPage;
