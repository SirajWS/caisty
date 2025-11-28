// apps/cloud-admin/src/pages/Customers/CustomersListPage.tsx
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPatch, apiDelete } from "../../lib/api";
import { Link } from "react-router-dom";

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

        const [customersRes, devicesRes] = await Promise.all([
          apiGet<CustomersResponse>("/customers"),
          apiGet<DevicesResponse>("/devices"),
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

  // aktive vs. inaktive Kunden aufteilen (mit Suche)
  const { activeItems, inactiveItems } = useMemo(() => {
    const term = search.trim().toLowerCase();

    const matchesSearch = (c: Customer) => {
      if (!term) return true;
      const id = c.id?.toLowerCase() ?? "";
      const name = c.name?.toLowerCase() ?? "";
      const email = c.email?.toLowerCase() ?? "";
      return id.includes(term) || name.includes(term) || email.includes(term);
    };

    const actives: Customer[] = [];
    const inactives: Customer[] = [];

    for (const c of items) {
      if (!matchesSearch(c)) continue;
      const status = (c.status ?? "").toLowerCase();
      if (status === "inactive") {
        inactives.push(c);
      } else {
        actives.push(c);
      }
    }

    return { activeItems: actives, inactiveItems: inactives };
  }, [items, search]);

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
      <h1 className="admin-page-title">Customers</h1>
      <p className="admin-page-subtitle">
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
        <div style={{ fontSize: 13, color: "#9ca3af" }}>
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
            border: "1px solid #374151",
            background: "#020617",
            color: "#e5e7eb",
            fontSize: 13,
          }}
        />
      </div>

      {error && <div className="admin-error-banner">{error}</div>}

      {/* Aktive Kunden */}
      <div className="admin-card" style={{ marginBottom: 24 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>E-Mail</th>
              <th>Status</th>
              <th>Devices</th>
              <th>Erstellt am</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 24 }}>
                  Lädt Kunden…
                </td>
              </tr>
            ) : activeItems.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 24 }}>
                  Keine aktiven Kunden gefunden.
                </td>
              </tr>
            ) : (
              activeItems.map((c) => {
                const devicesForCustomer = deviceCounts[c.id] ?? 0;

                return (
                  <tr key={c.id}>
                    <td>{c.id.slice(0, 8)}…</td>
                    <td>
                      <Link
                        to={`/customers/${c.id}`}
                        style={{ color: "#a855f7" }}
                      >
                        {c.name || c.email}
                      </Link>
                    </td>
                    <td>{c.email}</td>
                    <td>
                      <span
                        className={`status-badge status-${
                          c.status ?? "unknown"
                        }`}
                      >
                        {c.status ?? "—"}
                      </span>
                    </td>
                    <td>{devicesForCustomer}</td>
                    <td>
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
                          border: "1px solid #6b7280",
                          background:
                            statusBusyId === c.id ? "#4b5563" : "#374151",
                          color: "#e5e7eb",
                          cursor:
                            statusBusyId === c.id ? "default" : "pointer",
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

      {/* Inaktive Kunden / Trash */}
      <div className="admin-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <h2 className="admin-section-title">Inaktive Kunden (Trash)</h2>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>
            Diese Kunden erscheinen nicht mehr in der normalen Übersicht oder im
            Dashboard.
          </span>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>E-Mail</th>
              <th>Status</th>
              <th>Devices</th>
              <th>Erstellt am</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {inactiveItems.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 24 }}>
                  Keine inaktiven Kunden.
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
                    <td>
                      <span
                        className={`status-badge status-${
                          c.status ?? "unknown"
                        }`}
                      >
                        {c.status ?? "—"}
                      </span>
                    </td>
                    <td>{devicesForCustomer}</td>
                    <td>
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
                          border: "1px solid #b91c1c",
                          background:
                            deleteBusyId === c.id ? "#7f1d1d" : "#b91c1c",
                          color: "#fee2e2",
                          cursor:
                            deleteBusyId === c.id ? "default" : "pointer",
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
  );
}
