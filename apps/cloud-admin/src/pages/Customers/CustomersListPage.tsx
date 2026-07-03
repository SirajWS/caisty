// apps/cloud-admin/src/pages/Customers/CustomersListPage.tsx
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPatch, apiDelete } from "../../lib/api";
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
      `Set customer "${c.name || c.email}" to inactive?\n\n` +
        `The customer will no longer appear in the default overview or dashboard.` +
        (devicesForCustomer > 0
          ? `\nNote: ${devicesForCustomer} device(s) are still linked to this customer.`
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
      setError("Could not update customer status.");
    } finally {
      setStatusBusyId(null);
    }
  }

  async function handleDeleteCustomer(c: Customer) {
    const devicesForCustomer = deviceCounts[c.id] ?? 0;

    const confirmed = window.confirm(
      `Permanently delete customer "${c.name || c.email}"?\n\n` +
        `This action cannot be undone.` +
        (devicesForCustomer > 0
          ? `\nNote: ${devicesForCustomer} device(s) are linked — assignments will be removed on delete.`
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
      setError("Could not delete customer.");
    } finally {
      setDeleteBusyId(null);
    }
  }

  function accountStatusPill(status: string | null | undefined) {
    const normalized = (status ?? "").toLowerCase();
    if (normalized === "active") {
      return <StatusPill tone="green" label="Active" />;
    }
    if (normalized === "inactive") {
      return <StatusPill tone="gray" label="Inactive" />;
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
                      <Link to={`/customers/${c.id}`} className="ds-link">
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
                        disabled={statusBusyId === c.id}
                        onClick={() => handleArchiveCustomer(c)}
                      >
                        {statusBusyId === c.id ? "Updating…" : "Set inactive"}
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
          title="Inactive customers (trash)"
          subline="These customers no longer appear in the default overview or dashboard."
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
                    <td>{c.name || c.email}</td>
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
                        variant="danger"
                        disabled={deleteBusyId === c.id}
                        onClick={() => handleDeleteCustomer(c)}
                      >
                        {deleteBusyId === c.id ? "Deleting…" : "Delete"}
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
