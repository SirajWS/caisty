import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../../lib/api";
import { Link } from "react-router-dom";

type Customer = {
    id: string;
    name: string;
    email: string;
    status?: string | null;
    createdAt?: string | null;
    profile?: unknown | null; // <- neu, wird hier aber nicht benutzt
  };

type CustomersResponse = {
  items: Customer[];
  total: number;
  limit: number;
  offset: number;
};

// Nur das, was wir für die Zählung brauchen
type DevicesResponse = {
  items: {
    id: string;
    customerId: string | null;
  }[];
  total: number;
};

export default function CustomersListPage() {
  const [items, setItems] = useState<Customer[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Anzahl Devices pro Customer
  const [deviceCounts, setDeviceCounts] = useState<Record<string, number>>(
    {},
  );

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

        // Device-Zählung bauen
        const counts: Record<string, number> = {};
        for (const dev of devicesRes.items ?? []) {
          if (!dev.customerId) continue;
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

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;

    return items.filter((c) => {
      const id = c.id?.toLowerCase() ?? "";
      const name = c.name?.toLowerCase() ?? "";
      const email = c.email?.toLowerCase() ?? "";

      return (
        id.includes(term) ||
        name.includes(term) ||
        email.includes(term)
      );
    });
  }, [items, search]);

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
          {filteredItems.length} von {total} Kunden angezeigt
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

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>E-Mail</th>
              <th>Status</th>
              <th>Devices</th>
              <th>Erstellt am</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  style={{ textAlign: "center", padding: 24 }}
                >
                  Lädt Kunden…
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{ textAlign: "center", padding: 24 }}
                >
                  Keine Kunden gefunden.
                </td>
              </tr>
            ) : (
              filteredItems.map((c) => (
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
                  <td>{deviceCounts[c.id] ?? 0}</td>
                  <td>
                    {c.createdAt
                      ? new Date(c.createdAt).toLocaleString("de-DE")
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
