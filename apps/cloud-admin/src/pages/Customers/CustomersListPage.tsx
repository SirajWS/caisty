// apps/cloud-admin/src/pages/Customers/CustomersListPage.tsx
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPatch } from "../../lib/api";
import {
  applyCustomerStatusUpdate,
  customerDetailPath,
  customerStatusPatchBody,
  isCustomerStatusActionBusy,
  isInactiveCustomerStatus,
  partitionCustomersByAccountStatus,
  RESTORE_CONFIRM_MESSAGE,
  SET_INACTIVE_CONFIRM_MESSAGE,
} from "../../lib/adminCustomerStatus";
import { Link } from "react-router-dom";
import {
  Button,
  DataTable,
  FiscalStatusPill,
  PageHeader,
  SearchInput,
  Select,
  StatusPill,
  Toolbar,
  SectionHeader,
} from "../../components/ui";
import {
  fetchFiscalOverview,
  type AdminFiscalOverviewItem,
} from "../../lib/fiscalApi";

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
  const [success, setSuccess] = useState<string | null>(null);

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
              fiscalRequiredPending: 0,
              activeSetups: 0,
              comingSoonCountries: 0,
              standardReceiptMode: 0,
              actionNeeded: 0,
              allOk: 0,
              fiscalCountriesActive: 0,
              withoutFiscalization: 0,
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
          setError("Failed to load customers.");
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

    const matched = items.filter(
      (c) => matchesSearch(c) && matchesFiscal(c),
    );
    const { active, inactive } = partitionCustomersByAccountStatus(matched);
    return { activeItems: active, inactiveItems: inactive };
  }, [items, search, countryFilter, fiscalStatusFilter, fiscalByCustomer]);

  async function handleSetCustomerStatus(
    c: Customer,
    status: "active" | "inactive",
  ) {
    if (isCustomerStatusActionBusy(statusBusyId, c.id)) return;

    const confirmed = window.confirm(
      status === "active"
        ? RESTORE_CONFIRM_MESSAGE
        : SET_INACTIVE_CONFIRM_MESSAGE,
    );
    if (!confirmed) return;

    setStatusBusyId(c.id);
    setError(null);
    setSuccess(null);

    try {
      const res = await apiPatch<{ status: string }, { item: Customer }>(
        `/customers/${c.id}/status`,
        customerStatusPatchBody(status),
      );
      const updated = res.item ?? { ...c, status };
      setItems((prev) => applyCustomerStatusUpdate(prev, { ...c, ...updated }));
      setSuccess(
        status === "active"
          ? "Customer restored to the active list. Licenses and devices were not changed."
          : "Customer set to inactive. Licenses and devices were not changed.",
      );
    } catch (err) {
      console.error("Error updating customer status", err);
      setError(
        err instanceof Error ? err.message : "Could not update customer status.",
      );
    } finally {
      setStatusBusyId(null);
    }
  }

  function accountStatusPill(status: string | null | undefined) {
    if (isInactiveCustomerStatus(status)) {
      return <StatusPill tone="gray" label="Inactive" />;
    }
    const normalized = (status ?? "").toLowerCase();
    if (normalized === "active") {
      return <StatusPill tone="green" label="Active" />;
    }
    return <StatusPill tone="gray" label={status ?? "Unknown"} />;
  }

  return (
    <div className="admin-page">
      <PageHeader
        title="Customers"
        subtitle="Overview of all customers in this instance."
      />

      <Toolbar
        footer={`${activeItems.length} active of ${total} customers shown`}
      >
        <SearchInput
          placeholder="Search by name, email, or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
        >
          <option value="">All countries</option>
          {countryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select
          value={fiscalStatusFilter}
          onChange={(e) => setFiscalStatusFilter(e.target.value)}
        >
          <option value="">All fiscal statuses</option>
          <option value="not_required">Not required</option>
          <option value="pending_setup">Pending setup</option>
          <option value="active">Active</option>
          <option value="required_coming_soon">Required — coming soon</option>
          <option value="error">Error</option>
        </Select>
      </Toolbar>

      {error ? <div className="admin-error-banner">{error}</div> : null}
      {success ? <div className="admin-success-banner">{success}</div> : null}

      <div className="ds-section-block">
        <DataTable>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Country</th>
              <th>Fiscal status</th>
              <th>Provider</th>
              <th>Status</th>
              <th>Devices</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="ds-muted" style={{ textAlign: "center", padding: 24 }}>
                  Loading customers…
                </td>
              </tr>
            ) : activeItems.length === 0 ? (
              <tr>
                <td colSpan={10} className="ds-muted" style={{ textAlign: "center", padding: 24 }}>
                  No active customers found.
                </td>
              </tr>
            ) : (
              activeItems.map((c) => {
                const devicesForCustomer = deviceCounts[c.id] ?? 0;
                const fiscal = fiscalByCustomer[c.id];

                return (
                  <tr key={c.id}>
                    <td>{c.id.slice(0, 8)}…</td>
                    <td>
                      <Link to={customerDetailPath(c.id)} className="ds-link">
                        {c.name || c.email}
                      </Link>
                    </td>
                    <td>{c.email}</td>
                    <td>
                      {fiscal?.country ? (
                        <span className="ds-section-pill">{fiscal.country}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <FiscalStatusPill fiscal={fiscal} />
                    </td>
                    <td>
                      {fiscal ? (
                        <span className="ds-muted">
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
                    <td>{accountStatusPill(c.status)}</td>
                    <td>{devicesForCustomer}</td>
                    <td>
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleString("en-GB")
                        : "—"}
                    </td>
                    <td>
                      <Button
                        variant="secondary"
                        disabled={isCustomerStatusActionBusy(statusBusyId, c.id)}
                        onClick={() => void handleSetCustomerStatus(c, "inactive")}
                      >
                        {isCustomerStatusActionBusy(statusBusyId, c.id)
                          ? "Updating…"
                          : "Set inactive"}
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </DataTable>
      </div>

      <div className="ds-section-block">
        <SectionHeader
          title="Inactive customers"
          subline="Administrative classification only. Restore returns the customer to the active Super-Admin list without changing licenses, devices or Portal access."
        />
        <DataTable>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Devices</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inactiveItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="ds-muted" style={{ textAlign: "center", padding: 24 }}>
                  No inactive customers.
                </td>
              </tr>
            ) : (
              inactiveItems.map((c) => {
                const devicesForCustomer = deviceCounts[c.id] ?? 0;
                return (
                  <tr key={c.id}>
                    <td>{c.id.slice(0, 8)}…</td>
                    <td>
                      <Link to={customerDetailPath(c.id)} className="ds-link">
                        {c.name || c.email}
                      </Link>
                    </td>
                    <td>{c.email}</td>
                    <td>{accountStatusPill(c.status)}</td>
                    <td>{devicesForCustomer}</td>
                    <td>
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleString("en-GB")
                        : "—"}
                    </td>
                    <td>
                      <Button
                        variant="secondary"
                        disabled={isCustomerStatusActionBusy(statusBusyId, c.id)}
                        onClick={() => void handleSetCustomerStatus(c, "active")}
                      >
                        {isCustomerStatusActionBusy(statusBusyId, c.id)
                          ? "Restoring…"
                          : "Restore"}
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </DataTable>
      </div>
    </div>
  );
}
