import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTheme, themeColors } from "../../theme/ThemeContext";
import {
  fetchFiscalOverview,
  type AdminFiscalOverviewItem,
  type FiscalOverviewSummary,
} from "../../lib/fiscalApi";
import {
  FISCAL_ACTION_TOOLTIP,
  fiscalStatusBadgeClass,
  fiscalStatusLabel,
  formatFiscalDate,
  providerDisplayLabel,
  providerTypeLabel,
  receiptModeLabel,
} from "../../lib/fiscalDisplay";

type SortKey = "customerName" | "country" | "fiscalStatus" | "lastSyncAt";
type SortDir = "asc" | "desc";

const EMPTY_SUMMARY: FiscalOverviewSummary = {
  totalProfiles: 0,
  germanyFiskalyPending: 0,
  activeSetups: 0,
  comingSoonCountries: 0,
  standardReceiptMode: 0,
};

function SummaryCard({
  label,
  value,
  hint,
  colors,
}: {
  label: string;
  value: number;
  hint?: string;
  colors: (typeof themeColors)["dark"];
}) {
  return (
    <div
      className="admin-card"
      style={{
        padding: "16px 18px",
        backgroundColor: colors.bgSecondary,
        borderColor: colors.border,
      }}
    >
      <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: colors.text }}>{value}</div>
      {hint ? (
        <div style={{ fontSize: 11, color: colors.textTertiary, marginTop: 4 }}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}

function DisabledAction({
  label,
  colors,
}: {
  label: string;
  colors: (typeof themeColors)["dark"];
}) {
  return (
    <button
      type="button"
      disabled
      title={FISCAL_ACTION_TOOLTIP}
      style={{
        fontSize: 11,
        padding: "4px 8px",
        borderRadius: 6,
        border: `1px solid ${colors.border}`,
        background: colors.bgTertiary,
        color: colors.textSecondary,
        opacity: 0.65,
        cursor: "not-allowed",
      }}
    >
      {label}
    </button>
  );
}

export default function FiscalCompliancePage() {
  const { theme } = useTheme();
  const colors = themeColors[theme];
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<AdminFiscalOverviewItem[]>([]);
  const [summary, setSummary] = useState<FiscalOverviewSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [countryFilter, setCountryFilter] = useState(
    searchParams.get("country") ?? "",
  );
  const [providerFilter, setProviderFilter] = useState(
    searchParams.get("provider") ?? "",
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") ?? "",
  );
  const [providerTypeFilter, setProviderTypeFilter] = useState(
    searchParams.get("providerType") ?? "",
  );
  const [posDownloadFilter, setPosDownloadFilter] = useState(
    searchParams.get("posDownload") ?? "",
  );
  const [customerFilter, setCustomerFilter] = useState(
    searchParams.get("customerId") ?? "",
  );
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("customerName");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchFiscalOverview(500);
        if (cancelled) return;
        setItems(res.items ?? []);
        setSummary(res.summary ?? EMPTY_SUMMARY);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("Fiscal overview could not be loaded.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const countryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const row of items) {
      if (row.country) set.add(row.country);
    }
    return Array.from(set).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();

    let rows = items.filter((row) => {
      if (customerFilter && row.customerId !== customerFilter) return false;
      if (countryFilter && row.country !== countryFilter) return false;
      if (providerFilter && row.provider !== providerFilter) return false;
      if (statusFilter && row.fiscalStatus !== statusFilter) return false;
      if (providerTypeFilter && row.providerType !== providerTypeFilter) {
        return false;
      }
      if (posDownloadFilter === "yes" && !row.posDownloadAllowed) return false;
      if (posDownloadFilter === "no" && row.posDownloadAllowed) return false;
      if (!term) return true;

      const haystack = [
        row.customerName,
        row.customerEmail,
        row.country,
        row.provider,
        row.providerLabel,
        row.fiscalConfigurationLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });

    rows = [...rows].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const getVal = (row: AdminFiscalOverviewItem): string | number => {
        switch (sortKey) {
          case "country":
            return row.country ?? "";
          case "fiscalStatus":
            return row.fiscalStatus ?? "";
          case "lastSyncAt":
            return row.lastSyncAt ? new Date(row.lastSyncAt).getTime() : 0;
          default:
            return (row.customerName ?? row.customerEmail ?? "").toLowerCase();
        }
      };
      const av = getVal(a);
      const bv = getVal(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });

    return rows;
  }, [
    items,
    countryFilter,
    providerFilter,
    statusFilter,
    providerTypeFilter,
    posDownloadFilter,
    customerFilter,
    search,
    sortKey,
    sortDir,
  ]);

  function updateQuery(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  }

  function handleCountryFilter(value: string) {
    setCountryFilter(value);
    updateQuery("country", value);
  }

  function handleStatusFilter(value: string) {
    setStatusFilter(value);
    updateQuery("status", value);
  }

  function handleCustomerFilterClear() {
    setCustomerFilter("");
    updateQuery("customerId", "");
  }

  const selectStyle = {
    padding: "6px 10px",
    borderRadius: 6,
    border: `1px solid ${colors.borderSecondary}`,
    background: colors.input,
    color: colors.text,
    fontSize: 13,
    minWidth: 150,
  } as const;

  return (
    <div className="admin-page">
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, color: colors.text }}>
        Fiscal / Compliance
      </h1>
      <p style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 24 }}>
        Cloud fiscal configuration across customers — API-service providers, receipt mode, and setup status.
      </p>

      {error ? (
        <div
          className="admin-error-banner"
          style={{
            backgroundColor: colors.errorBg,
            borderColor: `${colors.error}50`,
            color: colors.error,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <SummaryCard label="Total fiscal profiles" value={summary.totalProfiles} colors={colors} />
        <SummaryCard
          label="Germany / Fiskaly pending"
          value={summary.germanyFiskalyPending}
          hint="Awaiting cloud API onboarding"
          colors={colors}
        />
        <SummaryCard label="Active fiscal setups" value={summary.activeSetups} colors={colors} />
        <SummaryCard
          label="Coming soon countries"
          value={summary.comingSoonCountries}
          colors={colors}
        />
        <SummaryCard
          label="Standard receipt mode"
          value={summary.standardReceiptMode}
          colors={colors}
        />
      </div>

      {customerFilter ? (
        <div
          style={{
            marginBottom: 12,
            padding: "8px 12px",
            borderRadius: 8,
            background: colors.bgTertiary,
            fontSize: 13,
            color: colors.textSecondary,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <span>
            Filtered to customer{" "}
            <strong style={{ color: colors.text }}>{customerFilter.slice(0, 8)}…</strong>
          </span>
          <button
            type="button"
            onClick={handleCustomerFilterClear}
            style={{
              fontSize: 12,
              padding: "4px 10px",
              borderRadius: 6,
              border: `1px solid ${colors.border}`,
              background: colors.bgSecondary,
              color: colors.text,
              cursor: "pointer",
            }}
          >
            Clear filter
          </button>
        </div>
      ) : null}

      <div
        className="admin-card"
        style={{
          marginBottom: 16,
          padding: 16,
          backgroundColor: colors.bgSecondary,
          borderColor: colors.border,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
          }}
        >
          <input
            type="text"
            placeholder="Search customer, country, provider…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...selectStyle, minWidth: 240, flex: "1 1 240px" }}
          />
          <select
            value={countryFilter}
            onChange={(e) => handleCountryFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="">All countries</option>
            {countryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={providerFilter}
            onChange={(e) => {
              setProviderFilter(e.target.value);
              updateQuery("provider", e.target.value);
            }}
            style={selectStyle}
          >
            <option value="">All providers</option>
            <option value="fiskaly">Fiskaly</option>
            <option value="none">None</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="">All fiscal statuses</option>
            <option value="not_required">Not required</option>
            <option value="pending_setup">Pending setup</option>
            <option value="active">Active</option>
            <option value="required_coming_soon">Required — coming soon</option>
            <option value="error">Error</option>
          </select>
          <select
            value={providerTypeFilter}
            onChange={(e) => {
              setProviderTypeFilter(e.target.value);
              updateQuery("providerType", e.target.value);
            }}
            style={selectStyle}
          >
            <option value="">All provider types</option>
            <option value="api_service">API service</option>
            <option value="coming_soon">Coming soon</option>
            <option value="none">None</option>
          </select>
          <select
            value={posDownloadFilter}
            onChange={(e) => {
              setPosDownloadFilter(e.target.value);
              updateQuery("posDownload", e.target.value);
            }}
            style={selectStyle}
          >
            <option value="">POS download: all</option>
            <option value="yes">Allowed</option>
            <option value="no">Blocked</option>
          </select>
          <select
            value={`${sortKey}:${sortDir}`}
            onChange={(e) => {
              const [key, dir] = e.target.value.split(":") as [SortKey, SortDir];
              setSortKey(key);
              setSortDir(dir);
            }}
            style={selectStyle}
          >
            <option value="customerName:asc">Sort: Customer A–Z</option>
            <option value="customerName:desc">Sort: Customer Z–A</option>
            <option value="country:asc">Sort: Country A–Z</option>
            <option value="country:desc">Sort: Country Z–A</option>
            <option value="fiscalStatus:asc">Sort: Fiscal status A–Z</option>
            <option value="fiscalStatus:desc">Sort: Fiscal status Z–A</option>
            <option value="lastSyncAt:desc">Sort: Last sync (newest)</option>
            <option value="lastSyncAt:asc">Sort: Last sync (oldest)</option>
          </select>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: colors.textSecondary }}>
          {loading
            ? "Loading fiscal profiles…"
            : `${filteredItems.length} of ${items.length} profiles shown`}
        </div>
      </div>

      <div
        className="admin-card"
        style={{ backgroundColor: colors.bgSecondary, borderColor: colors.border }}
      >
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr style={{ backgroundColor: colors.bgTertiary }}>
                <th style={{ color: colors.textSecondary }}>Customer / Organization</th>
                <th style={{ color: colors.textSecondary }}>Country</th>
                <th style={{ color: colors.textSecondary }}>Currency</th>
                <th style={{ color: colors.textSecondary }}>Fiscal provider</th>
                <th style={{ color: colors.textSecondary }}>Provider type</th>
                <th style={{ color: colors.textSecondary }}>Fiscal status</th>
                <th style={{ color: colors.textSecondary }}>Receipt mode</th>
                <th style={{ color: colors.textSecondary }}>POS download</th>
                <th style={{ color: colors.textSecondary }}>Last sync</th>
                <th style={{ color: colors.textSecondary }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: 24, color: colors.textSecondary }}>
                    Loading…
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: 24, color: colors.textSecondary }}>
                    No fiscal profiles match the current filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((row) => (
                  <tr key={row.customerId}>
                    <td style={{ color: colors.text, minWidth: 180 }}>
                      <Link
                        to={`/customers/${row.customerId}`}
                        style={{ color: colors.accent, textDecoration: "none", fontWeight: 600 }}
                      >
                        {row.customerName || row.customerEmail || "—"}
                      </Link>
                      {row.customerEmail ? (
                        <div style={{ fontSize: 11, color: colors.textTertiary }}>
                          {row.customerEmail}
                        </div>
                      ) : null}
                    </td>
                    <td style={{ color: colors.text }}>{row.country ?? "—"}</td>
                    <td style={{ color: colors.text }}>{row.currency}</td>
                    <td style={{ color: colors.text, maxWidth: 220 }}>
                      {providerDisplayLabel(
                        row.provider,
                        row.providerLabel,
                        row.fiscalConfigurationLabel,
                      )}
                    </td>
                    <td style={{ color: colors.text }}>{providerTypeLabel(row.providerType)}</td>
                    <td>
                      <span className={`status-badge ${fiscalStatusBadgeClass(row.fiscalStatus)}`}>
                        {fiscalStatusLabel(row.fiscalStatus)}
                      </span>
                    </td>
                    <td style={{ color: colors.text }}>{receiptModeLabel(row.receiptMode)}</td>
                    <td style={{ color: colors.text }}>
                      {row.posDownloadAllowed ? "Allowed" : "Blocked"}
                    </td>
                    <td style={{ color: colors.text, whiteSpace: "nowrap" }}>
                      {formatFiscalDate(row.lastSyncAt)}
                    </td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        <Link
                          to={`/customers/${row.customerId}`}
                          style={{
                            fontSize: 11,
                            padding: "4px 8px",
                            borderRadius: 6,
                            border: `1px solid ${colors.border}`,
                            background: colors.bgSecondary,
                            color: colors.accent,
                            textDecoration: "none",
                          }}
                        >
                          View customer
                        </Link>
                        <DisabledAction label="Start setup" colors={colors} />
                        <DisabledAction label="Mark active" colors={colors} />
                        <DisabledAction label="View logs" colors={colors} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
