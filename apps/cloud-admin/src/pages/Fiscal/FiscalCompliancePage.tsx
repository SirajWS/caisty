import { Fragment, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Button,
  DataTable,
  DataTableRow,
  FiscalStatusPill,
  KpiCard,
  PageHeader,
  SearchInput,
  SectionHeader,
  Select,
  StatusPill,
  Toolbar,
} from "../../components/ui";
import {
  fetchCountryConfigList,
  type CountryConfigPublic,
} from "../../lib/countryConfigApi";
import {
  fetchFiscalOverview,
  type AdminFiscalOverviewItem,
  type FiscalOverviewSummary,
} from "../../lib/fiscalApi";
import { apiGet } from "../../lib/api";
import {
  buildGroupHeaderStats,
  countryFlagEmoji,
  deriveFiscalAmpel,
  filterFiscalOverviewItems,
  groupFiscalOverviewItems,
  type FiscalStatusFilter,
} from "../../lib/fiscalComplianceView";
import {
  formatFiscalDate,
  formatReceiptMode,
  formatProviderLabel,
  providerTypeLabel,
} from "../../lib/caistyTerminology";

type DeviceRow = {
  id: string;
  customerId?: string | null;
  fingerprint?: string | null;
};

type DevicesResponse = {
  items?: DeviceRow[];
};

const EMPTY_SUMMARY: FiscalOverviewSummary = {
  totalProfiles: 0,
  germanyFiskalyPending: 0,
  fiscalRequiredPending: 0,
  activeSetups: 0,
  comingSoonCountries: 0,
  standardReceiptMode: 0,
  actionNeeded: 0,
  allOk: 0,
  fiscalCountriesActive: 0,
  withoutFiscalization: 0,
};

function formatSurcharge(cents: number, currency: string): string {
  if (cents <= 0) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency || "EUR",
  }).format(cents / 100);
}

function GroupSection({
  title,
  items,
  deviceCounts,
  expandedId,
  onToggle,
}: {
  title: string;
  items: AdminFiscalOverviewItem[];
  deviceCounts: Record<string, number>;
  expandedId: string | null;
  onToggle: (customerId: string) => void;
}) {
  const stats = buildGroupHeaderStats(items);
  if (items.length === 0) return null;

  const pill = `${stats.customerCount} customer${stats.customerCount === 1 ? "" : "s"}${
    stats.pendingCount > 0 ? ` · ${stats.pendingCount} pending` : ""
  }`;

  return (
    <section className="ds-section-block">
      <SectionHeader
        title={title}
        pill={pill}
        subline={`${stats.countries.join(" · ") || "—"} · ${stats.providers.join(" · ") || "—"} · ${
          stats.receiptModes.map((m) => formatReceiptMode(m)).join(" · ") || "—"
        }`}
      />
      <DataTable>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Country</th>
            <th>Status</th>
            <th>Receipt mode</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => {
            const expanded = expandedId === row.customerId;
            const ampel = deriveFiscalAmpel(row);
            return (
              <Fragment key={row.customerId}>
                <DataTableRow
                  expanded={expanded}
                  onClick={() => onToggle(row.customerId)}
                >
                  <td>
                    <div className="ds-customer-name">
                      {row.customerName || row.customerEmail || "—"}
                    </div>
                    {row.customerEmail ? (
                      <div className="ds-customer-email">{row.customerEmail}</div>
                    ) : null}
                  </td>
                  <td>
                    {row.country ? (
                      <>
                        {countryFlagEmoji(row.country)} {row.country} · {row.currency}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <StatusPill
                      tone={ampel.tone === "yellow" ? "amber" : ampel.tone}
                      label={ampel.label}
                    />
                  </td>
                  <td>{formatReceiptMode(row.receiptMode)}</td>
                  <td>
                    <Button
                      variant="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle(row.customerId);
                      }}
                    >
                      Details
                    </Button>
                  </td>
                </DataTableRow>
                {expanded ? (
                  <DataTableRow detail>
                    <td colSpan={5}>
                      <div className="ds-detail-grid">
                        <div className="ds-detail-item">
                          <div className="ds-detail-label">Provider</div>
                          <div className="ds-detail-value">
                            {formatProviderLabel(
                              row.provider,
                              row.providerLabel,
                              row.fiscalConfigurationLabel,
                            )}
                          </div>
                        </div>
                        <div className="ds-detail-item">
                          <div className="ds-detail-label">Provider type</div>
                          <div className="ds-detail-value">
                            {providerTypeLabel(row.providerType)}
                          </div>
                        </div>
                        <div className="ds-detail-item">
                          <div className="ds-detail-label">Last sync</div>
                          <div className="ds-detail-value">
                            {formatFiscalDate(row.lastSyncAt)}
                          </div>
                        </div>
                        <div className="ds-detail-item">
                          <div className="ds-detail-label">POS download</div>
                          <div className="ds-detail-value">
                            {row.posDownloadAllowed ? "Allowed" : "Blocked"}
                          </div>
                        </div>
                        <div className="ds-detail-item">
                          <div className="ds-detail-label">Devices</div>
                          <div className="ds-detail-value">
                            {deviceCounts[row.customerId] ?? 0}
                          </div>
                        </div>
                        <div className="ds-detail-item">
                          <div className="ds-detail-label">Actions</div>
                          <div className="ds-detail-value">
                            <Link
                              to={`/customers/${row.customerId}`}
                              className="ds-link"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Open customer
                            </Link>
                          </div>
                        </div>
                      </div>
                    </td>
                  </DataTableRow>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </DataTable>
    </section>
  );
}

export default function FiscalCompliancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<AdminFiscalOverviewItem[]>([]);
  const [summary, setSummary] = useState<FiscalOverviewSummary>(EMPTY_SUMMARY);
  const [countryRules, setCountryRules] = useState<CountryConfigPublic[]>([]);
  const [deviceCounts, setDeviceCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FiscalStatusFilter>(
    (searchParams.get("status") as FiscalStatusFilter) || "all",
  );
  const [customerFilter, setCustomerFilter] = useState(
    searchParams.get("customerId") ?? "",
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [fiscalRes, devicesRes, countries] = await Promise.all([
          fetchFiscalOverview(500),
          apiGet<DevicesResponse>("/devices").catch(() => ({ items: [] })),
          fetchCountryConfigList().catch(() => []),
        ]);
        if (cancelled) return;
        setItems(fiscalRes.items ?? []);
        setSummary({ ...EMPTY_SUMMARY, ...(fiscalRes.summary ?? {}) });
        setCountryRules(countries);
        const counts: Record<string, number> = {};
        const seen = new Set<string>();
        for (const dev of devicesRes.items ?? []) {
          if (!dev.customerId) continue;
          const key = dev.fingerprint || dev.id;
          const composite = `${dev.customerId}::${key}`;
          if (seen.has(composite)) continue;
          seen.add(composite);
          counts[dev.customerId] = (counts[dev.customerId] ?? 0) + 1;
        }
        setDeviceCounts(counts);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Fiscal overview could not be loaded.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredItems = useMemo(
    () =>
      filterFiscalOverviewItems(items, {
        search,
        statusFilter,
        customerId: customerFilter || undefined,
      }),
    [items, search, statusFilter, customerFilter],
  );

  const { fiscalRequired, noFiscalRequired } = useMemo(
    () => groupFiscalOverviewItems(filteredItems),
    [filteredItems],
  );

  function updateStatusFilter(value: FiscalStatusFilter) {
    setStatusFilter(value);
    const next = new URLSearchParams(searchParams);
    if (value === "all") next.delete("status");
    else next.set("status", value);
    setSearchParams(next, { replace: true });
  }

  return (
    <div className="admin-page">
      <PageHeader
        title="Fiscal / Compliance"
        subtitle="Overview by fiscal requirement — grouped with traffic-light status and country rules."
      />

      {error ? <div className="admin-error-banner">{error}</div> : null}

      <div className="ds-kpi-grid">
        <KpiCard label="Action needed" value={summary.actionNeeded} />
        <KpiCard label="All OK" value={summary.allOk} />
        <KpiCard label="Fiscal countries active" value={summary.fiscalCountriesActive} />
        <KpiCard label="Without fiscalization" value={summary.withoutFiscalization} />
      </div>

      {customerFilter ? (
        <Toolbar>
          <span className="ds-muted">
            Filtered to customer <strong>{customerFilter.slice(0, 8)}…</strong>
          </span>
          <Button
            variant="secondary"
            onClick={() => {
              setCustomerFilter("");
              const next = new URLSearchParams(searchParams);
              next.delete("customerId");
              setSearchParams(next, { replace: true });
            }}
          >
            Clear filter
          </Button>
        </Toolbar>
      ) : null}

      <Toolbar
        footer={
          loading
            ? "Loading fiscal profiles…"
            : `${filteredItems.length} of ${items.length} profiles`
        }
      >
        <SearchInput
          placeholder="Search customer, country, provider…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          value={statusFilter}
          onChange={(e) => updateStatusFilter(e.target.value as FiscalStatusFilter)}
        >
          <option value="all">All statuses</option>
          <option value="action_needed">Action needed</option>
          <option value="setup_running">Setup running</option>
          <option value="ok">OK</option>
          <option value="no_country">No country</option>
        </Select>
      </Toolbar>

      {loading ? (
        <div className="ds-table-card" style={{ padding: 24, textAlign: "center" }}>
          <span className="ds-muted">Loading…</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="ds-table-card" style={{ padding: 24, textAlign: "center" }}>
          <span className="ds-muted">No profiles match the current filters.</span>
        </div>
      ) : (
        <>
          <GroupSection
            title="Fiscalization required"
            items={fiscalRequired}
            deviceCounts={deviceCounts}
            expandedId={expandedId}
            onToggle={(id) => setExpandedId((prev) => (prev === id ? null : id))}
          />
          <GroupSection
            title="No fiscalization required"
            items={noFiscalRequired}
            deviceCounts={deviceCounts}
            expandedId={expandedId}
            onToggle={(id) => setExpandedId((prev) => (prev === id ? null : id))}
          />
        </>
      )}

      <section className="ds-card ds-section-block ds-section-block--spaced">
        <h2 className="ds-section-title">Country rules</h2>
        <p className="ds-muted" style={{ marginBottom: 14 }}>
          Central configuration — changes currently via deployment.
        </p>
        <DataTable>
          <thead>
            <tr>
              <th>Country</th>
              <th>Currency</th>
              <th>Fiscal provider</th>
              <th>Receipt mode</th>
              <th>Surcharge</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {countryRules.length === 0 ? (
              <tr>
                <td colSpan={6} className="ds-muted" style={{ textAlign: "center" }}>
                  Country rules could not be loaded.
                </td>
              </tr>
            ) : (
              countryRules.map((rule) => (
                <tr key={rule.code}>
                  <td>
                    {countryFlagEmoji(rule.code)} {rule.code} — {rule.nameEn}
                  </td>
                  <td>{rule.currency}</td>
                  <td>{rule.fiscalProvider ?? "—"}</td>
                  <td>{formatReceiptMode(rule.receiptMode)}</td>
                  <td>{formatSurcharge(rule.fiscalSurchargeCents, rule.currency)}</td>
                  <td>{rule.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </DataTable>
      </section>
    </div>
  );
}
