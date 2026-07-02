// apps/cloud-admin/src/pages/Customers/CustomersListPage.tsx
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPatch, apiDelete } from "../../lib/api";
import { Link } from "react-router-dom";
import { useTheme, themeColors } from "../../theme/ThemeContext";
import {
  fetchFiscalOverview,
  type AdminFiscalOverviewItem,
} from "../../lib/fiscalApi";
import {
  fiscalStatusBadgeClass,
  formatFiscalStatus,
  formatProviderLabel,
  formatReceiptMode,
  providerTypeLabel,
} from "../../lib/caistyTerminology";

type Customer = {
  id: string;
  name: string;
  email: string;
  status?: string | null;
  createdAt?: string | null;
  profile?: unknown | null;
};

type CustomersResponse = {
  items: Customer[];
  total: number;
  limit: number;
  offset: number;
};

// Minimale Device-Infos, um pro Kunde nach Hardware-ID zu zählen
type DevicesResponse = {
  items: {
    id: string;
    customerId: string | null;
    fingerprint: string | null;
  }[];
  total: number;
};

export default function CustomersListPage() {
  const { theme } = useTheme();
  const colors = themeColors[theme];
  const [items, setItems] = useState<Customer[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [fiscalStatusFilter, setFiscalStatusFilter] = useState("");
  const [fiscalByCustomer, setFiscalByCustomer] = useState<
    Record<string, AdminFiscalOverviewItem>
  >({});

  // Geräte-Anzahl pro Kunde (nach Hardware-ID gruppiert)
  const [deviceCounts, setDeviceCounts] = useState<Record<string, number>>(
    {},
  );
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [customersRes, devicesRes, fiscalRes] = await Promise.all([
          apiGet<CustomersResponse>("/customers"),
          apiGet<DevicesResponse>("/devices"),
          fetchFiscalOverview(500).catch(() => ({
            ok: false as const,
            items: [] as AdminFiscalOverviewItem[],
            total: 0,
            summary: {
              totalProfiles: 0,
              germanyFiskalyPending: 0,
              activeSetups: 0,
              comingSoonCountries: 0,
              standardReceiptMode: 0,
            },
          })),
        ]);

        if (cancelled) return;

        const customers = customersRes.items ?? [];
        setItems(customers);
        setTotal(customersRes.total ?? customers.length);

        // pro Kunde nach Hardware-ID (Fingerprint / id) zählen
        const counts: Record<string, number> = {};
        const seen = new Set<string>();

        for (const dev of devicesRes.items ?? []) {
          if (!dev.customerId) continue;
          const deviceKey = dev.fingerprint || dev.id;
          const compositeKey = `${dev.customerId}::${deviceKey}`;
          if (seen.has(compositeKey)) continue;
          seen.add(compositeKey);

          counts[dev.customerId] = (counts[dev.customerId] ?? 0) + 1;
        }

        setDeviceCounts(counts);

        const fiscalMap: Record<string, AdminFiscalOverviewItem> = {};
        for (const row of fiscalRes.items ?? []) {
          if (row.customerId) fiscalMap[row.customerId] = row;
        }
        setFiscalByCustomer(fiscalMap);
      } catch (err) {
        console.error("Error loading customers/devices", err);
        if (!cancelled) {
          setError("Fehler beim Laden der Kunden.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const countryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const row of Object.values(fiscalByCustomer)) {
      if (row.country) set.add(row.country);
    }
    return Array.from(set).sort();
  }, [fiscalByCustomer]);

  // aktive vs. inaktive Kunden aufteilen (mit Suche + Fiscal-Filtern)
  const { activeItems, inactiveItems } = useMemo(() => {
    const term = search.trim().toLowerCase();

    const matchesSearch = (c: Customer) => {
      if (!term) return true;
      const id = c.id?.toLowerCase() ?? "";
      const name = c.name?.toLowerCase() ?? "";
      const email = c.email?.toLowerCase() ?? "";
      return id.includes(term) || name.includes(term) || email.includes(term);
    };

    const matchesFiscal = (c: Customer) => {
      const fiscal = fiscalByCustomer[c.id];
      if (countryFilter && (fiscal?.country ?? "") !== countryFilter) return false;
      if (fiscalStatusFilter && (fiscal?.fiscalStatus ?? "") !== fiscalStatusFilter) {
        return false;
      }
      return true;
    };

    const actives: Customer[] = [];
    const inactives: Customer[] = [];

    for (const c of items) {
      if (!matchesSearch(c) || !matchesFiscal(c)) continue;
      const status = (c.status ?? "").toLowerCase();
      if (status === "inactive") {
        inactives.push(c);
      } else {
        actives.push(c);
      }
    }

    return { activeItems: actives, inactiveItems: inactives };
  }, [items, search, countryFilter, fiscalStatusFilter, fiscalByCustomer]);

  async function handleArchiveCustomer(c: Customer) {
    const devicesForCustomer = deviceCounts[c.id] ?? 0;

    const confirmed = window.confirm(
      `Kunde "${c.name || c.email}" inaktiv setzen?\n\n` +
        `Der Kunde erscheint dann nicht mehr in der normalen Übersicht und im Dashboard.\n` +
        (devicesForCustomer > 0
          ? `Hinweis: Es sind noch ${devicesForCustomer} Gerät(e) diesem Kunden zugeordnet.`
          : ""),
    );

    if (!confirmed) return;

    try {
      setStatusBusyId(c.id);
      setError(null);

      const res = await apiPatch<{ status: string }, { item: Customer }>(
        `/customers/${c.id}/status`,
        { status: "inactive" },
      );

      const updated = res.item;

      setItems((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, ...updated } : x)),
      );
    } catch (err) {
      console.error("Error updating customer status", err);
      setError("Status des Kunden konnte nicht geändert werden.");
    } finally {
      setStatusBusyId(null);
    }
  }

  async function handleDeleteCustomer(c: Customer) {
    const devicesForCustomer = deviceCounts[c.id] ?? 0;

    const confirmed = window.confirm(
      `Kunde "${c.name || c.email}" endgültig löschen?\n\n` +
        `Dieser Vorgang kann nicht rückgängig gemacht werden.` +
        (devicesForCustomer > 0
          ? `\nHinweis: Es sind noch ${devicesForCustomer} Gerät(e) diesem Kunden zugeordnet. Die Zuordnung wird beim Löschen entfernt.`
          : ""),
    );

    if (!confirmed) return;

    try {
      setDeleteBusyId(c.id);
      setError(null);

      await apiDelete<{ ok: boolean }>(`/customers/${c.id}`);

      // komplett aus der Liste entfernen
      setItems((prev) => prev.filter((x) => x.id !== c.id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error deleting customer", err);
      setError("Kunde konnte nicht gelöscht werden.");
    } finally {
      setDeleteBusyId(null);
    }
  }

  return (
    <div className="admin-page">
      <h1
        style={{
          fontSize: "32px",
          fontWeight: 700,
          marginBottom: "8px",
          color: colors.text,
          letterSpacing: "-0.5px",
        }}
      >
        Customers
      </h1>
      <p
        style={{
          fontSize: "14px",
          color: colors.textSecondary,
          marginBottom: "24px",
        }}
      >
        Übersicht über alle Kunden in dieser Instanz.
      </p>

      {/* Filter / Info-Leiste */}
      <div
        style={{
          marginTop: 16,
          marginBottom: 16,
          display: "flex",
          gap: 16,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 13, color: colors.textSecondary }}>
          {activeItems.length} aktive von {total} Kunden angezeigt
        </div>

        <input
          type="text"
          placeholder="Suche nach Name, E-Mail oder ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            minWidth: 260,
            padding: "6px 10px",
            borderRadius: 6,
            border: `1px solid ${colors.borderSecondary}`,
            background: colors.input,
            color: colors.text,
            fontSize: 13,
            transition: "all 0.2s",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = colors.accent;
            e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.accent}20`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = colors.borderSecondary;
            e.currentTarget.style.boxShadow = "none";
          }}
        />

        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          style={{
            padding: "6px 10px",
            borderRadius: 6,
            border: `1px solid ${colors.borderSecondary}`,
            background: colors.input,
            color: colors.text,
            fontSize: 13,
          }}
        >
          <option value="">All countries</option>
          {countryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={fiscalStatusFilter}
          onChange={(e) => setFiscalStatusFilter(e.target.value)}
          style={{
            padding: "6px 10px",
            borderRadius: 6,
            border: `1px solid ${colors.borderSecondary}`,
            background: colors.input,
            color: colors.text,
            fontSize: 13,
          }}
        >
          <option value="">All fiscal statuses</option>
          <option value="not_required">Not required</option>
          <option value="pending_setup">Pending setup</option>
          <option value="active">Active</option>
          <option value="required_coming_soon">Required — coming soon</option>
          <option value="error">Error</option>
        </select>
      </div>

      {error && (
        <div
          className="admin-error-banner"
          style={{
            backgroundColor: colors.errorBg,
            borderColor: `${colors.error}50`,
            color: colors.error,
          }}
        >
          {error}
        </div>
      )}

      {/* Aktive Kunden */}
      <div
        className="admin-card"
        style={{
          marginBottom: 24,
          backgroundColor: colors.bgSecondary,
          borderColor: colors.border,
          transition: "background-color 0.3s, border-color 0.3s",
        }}
      >
        <div
          className="admin-table-wrapper"
          style={{
            backgroundColor: colors.bgSecondary,
            borderColor: colors.border,
            transition: "background-color 0.3s, border-color 0.3s",
          }}
        >
          <table className="admin-table">
            <thead>
              <tr style={{ backgroundColor: colors.bgTertiary }}>
                <th style={{ color: colors.textSecondary }}>ID</th>
                <th style={{ color: colors.textSecondary }}>Name</th>
                <th style={{ color: colors.textSecondary }}>E-Mail</th>
                <th style={{ color: colors.textSecondary }}>Country</th>
                <th style={{ color: colors.textSecondary }}>Fiscal status</th>
                <th style={{ color: colors.textSecondary }}>Provider</th>
                <th style={{ color: colors.textSecondary }}>Status</th>
                <th style={{ color: colors.textSecondary }}>Devices</th>
                <th style={{ color: colors.textSecondary }}>Erstellt am</th>
                <th style={{ color: colors.textSecondary }}>Aktionen</th>
              </tr>
            </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={10}
                  style={{
                    textAlign: "center",
                    padding: 24,
                    color: colors.textSecondary,
                  }}
                >
                  Lädt Kunden…
                </td>
              </tr>
            ) : activeItems.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  style={{
                    textAlign: "center",
                    padding: 24,
                    color: colors.textSecondary,
                  }}
                >
                  Keine aktiven Kunden gefunden.
                </td>
              </tr>
            ) : (
              activeItems.map((c) => {
                const devicesForCustomer = deviceCounts[c.id] ?? 0;
                const fiscal = fiscalByCustomer[c.id];

                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottomColor: colors.border,
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.bgTertiary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <td style={{ color: colors.text }}>
                      {c.id.slice(0, 8)}…
                    </td>
                    <td style={{ color: colors.text }}>
                      <Link
                        to={`/customers/${c.id}`}
                        style={{
                          color: colors.accent,
                          textDecoration: "none",
                          transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = colors.accentHover;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = colors.accent;
                        }}
                      >
                        {c.name || c.email}
                      </Link>
                    </td>
                    <td style={{ color: colors.text }}>{c.email}</td>
                    <td style={{ color: colors.text }}>
                      {fiscal?.country ? (
                        <span
                          style={{
                            fontSize: 11,
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: colors.bgTertiary,
                            border: `1px solid ${colors.border}`,
                          }}
                        >
                          {fiscal.country}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {fiscal ? (
                        <span
                          className={`status-badge ${fiscalStatusBadgeClass(fiscal.fiscalStatus)}`}
                          style={{ fontSize: 11 }}
                        >
                          {formatFiscalStatus(fiscal.fiscalStatus)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={{ color: colors.text, maxWidth: 180 }}>
                      {fiscal ? (
                        <span
                          style={{
                            fontSize: 11,
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: colors.bgTertiary,
                            border: `1px solid ${colors.border}`,
                          }}
                          title={formatProviderLabel(
                            fiscal.provider,
                            fiscal.providerLabel,
                            fiscal.fiscalConfigurationLabel,
                          )}
                        >
                          {fiscal.provider === "fiskaly"
                            ? "Fiskaly"
                            : fiscal.providerType === "coming_soon"
                              ? "Coming soon"
                              : "Standard"}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <span
                        className={`status-badge status-${
                          c.status ?? "unknown"
                        }`}
                      >
                        {c.status ?? "—"}
                      </span>
                    </td>
                    <td style={{ color: colors.text }}>
                      {devicesForCustomer}
                    </td>
                    <td style={{ color: colors.text }}>
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleString("de-DE")
                        : "—"}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleArchiveCustomer(c)}
                        disabled={statusBusyId === c.id}
                        style={{
                          fontSize: 11,
                          padding: "4px 10px",
                          borderRadius: 6,
                          border: `1px solid ${colors.border}`,
                          background:
                            statusBusyId === c.id
                              ? colors.bgTertiary
                              : colors.bgSecondary,
                          color: colors.text,
                          cursor:
                            statusBusyId === c.id ? "default" : "pointer",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          if (statusBusyId !== c.id) {
                            e.currentTarget.style.background = colors.border;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (statusBusyId !== c.id) {
                            e.currentTarget.style.background = colors.bgSecondary;
                          }
                        }}
                      >
                        {statusBusyId === c.id
                          ? "Aktualisiere…"
                          : "Inaktiv setzen"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Inaktive Kunden / Trash */}
      <div
        className="admin-card"
        style={{
          backgroundColor: colors.bgSecondary,
          borderColor: colors.border,
          transition: "background-color 0.3s, border-color 0.3s",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <h2
            className="admin-section-title"
            style={{ color: colors.text }}
          >
            Inaktive Kunden (Trash)
          </h2>
          <span style={{ fontSize: 11, color: colors.textTertiary }}>
            Diese Kunden erscheinen nicht mehr in der normalen Übersicht oder im
            Dashboard.
          </span>
        </div>

        <div
          className="admin-table-wrapper"
          style={{
            backgroundColor: colors.bgSecondary,
            borderColor: colors.border,
            transition: "background-color 0.3s, border-color 0.3s",
          }}
        >
          <table className="admin-table">
            <thead>
              <tr style={{ backgroundColor: colors.bgTertiary }}>
                <th style={{ color: colors.textSecondary }}>ID</th>
                <th style={{ color: colors.textSecondary }}>Name</th>
                <th style={{ color: colors.textSecondary }}>E-Mail</th>
                <th style={{ color: colors.textSecondary }}>Status</th>
                <th style={{ color: colors.textSecondary }}>Devices</th>
                <th style={{ color: colors.textSecondary }}>Erstellt am</th>
                <th style={{ color: colors.textSecondary }}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {inactiveItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: 24,
                      color: colors.textSecondary,
                    }}
                  >
                    Keine inaktiven Kunden.
                  </td>
                </tr>
              ) : (
              inactiveItems.map((c) => {
                const devicesForCustomer = deviceCounts[c.id] ?? 0;

                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottomColor: colors.border,
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.bgTertiary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <td style={{ color: colors.text }}>
                      {c.id.slice(0, 8)}…
                    </td>
                    <td style={{ color: colors.text }}>
                      {c.name || c.email}
                    </td>
                    <td style={{ color: colors.text }}>{c.email}</td>
                    <td>
                      <span
                        className={`status-badge status-${
                          c.status ?? "unknown"
                        }`}
                      >
                        {c.status ?? "—"}
                      </span>
                    </td>
                    <td style={{ color: colors.text }}>
                      {devicesForCustomer}
                    </td>
                    <td style={{ color: colors.text }}>
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleString("de-DE")
                        : "—"}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomer(c)}
                        disabled={deleteBusyId === c.id}
                        style={{
                          fontSize: 11,
                          padding: "4px 10px",
                          borderRadius: 6,
                          border: `1px solid ${colors.error}`,
                          background:
                            deleteBusyId === c.id
                              ? colors.errorBg
                              : colors.error,
                          color: theme === "dark" ? "#fee2e2" : "#ffffff",
                          cursor:
                            deleteBusyId === c.id ? "default" : "pointer",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          if (deleteBusyId !== c.id) {
                            e.currentTarget.style.opacity = "0.9";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (deleteBusyId !== c.id) {
                            e.currentTarget.style.opacity = "1";
                          }
                        }}
                      >
                        {deleteBusyId === c.id ? "Löschen…" : "Löschen"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
